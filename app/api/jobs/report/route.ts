import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, validateCsrfOrigin } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { applyRateLimit, parseBoundedJsonBody } from '@/lib/rate-limit';
import { jobReportCreateSchema } from '@/lib/hr';

const REPORT_JOB_RL = {
  keyPrefix: 'api_jobs_report_post',
  limit: 10,
  ipLimit: 20,
  windowMs: 60 * 1000,
};

export async function POST(req: NextRequest) {
  if (!validateCsrfOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: 'CSRF_ORIGIN_MISMATCH', message: 'Invalid request origin.' },
      { status: 403 }
    );
  }

  const { user, errorResponse } = requireAuth(req);
  if (errorResponse || !user) return errorResponse!;

  const rl = await applyRateLimit(req, REPORT_JOB_RL, user.id);
  if (!rl.allowed) return rl.errorResponse!;

  const bodyRes = await parseBoundedJsonBody<Record<string, unknown>>(req, 32 * 1024);
  if (!bodyRes.ok) return bodyRes.errorResponse;

  const parsed = jobReportCreateSchema.safeParse(bodyRes.data);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'VALIDATION_ERROR',
        message: parsed.error.issues[0]?.message || 'Invalid report data.',
      },
      { status: 400, headers: rl.headers }
    );
  }

  const report = await DataStore.createJobReport({
    ...parsed.data,
    reporterUserId: user.id,
  });

  return NextResponse.json(
    {
      ok: true,
      report,
    },
    { status: 201, headers: rl.headers }
  );
}

