import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, validateCsrfOrigin } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { applyRateLimit, parseBoundedJsonBody } from '@/lib/rate-limit';

const ANALYZE_JOB_RL = {
  keyPrefix: 'api_employer_job_analyze',
  limit: 30,
  ipLimit: 60,
  windowMs: 60 * 1000,
};

const analyzeJobRequestSchema = z.object({
  action: z.enum(['analyze_batch', 'compare_top10']).optional().default('analyze_batch'),
  applicationIds: z.array(z.string().min(1).max(120)).max(50).optional(),
  onlyNew: z.boolean().optional().default(false),
  force: z.boolean().optional().default(false),
});

export async function POST(
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

  const rl = await applyRateLimit(req, ANALYZE_JOB_RL, user.id);
  if (!rl.allowed) return rl.errorResponse!;

  const { jobId } = await context.params;
  const cleanJobId = (jobId || '').trim();

  const job = await DataStore.getEmployerJobById(cleanJobId);
  if (!job) {
    return NextResponse.json(
      { ok: false, error: 'JOB_NOT_FOUND', message: 'Job posting not found.' },
      { status: 404, headers: rl.headers }
    );
  }

  // Strict organization ownership check (IDOR protection)
  const isMember = await DataStore.isOrganizationMember(job.orgId, user.id);
  if (!isMember) {
    return NextResponse.json(
      {
        ok: false,
        error: 'FORBIDDEN',
        message: 'You do not have permission to analyze applicants for this job.',
      },
      { status: 403, headers: rl.headers }
    );
  }

  const bodyRes = await parseBoundedJsonBody<Record<string, unknown>>(req, 64 * 1024);
  if (!bodyRes.ok) return bodyRes.errorResponse;

  const parsed = analyzeJobRequestSchema.safeParse(bodyRes.data);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'VALIDATION_ERROR',
        message: parsed.error.issues[0]?.message || 'Invalid analyze request.',
      },
      { status: 400, headers: rl.headers }
    );
  }

  if (parsed.data.action === 'compare_top10') {
    const cmpRes = await DataStore.generateTop10ReportForHr({
      jobId: cleanJobId,
      orgId: job.orgId,
      actorUserId: user.id,
    });

    if (!cmpRes.ok) {
      if (cmpRes.error === 'INSUFFICIENT_HR_CREDITS') {
        return NextResponse.json(
          {
            ok: false,
            error: 'INSUFFICIENT_HR_CREDITS',
            balanceAfter: cmpRes.balanceAfter,
            purchaseUrl: '/pricing?tab=hr',
          },
          { status: 402, headers: rl.headers }
        );
      }
      return NextResponse.json(
        {
          ok: false,
          error: cmpRes.error || 'COMPARISON_FAILED',
          balanceAfter: cmpRes.balanceAfter,
        },
        { status: 400, headers: rl.headers }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        report: cmpRes.report,
        balanceAfter: cmpRes.balanceAfter,
      },
      { status: 200, headers: rl.headers }
    );
  }

  const batchRes = await DataStore.analyzeApplicantsBatchForHr({
    jobId: cleanJobId,
    orgId: job.orgId,
    actorUserId: user.id,
    applicationIds: parsed.data.applicationIds,
    onlyNew: parsed.data.onlyNew,
    force: parsed.data.force,
  });

  if (batchRes.error === 'INSUFFICIENT_HR_CREDITS') {
    return NextResponse.json(
      {
        ...batchRes,
        ok: false,
        error: 'INSUFFICIENT_HR_CREDITS',
        purchaseUrl: '/pricing?tab=hr',
      },
      { status: 402, headers: rl.headers }
    );
  }

  if (batchRes.error === 'ORG_DAILY_LIMIT_EXCEEDED') {
    return NextResponse.json(
      {
        ...batchRes,
        ok: false,
        error: 'ORG_DAILY_LIMIT_EXCEEDED',
      },
      { status: 429, headers: rl.headers }
    );
  }

  return NextResponse.json(batchRes, { status: 200, headers: rl.headers });
}

