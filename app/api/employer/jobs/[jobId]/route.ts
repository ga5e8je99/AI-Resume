import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, validateCsrfOrigin } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { applyRateLimit, parseBoundedJsonBody } from '@/lib/rate-limit';
import {
  EMPLOYER_JOB_STATUSES,
  EMPLOYER_JOB_SENIORITIES,
  sanitizeJobMarkdown,
} from '@/lib/hr';
import { EMPLOYMENT_TYPES, sanitizeProfileText } from '@/lib/profile';

const JOB_DETAIL_RL = {
  keyPrefix: 'api_employer_job_detail',
  limit: 45,
  ipLimit: 90,
  windowMs: 60 * 1000,
};

const updateJobSchema = z.object({
  title: z
    .string()
    .min(2)
    .max(160)
    .transform((v) => sanitizeProfileText(v, 160))
    .optional(),
  description: z
    .string()
    .min(10)
    .max(15000)
    .transform((v) => sanitizeJobMarkdown(v, 15000))
    .optional(),
  requirements: z
    .array(z.string().transform((v) => sanitizeProfileText(v, 300)))
    .max(30)
    .optional(),
  skills: z
    .array(z.string().transform((v) => sanitizeProfileText(v, 60)))
    .max(30)
    .optional(),
  location: z
    .string()
    .max(120)
    .transform((v) => sanitizeProfileText(v, 120))
    .optional(),
  remote: z.boolean().optional(),
  employmentType: z.enum(EMPLOYMENT_TYPES).optional(),
  seniority: z.enum(EMPLOYER_JOB_SENIORITIES).optional(),
  salary: z
    .object({
      min: z.number().min(0).max(10_000_000).nullable().optional().default(null),
      max: z.number().min(0).max(10_000_000).nullable().optional().default(null),
      currency: z
        .string()
        .min(3)
        .max(6)
        .optional()
        .default('USD')
        .transform((v) => v.trim().toUpperCase()),
      visible: z.boolean().optional().default(false),
    })
    .optional(),
  screeningQuestions: z
    .array(z.string().transform((v) => sanitizeProfileText(v, 240)))
    .max(5, 'Maximum 5 screening questions allowed')
    .optional(),
  status: z.enum(EMPLOYER_JOB_STATUSES).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  publishNow: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  const { user, errorResponse } = requireAuth(req);
  if (errorResponse || !user) return errorResponse!;

  const rl = await applyRateLimit(req, JOB_DETAIL_RL, user.id);
  if (!rl.allowed) return rl.errorResponse!;

  const { jobId } = await context.params;
  const job = await DataStore.getEmployerJobById((jobId || '').trim());

  if (!job) {
    return NextResponse.json(
      { ok: false, error: 'JOB_NOT_FOUND', message: 'Job posting not found.' },
      { status: 404, headers: rl.headers }
    );
  }

  // Strict ownership check (IDOR protection)
  const isMember = await DataStore.isOrganizationMember(job.orgId, user.id);
  if (!isMember) {
    return NextResponse.json(
      {
        ok: false,
        error: 'FORBIDDEN',
        message: 'You do not have permission to access this job posting.',
      },
      { status: 403, headers: rl.headers }
    );
  }

  return NextResponse.json({ ok: true, job }, { status: 200, headers: rl.headers });
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  if (!validateCsrfOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: 'CSRF_ORIGIN_MISMATCH', message: 'Invalid request origin.' },
      { status: 403 }
    );
  }

  const { user, errorResponse } = requireAuth(req);
  if (errorResponse || !user) return errorResponse!;

  const rl = await applyRateLimit(req, JOB_DETAIL_RL, user.id);
  if (!rl.allowed) return rl.errorResponse!;

  const { jobId } = await context.params;
  const cleanJobId = (jobId || '').trim();
  const existingJob = await DataStore.getEmployerJobById(cleanJobId);

  if (!existingJob) {
    return NextResponse.json(
      { ok: false, error: 'JOB_NOT_FOUND', message: 'Job posting not found.' },
      { status: 404, headers: rl.headers }
    );
  }

  // Strict ownership check (IDOR protection)
  const isMember = await DataStore.isOrganizationMember(existingJob.orgId, user.id);
  if (!isMember) {
    return NextResponse.json(
      {
        ok: false,
        error: 'FORBIDDEN',
        message: 'You are not a member of the organization that owns this job.',
      },
      { status: 403, headers: rl.headers }
    );
  }

  const bodyRes = await parseBoundedJsonBody<Record<string, unknown>>(req, 128 * 1024);
  if (!bodyRes.ok) return bodyRes.errorResponse;

  const parsed = updateJobSchema.safeParse(bodyRes.data);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'VALIDATION_ERROR',
        message: parsed.error.issues[0]?.message || 'Invalid job update payload.',
        issues: parsed.error.issues,
      },
      { status: 400, headers: rl.headers }
    );
  }

  const { publishNow, status, ...fieldUpdates } = parsed.data;
  const wantsPublish = publishNow === true || status === 'published';

  // Save field updates first
  const updatedJob = await DataStore.updateEmployerJob(
    cleanJobId,
    existingJob.orgId,
    user.id,
    {
      ...fieldUpdates,
      ...(status && !wantsPublish ? { status } : {}),
    }
  );

  if (!wantsPublish) {
    return NextResponse.json(
      { ok: true, job: updatedJob },
      { status: 200, headers: rl.headers }
    );
  }

  const pubRes = await DataStore.publishEmployerJob(cleanJobId, existingJob.orgId, user.id);
  if (!pubRes.success) {
    const statusCode =
      pubRes.error === 'INSUFFICIENT_HR_CREDITS'
        ? 402
        : pubRes.error === 'UNVERIFIED_DAILY_LIMIT_REACHED'
        ? 429
        : 400;
    return NextResponse.json(
      {
        ok: false,
        error: pubRes.error,
        message:
          pubRes.error === 'INSUFFICIENT_HR_CREDITS'
            ? 'Insufficient HR credits to publish. Your changes have been saved as a draft.'
            : pubRes.moderationReasons?.[0] || 'Could not publish job.',
        purchaseUrl: '/employer/billing',
        flags: pubRes.moderationFlags || [],
        balanceAfter: pubRes.balanceAfter,
        job: updatedJob,
      },
      { status: statusCode, headers: rl.headers }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      job: pubRes.job,
      balanceAfter: pubRes.balanceAfter,
      moderationFlags: pubRes.moderationFlags || [],
    },
    { status: 200, headers: rl.headers }
  );
}

