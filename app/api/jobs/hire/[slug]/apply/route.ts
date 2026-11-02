import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DataStore } from '@/app/lib/datastore';
import { requireAuth, validateCsrfOrigin } from '@/app/lib/auth';
import { applyRateLimit } from '@/app/lib/rateLimit';
import { sendEmail } from '@/app/lib/email';
import { sanitizePlainText } from '@/lib/profile';
import {
  validateUploadedResumeFile,
  buildApplicationSubmittedEmails,
} from '@/lib/hr/applyValidation';
import type { ResumeSnapshotData } from '@/lib/hr';

const ApplyRequestJsonSchema = z.object({
  resumeId: z.string().max(120).optional(),
  uploadedFile: z
    .object({
      name: z.string().min(1).max(255),
      size: z.number().int().nonnegative(),
      type: z.string().max(160).optional(),
      contentBase64: z.string().optional(),
      extractedText: z.string().max(30000).optional(),
    })
    .optional(),
  resumeSnapshot: z
    .object({
      resumeId: z.string().max(120).optional(),
      fullName: z.string().max(120).optional(),
      email: z.string().max(160).optional(),
      phone: z.string().max(40).optional(),
      headline: z.string().max(160).optional(),
      summary: z.string().max(5000).optional(),
      skills: z.array(z.string().max(80)).max(60).optional(),
      experienceText: z.string().max(15000).optional(),
      educationText: z.string().max(8000).optional(),
      rawText: z.string().max(30000).optional(),
    })
    .optional(),
  coverLetter: z.string().max(6000).optional(),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1).max(80),
        question: z.string().min(1).max(300),
        answer: z.string().min(1).max(2000),
      })
    )
    .max(10)
    .optional()
    .default([]),
  consentAccepted: z.boolean(),
  consentVersion: z.string().max(32).optional().default('v1.0'),
  sharePhone: z.boolean().optional().default(false),
  shareSalary: z.boolean().optional().default(false),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    if (!validateCsrfOrigin(request)) {
      return NextResponse.json({ ok: false, error: 'INVALID_ORIGIN' }, { status: 403 });
    }

    const rateLimited = await applyRateLimit(request, {
      limit: 10,
      windowMs: 60 * 1000,
      prefix: 'hire_job_apply',
    });
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(request);
    if ('error' in auth) return auth.error;

    const { slug } = await context.params;
    const cleanSlug = String(slug || '').trim().toLowerCase();
    const job = await DataStore.getEmployerJobBySlug(cleanSlug);
    const isExpired =
      job?.expiresAt && new Date(job.expiresAt).getTime() < Date.now();
    if (!job || job.status !== 'published' || isExpired) {
      return NextResponse.json({ ok: false, error: 'JOB_NOT_AVAILABLE' }, { status: 404 });
    }

    const org = await DataStore.getOrganizationById(job.orgId);
    if (!org) {
      return NextResponse.json({ ok: false, error: 'ORG_NOT_FOUND' }, { status: 404 });
    }

    const contentType = request.headers.get('content-type') || '';
    let payload: z.infer<typeof ApplyRequestJsonSchema>;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      let uploadedFileObj: z.infer<typeof ApplyRequestJsonSchema>['uploadedFile'] = undefined;

      if (file && typeof file === 'object' && 'arrayBuffer' in file) {
        const f = file as File;
        const arrBuf = await f.arrayBuffer();
        const bytes = new Uint8Array(arrBuf);
        const validation = validateUploadedResumeFile({
          name: f.name,
          size: f.size,
          type: f.type,
          bytes,
        });
        if (!validation.valid) {
          return NextResponse.json(
            { ok: false, error: validation.error, reason: validation.reason },
            { status: 400 }
          );
        }
        const extractedText =
          validation.extension === '.txt'
            ? new TextDecoder('utf-8', { fatal: false }).decode(bytes).slice(0, 25000)
            : `Uploaded Resume File: ${f.name}`;
        uploadedFileObj = {
          name: f.name,
          size: f.size,
          type: f.type,
          extractedText,
        };
      }

      const rawAnswers = formData.get('answers');
      let parsedAnswers: Array<{ questionId: string; question: string; answer: string }> = [];
      if (typeof rawAnswers === 'string' && rawAnswers.trim()) {
        try {
          parsedAnswers = JSON.parse(rawAnswers);
        } catch {
          parsedAnswers = [];
        }
      }

      const candidatePayload = {
        resumeId: formData.get('resumeId') ? String(formData.get('resumeId')) : undefined,
        uploadedFile: uploadedFileObj,
        coverLetter: formData.get('coverLetter') ? String(formData.get('coverLetter')) : undefined,
        answers: parsedAnswers,
        consentAccepted:
          formData.get('consentAccepted') === 'true' || formData.get('consentAccepted') === '1',
        sharePhone: formData.get('sharePhone') === 'true',
        shareSalary: formData.get('shareSalary') === 'true',
      };

      const parsed = ApplyRequestJsonSchema.safeParse(candidatePayload);
      if (!parsed.success) {
        return NextResponse.json(
          { ok: false, error: 'VALIDATION_ERROR', details: parsed.error.issues },
          { status: 400 }
        );
      }
      payload = parsed.data;
    } else {
      const body = await request.json().catch(() => null);
      if (!body || typeof body !== 'object') {
        return NextResponse.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 });
      }

      // Check consentAccepted explicitly first for clear error code
      if (body.consentAccepted !== true) {
        return NextResponse.json(
          {
            ok: false,
            error: 'CONSENT_REQUIRED',
            message: 'Explicit consent is required to share your CV and data with the employer.',
          },
          { status: 400 }
        );
      }

      const parsed = ApplyRequestJsonSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { ok: false, error: 'VALIDATION_ERROR', details: parsed.error.issues },
          { status: 400 }
        );
      }
      payload = parsed.data;

      // If uploadedFile is provided in JSON, validate it strictly
      if (payload.uploadedFile) {
        let bytes: Uint8Array | undefined = undefined;
        if (payload.uploadedFile.contentBase64) {
          try {
            bytes = new Uint8Array(Buffer.from(payload.uploadedFile.contentBase64, 'base64'));
          } catch {
            return NextResponse.json(
              { ok: false, error: 'INVALID_FILE_ENCODING' },
              { status: 400 }
            );
          }
        }
        const fileCheck = validateUploadedResumeFile({
          name: payload.uploadedFile.name,
          size: bytes ? bytes.byteLength : payload.uploadedFile.size,
          type: payload.uploadedFile.type,
          bytes,
        });
        if (!fileCheck.valid) {
          return NextResponse.json(
            { ok: false, error: fileCheck.error, reason: fileCheck.reason },
            { status: 400 }
          );
        }
      }
    }

    if (payload.consentAccepted !== true) {
      return NextResponse.json(
        {
          ok: false,
          error: 'CONSENT_REQUIRED',
          message: 'Explicit consent is required to share your CV and data with the employer.',
        },
        { status: 400 }
      );
    }

    const fullUser = await DataStore.findUserById(auth.user.id);
    if (!fullUser) {
      return NextResponse.json({ ok: false, error: 'USER_NOT_FOUND' }, { status: 404 });
    }

    // Build immutable resumeSnapshot from selected savedResume, uploadedFile, or provided resumeSnapshot
    let snapshot: ResumeSnapshotData | null = null;
    const savedResumes = Array.isArray(fullUser.savedResumes) ? fullUser.savedResumes : [];

    if (payload.resumeId) {
      const found = savedResumes.find((r) => r.id === payload.resumeId);
      if (!found) {
        return NextResponse.json({ ok: false, error: 'RESUME_NOT_FOUND' }, { status: 404 });
      }
      const rData = (found.data || {}) as Record<string, unknown>;
      const personal = (rData.personalInfo || {}) as Record<string, unknown>;
      const rawSkills = Array.isArray(rData.skills)
        ? rData.skills.map((s) => (typeof s === 'string' ? s : String((s as Record<string, unknown>)?.name || '')))
        : fullUser.profile?.skills || [];
      snapshot = {
        resumeId: found.id,
        fullName: sanitizePlainText(
          String(personal.fullName || fullUser.profile?.fullName || fullUser.name || ''),
          120
        ),
        email: sanitizePlainText(String(personal.email || fullUser.email || ''), 160),
        phone: payload.sharePhone
          ? sanitizePlainText(String(personal.phone || fullUser.profile?.phone || ''), 40)
          : undefined,
        headline: sanitizePlainText(
          String(personal.jobTitle || fullUser.profile?.headline || found.title || ''),
          160
        ),
        summary: sanitizePlainText(String(personal.summary || rData.summary || ''), 5000),
        skills: rawSkills
          .map((s) => sanitizePlainText(String(s), 80))
          .filter(Boolean)
          .slice(0, 50),
        rawText: sanitizePlainText(JSON.stringify(rData).slice(0, 25000), 25000),
      };
    } else if (payload.uploadedFile) {
      let textFromBytes = payload.uploadedFile.extractedText || '';
      if (!textFromBytes && payload.uploadedFile.contentBase64) {
        const decoded = Buffer.from(payload.uploadedFile.contentBase64, 'base64').toString('utf8');
        textFromBytes = decoded.replace(/[^\x20-\x7E\u0600-\u06FF\n\r\t]/g, ' ').slice(0, 20000);
      }
      snapshot = {
        fullName: sanitizePlainText(fullUser.profile?.fullName || fullUser.name || '', 120),
        email: sanitizePlainText(fullUser.email, 160),
        phone: payload.sharePhone
          ? sanitizePlainText(fullUser.profile?.phone || '', 40)
          : undefined,
        headline: sanitizePlainText(
          fullUser.profile?.headline || fullUser.profile?.targetRole || payload.uploadedFile.name,
          160
        ),
        summary: `Uploaded file: ${sanitizePlainText(payload.uploadedFile.name, 160)}`,
        skills: (fullUser.profile?.skills || []).slice(0, 30),
        rawText: sanitizePlainText(textFromBytes || `Uploaded CV: ${payload.uploadedFile.name}`, 25000),
      };
    } else if (payload.resumeSnapshot) {
      snapshot = {
        resumeId: payload.resumeSnapshot.resumeId,
        fullName: sanitizePlainText(
          payload.resumeSnapshot.fullName || fullUser.profile?.fullName || fullUser.name || '',
          120
        ),
        email: sanitizePlainText(payload.resumeSnapshot.email || fullUser.email, 160),
        phone: payload.sharePhone
          ? sanitizePlainText(payload.resumeSnapshot.phone || fullUser.profile?.phone || '', 40)
          : undefined,
        headline: sanitizePlainText(
          payload.resumeSnapshot.headline || fullUser.profile?.headline || '',
          160
        ),
        summary: sanitizePlainText(payload.resumeSnapshot.summary || '', 5000),
        skills: (payload.resumeSnapshot.skills || fullUser.profile?.skills || [])
          .map((s) => sanitizePlainText(s, 80))
          .filter(Boolean)
          .slice(0, 50),
        experienceText: sanitizePlainText(payload.resumeSnapshot.experienceText || '', 15000),
        educationText: sanitizePlainText(payload.resumeSnapshot.educationText || '', 8000),
        rawText: sanitizePlainText(payload.resumeSnapshot.rawText || '', 25000),
      };
    }

    if (!snapshot) {
      return NextResponse.json(
        { ok: false, error: 'RESUME_REQUIRED', message: 'Please select a saved CV or upload a CV file.' },
        { status: 400 }
      );
    }

    // Validate required screening questions
    const jobQuestions = job.screeningQuestions || [];
    const answersList = (payload.answers || []).map((a) => ({
      questionId: sanitizePlainText(a.questionId, 80),
      question: sanitizePlainText(a.question, 300),
      answer: sanitizePlainText(a.answer, 2000),
    }));

    for (const q of jobQuestions) {
      if (q.required) {
        const given = answersList.find((a) => a.questionId === q.id);
        if (!given || !given.answer.trim()) {
          return NextResponse.json(
            {
              ok: false,
              error: 'SCREENING_ANSWER_REQUIRED',
              questionId: q.id,
            },
            { status: 400 }
          );
        }
      }
    }

    // Compute automatic skill match analysis for HR sorting
    const jobSkillsLower = (job.skills || []).map((s) => s.toLowerCase());
    const candSkills = snapshot.skills || [];
    const candTextLower = `${candSkills.join(' ')} ${snapshot.summary || ''} ${snapshot.rawText || ''}`.toLowerCase();
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    for (let i = 0; i < (job.skills || []).length; i++) {
      const origSkill = job.skills[i];
      const lowerSkill = jobSkillsLower[i];
      if (candTextLower.includes(lowerSkill)) {
        matchedSkills.push(origSkill);
      } else {
        missingSkills.push(origSkill);
      }
    }

    const score =
      job.skills && job.skills.length > 0
        ? Math.round((matchedSkills.length / job.skills.length) * 100)
        : 75;

    let application;
    try {
      application = await DataStore.createApplication({
        jobId: job.id,
        candidateId: fullUser.id,
        resumeSnapshot: snapshot,
        coverLetter: payload.coverLetter ? sanitizePlainText(payload.coverLetter, 6000) : undefined,
        answers: answersList,
        consent: {
          sharedAt: new Date().toISOString(),
          version: payload.consentVersion || 'v1.0',
          sharePhone: Boolean(payload.sharePhone),
          shareSalary: Boolean(payload.shareSalary),
        },
        analysis: {
          score,
          matchedSkills,
          missingSkills,
          summary: `Matched ${matchedSkills.length} of ${job.skills?.length || 0} required skills.`,
          model: 'rule-match-v1',
          createdAt: new Date().toISOString(),
          creditsUsed: 0,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'DUPLICATE_APPLICATION') {
        return NextResponse.json(
          { ok: false, error: 'DUPLICATE_APPLICATION' },
          { status: 409 }
        );
      }
      throw err;
    }

    // Send transactional emails: Confirmation to Candidate + Notification to HR
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jobmatch.ai';
    const ownerUser = await DataStore.findUserById(org.ownerId);
    const hrEmail = org.workEmail || ownerUser?.email;

    const emails = buildApplicationSubmittedEmails({
      candidateName: snapshot.fullName || fullUser.name || 'Candidate',
      jobTitle: job.title,
      orgName: org.name,
      jobSlug: job.slug,
      jobId: job.id,
      baseUrl,
    });

    await Promise.allSettled([
      sendEmail({
        to: fullUser.email,
        subject: emails.candidateEmail.subject,
        html: emails.candidateEmail.html,
      }),
      hrEmail
        ? sendEmail({
          to: hrEmail,
          subject: emails.hrEmail.subject,
          html: emails.hrEmail.html,
        })
        : Promise.resolve({ ok: true }),
    ]);

    return NextResponse.json(
      {
        ok: true,
        application: {
          id: application.id,
          jobId: application.jobId,
          status: application.status,
          createdAt: application.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/jobs/hire/[slug]/apply] Error:', err);
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

