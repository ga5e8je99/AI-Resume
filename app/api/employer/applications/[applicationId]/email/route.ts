import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, validateCsrfOrigin } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { applyRateLimit, parseBoundedJsonBody } from '@/lib/rate-limit';
import { buildCandidateOutreachEmail } from '@/lib/hr/moderation';
import { sendEmail } from '@/lib/email';

const EMAIL_CANDIDATE_RL = {
  keyPrefix: 'api_employer_application_email',
  limit: 15,
  ipLimit: 30,
  windowMs: 60 * 1000,
};

const emailCandidateSchema = z.object({
  template: z.enum(['interview', 'shortlisted', 'rejected', 'custom']),
  customSubject: z.string().max(160).optional().default(''),
  customMessage: z.string().max(3000).optional().default(''),
  revealHrEmail: z.boolean().optional().default(false),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ applicationId: string }> }
) {
  if (!validateCsrfOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: 'CSRF_ORIGIN_MISMATCH', message: 'Invalid request origin.' },
      { status: 403 }
    );
  }

  const { user, errorResponse } = requireAuth(req);
  if (errorResponse || !user) return errorResponse!;

  const rl = await applyRateLimit(req, EMAIL_CANDIDATE_RL, user.id);
  if (!rl.allowed) return rl.errorResponse!;

  const { applicationId } = await context.params;
  const cleanAppId = (applicationId || '').trim();

  const appRecord = await DataStore.getApplicationById(cleanAppId, user.id);
  if (!appRecord) {
    return NextResponse.json(
      {
        ok: false,
        error: 'FORBIDDEN_OR_NOT_FOUND',
        message: 'Application not found or access denied.',
      },
      { status: 403, headers: rl.headers }
    );
  }

  // Strict organization ownership check (IDOR protection)
  const isHrMember = await DataStore.isOrganizationMember(appRecord.orgId, user.id);
  if (!isHrMember) {
    return NextResponse.json(
      {
        ok: false,
        error: 'FORBIDDEN',
        message: 'Only organization HR members can message applicants.',
      },
      { status: 403, headers: rl.headers }
    );
  }

  const bodyRes = await parseBoundedJsonBody<Record<string, unknown>>(req, 32 * 1024);
  if (!bodyRes.ok) return bodyRes.errorResponse;

  const parsed = emailCandidateSchema.safeParse(bodyRes.data);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'VALIDATION_ERROR',
        message: parsed.error.issues[0]?.message || 'Invalid email parameters.',
      },
      { status: 400, headers: rl.headers }
    );
  }

  const [job, org, candidateUser] = await Promise.all([
    DataStore.getEmployerJobById(appRecord.jobId),
    DataStore.getOrganizationById(appRecord.orgId),
    DataStore.findUserById(appRecord.candidateId),
  ]);

  const snap = appRecord.resumeSnapshot || {};
  const snapPersonal = snap.personalInfo || snap.basics || {};
  const candidateEmail =
    snapPersonal.email || snap.email || candidateUser?.email || '';
  const candidateName =
    snapPersonal.fullName || snapPersonal.name || candidateUser?.name || 'Candidate';

  if (!candidateEmail) {
    return NextResponse.json(
      {
        ok: false,
        error: 'CANDIDATE_EMAIL_NOT_AVAILABLE',
        message: 'Candidate email address is not available on this application.',
      },
      { status: 400, headers: rl.headers }
    );
  }

  const { subject, html } = buildCandidateOutreachEmail({
    template: parsed.data.template,
    candidateName,
    jobTitle: job?.title || 'Job Application',
    orgName: org?.name || 'Hiring Organization',
    customSubject: parsed.data.customSubject,
    customMessage: parsed.data.customMessage,
    revealHrEmail: parsed.data.revealHrEmail,
    hrEmail: parsed.data.revealHrEmail ? user.email : undefined,
  });

  const emailRes = await sendEmail({
    to: candidateEmail,
    subject,
    html,
  });

  return NextResponse.json(
    {
      ok: true,
      sent: emailRes.success,
      emailId: emailRes.id,
      revealedHrEmail: parsed.data.revealHrEmail,
    },
    { status: 200, headers: rl.headers }
  );
}

