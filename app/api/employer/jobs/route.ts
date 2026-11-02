import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, validateCsrfOrigin } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { applyRateLimit, parseBoundedJsonBody } from '@/lib/rate-limit';
import { employerJobInputSchema } from '@/lib/hr';

const EMPLOYER_JOBS_GET_RL = {
  keyPrefix: 'api_employer_jobs_get',
  limit: 60,
  ipLimit: 120,
  windowMs: 60 * 1000,
};

const EMPLOYER_JOBS_POST_RL = {
  keyPrefix: 'api_employer_jobs_post',
  limit: 20,
  ipLimit: 40,
  windowMs: 60 * 1000,
};

const createJobBodySchema = employerJobInputSchema.extend({
  publishNow: z.boolean().optional().default(false),
});

export async function GET(req: NextRequest) {
  const { user, errorResponse } = requireAuth(req);
  if (errorResponse || !user) return errorResponse!;

  const rl = await applyRateLimit(req, EMPLOYER_JOBS_GET_RL, user.id);
  if (!rl.allowed) return rl.errorResponse!;

  const orgId = req.nextUrl.searchParams.get('orgId')?.trim() || '';
  if (!orgId) {
    return NextResponse.json(
      { ok: false, error: 'ORG_ID_REQUIRED', message: 'orgId query parameter is required.' },
      { status: 400, headers: rl.headers }
    );
  }

  // Strict ownership check (IDOR protection)
  const isMember = await DataStore.isOrganizationMember(orgId, user.id);
  if (!isMember) {
    return NextResponse.json(
      {
        ok: false,
        error: 'FORBIDDEN',
        message: 'You are not a member of the organization that owns these jobs.',
      },
      { status: 403, headers: rl.headers }
    );
  }

  const jobs = await DataStore.listEmployerJobs({ orgId, limit: 100 });
  return NextResponse.json(
    {
      ok: true,
      jobs,
    },
    { status: 200, headers: rl.headers }
  );
}

export async function POST(req: NextRequest) {
  if (!validateCsrfOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: 'CSRF_ORIGIN_MISMATCH', message: 'Invalid request origin.' },
      { status: 403 }
    );
  }

  const { user, errorResponse } = requireAuth(req);
  if (errorResponse || !user) return errorResponse!;

  const rl = await applyRateLimit(req, EMPLOYER_JOBS_POST_RL, user.id);
  if (!rl.allowed) return rl.errorResponse!;

  const bodyRes = await parseBoundedJsonBody<Record<string, unknown>>(req, 128 * 1024);
  if (!bodyRes.ok) return bodyRes.errorResponse;

  const parsed = createJobBodySchema.safeParse(bodyRes.data);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'VALIDATION_ERROR',
        message: parsed.error.issues[0]?.message || 'Invalid job posting data.',
        issues: parsed.error.issues,
      },
      { status: 400, headers: rl.headers }
    );
  }

  const { orgId, publishNow, ...jobData } = parsed.data;

  // Strict ownership check (IDOR protection)
  const isMember = await DataStore.isOrganizationMember(orgId, user.id);
  if (!isMember) {
    return NextResponse.json(
      {
        ok: false,
        error: 'FORBIDDEN',
        message: 'You are not a member of this organization.',
      },
      { status: 403, headers: rl.headers }
    );
  }

  // Always save as draft first so the user never loses their work
  const draftJob = await DataStore.createEmployerJob(orgId, user.id, {
    ...jobData,
    status: 'draft',
  });

  if (!publishNow && parsed.data.status === 'draft') {
    return NextResponse.json(
      {
        ok: true,
        job: draftJob,
      },
      { status: 201, headers: rl.headers }
    );
  }

  // Attempt atomic publish (deducts 1 HR credit, runs content moderation, checks org verification)
  const pubRes = await DataStore.publishEmployerJob(draftJob.id, orgId, user.id);
  if (!pubRes.success) {
    if (pubRes.error === 'INSUFFICIENT_HR_CREDITS') {
      return NextResponse.json(
        {
          ok: false,
          error: 'INSUFFICIENT_HR_CREDITS',
          message: 'Insufficient HR credits to publish this job. Your draft has been saved.',
          purchaseUrl: '/employer/billing',
          balanceAfter: pubRes.balanceAfter ?? 0,
          job: draftJob,
        },
        { status: 402, headers: rl.headers }
      );
    }

    if (pubRes.error === 'CONTENT_POLICY_VIOLATION') {
      return NextResponse.json(
        {
          ok: false,
          error: 'CONTENT_POLICY_VIOLATION',
          message:
            pubRes.moderationReasons?.[0] ||
            'Job posting violates content policy (prohibited keywords or payment requests).',
          flags: pubRes.moderationFlags || [],
          job: draftJob,
        },
        { status: 400, headers: rl.headers }
      );
    }

    if (pubRes.error === 'UNVERIFIED_DAILY_LIMIT_REACHED') {
      return NextResponse.json(
        {
          ok: false,
          error: 'UNVERIFIED_DAILY_LIMIT_REACHED',
          message:
            'Unverified organizations can submit up to 2 jobs per day. Verify your company email domain to unlock unlimited publishing.',
          job: draftJob,
        },
        { status: 429, headers: rl.headers }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: pubRes.error || 'PUBLISH_FAILED',
        job: draftJob,
      },
      { status: 400, headers: rl.headers }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      job: pubRes.job,
      balanceAfter: pubRes.balanceAfter,
      moderationFlags: pubRes.moderationFlags || [],
    },
    { status: 201, headers: rl.headers }
  );
}

