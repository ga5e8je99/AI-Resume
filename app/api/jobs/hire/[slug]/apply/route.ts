import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DataStore } from '@/app/lib/datastore';
import { requireAuth, validateCsrfOrigin } from '@/app/lib/auth';
import { applyRateLimit } from '@/app/lib/rateLimit';
import { sendEmail } from '@/app/lib/email';
import { sanitizeProfileText } from '@/lib/profile';
import {
  validateUploadedResumeFile,
  buildApplicationSubmittedEmails,
} from '@/lib/hr/applyValidation';

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
        questionId: z.string().max(80).optional(),
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

    const rl = await applyRateLimit(request, {
      limit: 10,
      windowMs: 60 * 1000,
      keyPrefix: 'hire_job_apply',
    });
    if (!rl.allowed) return rl.errorResponse!;

    const auth = requireAuth(request);
    if (auth.errorResponse || !auth.user) {
      return (
        auth.errorResponse ||
        NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
      );
    }

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
          buffer: bytes,
        });
        if (!validation.valid) {
          return NextResponse.json(
            { ok: false, error: validation.error, reason: validation.message },
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
      let parsedAnswers: Array<{ questionId?: string; question: string; answer: string }> = [];
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
          buffer: bytes,
        });
        if (!fileCheck.valid) {
          return NextResponse.json(
            { ok: false, error: fileCheck.error, reason: fileCheck.message },
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

    const userProfile = await DataStore.getUserProfile(fullUser.id);
    const savedResumes = await DataStore.getUserResumes(fullUser.id);

    let snapshot: Record<string, any> | null = null;

    if (payload.resumeId) {
      const found = savedResumes.find((r: any) => r.id === payload.resumeId);
      if (!found) {
        return NextResponse.json({ ok: false, error: 'RESUME_NOT_FOUND' }, { status: 404 });
      }
      const rData = ((found as any).data || found || {}) as Record<string, any>;
      const personal = (rData.personalInfo || rData.basics || {}) as Record<string, any>;
      const rawSkills: string[] = Array.isArray(rData.skills)
        ? rData.skills.map((s: any) => (typeof s === 'string' ? s : String(s?.name || '')))
        : userProfile?.skills || [];
      snapshot = {
        resumeId: found.id,
        fullName: sanitizeProfileText(
          String(personal.fullName || userProfile?.fullName || fullUser.name || ''),
          120
        ),
        email: sanitizeProfileText(String(personal.email || fullUser.email || ''), 160),
        phone: payload.sharePhone
          ? sanitizeProfileText(String(personal.phone || userProfile?.phone || ''), 40)
          : undefined,
        headline: sanitizeProfileText(
          String(personal.jobTitle || userProfile?.headline || found.title || ''),
          160
        ),
        summary: sanitizeProfileText(String(personal.summary || rData.summary || ''), 5000),
        skills: rawSkills
          .map((s: string) => sanitizeProfileText(String(s), 80))
          .filter(Boolean)
          .slice(0, 50),
        rawText: sanitizeProfileText(JSON.stringify(rData).slice(0, 25000), 25000),
      };
    } else if (payload.uploadedFile) {
      let textFromBytes = payload.uploadedFile.extractedText || '';
      if (!textFromBytes && payload.uploadedFile.contentBase64) {
        const decoded = Buffer.from(payload.uploadedFile.contentBase64, 'base64').toString('utf8');
        textFromBytes = decoded.replace(/[^\x20-\x7E\u0600-\u06FF\n\r\t]/g, ' ').slice(0, 20000);
      }
      snapshot = {
        fullName: sanitizeProfileText(userProfile?.fullName || fullUser.name || '', 120),
        email: sanitizeProfileText(fullUser.email, 160),
        phone: payload.sharePhone
          ? sanitizeProfileText(userProfile?.phone || '', 40)
          : undefined,
        headline: sanitizeProfileText(
          userProfile?.headline || userProfile?.targetRole || payload.uploadedFile.name,
          160
        ),
        summary: `Uploaded file: ${sanitizeProfileText(payload.uploadedFile.name, 160)}`,
        skills: (userProfile?.skills || []).slice(0, 30),
        rawText: sanitizeProfileText(
          textFromBytes || `Uploaded CV: ${payload.uploadedFile.name}`,
          25000
        ),
      };
    } else if (payload.resumeSnapshot) {
      snapshot = {
        resumeId: payload.resumeSnapshot.resumeId,
        fullName: sanitizeProfileText(
          payload.resumeSnapshot.fullName || userProfile?.fullName || fullUser.name || '',
          120
        ),
        email: sanitizeProfileText(payload.resumeSnapshot.email || fullUser.email, 160),
        phone: payload.sharePhone
          ? sanitizeProfileText(payload.resumeSnapshot.phone || userProfile?.phone || '', 40)
          : undefined,
        headline: sanitizeProfileText(
          payload.resumeSnapshot.headline || userProfile?.headline || '',
          160
        ),
        summary: sanitizeProfileText(payload.resumeSnapshot.summary || '', 5000),
        skills: (payload.resumeSnapshot.skills || userProfile?.skills || [])
          .map((s: string) => sanitizeProfileText(s, 80))
          .filter(Boolean)
          .slice(0, 50),
        experienceText: sanitizeProfileText(payload.resumeSnapshot.experienceText || '', 15000),
        educationText: sanitizeProfileText(payload.resumeSnapshot.educationText || '', 8000),
        rawText: sanitizeProfileText(payload.resumeSnapshot.rawText || '', 25000),
      };
    }

    if (!snapshot) {
      return NextResponse.json(
        {
          ok: false,
          error: 'RESUME_REQUIRED',
          message: 'Please select a saved CV or upload a CV file.',
        },
        { status: 400 }
      );
    }

    const answersList = (payload.answers || []).map((a) => ({
      question: sanitizeProfileText(a.question, 240),
      answer: sanitizeProfileText(a.answer, 2000),
    }));

    let application;
    try {
      application = await DataStore.createApplication({
        jobId: job.id,
        candidateId: fullUser.id,
        resumeSnapshot: snapshot,
        coverLetter: payload.coverLetter
          ? sanitizeProfileText(payload.coverLetter, 6000)
          : undefined,
        answers: answersList,
        consent: {
          sharedAt: new Date().toISOString(),
          version: payload.consentVersion || 'v1.0',
          sharePhone: Boolean(payload.sharePhone),
          shareSalary: Boolean(payload.shareSalary),
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jobmatch.ai';
    const ownerUser = await DataStore.findUserById(org.ownerId);
    const hrEmail = org.workEmail || ownerUser?.email;

    const emails = buildApplicationSubmittedEmails({
      candidateName: String(snapshot.fullName || fullUser.name || 'Candidate'),
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
