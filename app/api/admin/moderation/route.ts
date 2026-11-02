import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAdmin, validateCsrfOrigin } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { applyRateLimit, parseBoundedJsonBody } from '@/lib/rate-limit';

const ADMIN_MOD_RL = {
  keyPrefix: 'api_admin_moderation',
  limit: 60,
  ipLimit: 120,
  windowMs: 60 * 1000,
};

const moderationActionSchema = z.discriminatedUnion('targetType', [
  z.object({
    targetType: z.literal('job'),
    jobId: z.string().min(1),
    action: z.enum(['approve', 'reject']),
  }),
  z.object({
    targetType: z.literal('organization'),
    orgId: z.string().min(1),
    verified: z.boolean(),
  }),
  z.object({
    targetType: z.literal('report'),
    reportId: z.string().min(1),
    status: z.enum(['resolved', 'dismissed']),
  }),
]);

export async function GET(req: NextRequest) {
  const auth = verifyAdmin(req);
  if (!auth.isAdmin) {
    return NextResponse.json(
      { ok: false, error: 'FORBIDDEN', message: auth.reason || 'Admin access required.' },
      { status: 403 }
    );
  }

  const rl = await applyRateLimit(req, ADMIN_MOD_RL, auth.user?.userId || 'admin');
  if (!rl.allowed) return rl.errorResponse!;

  const [allJobs, reports, organizations] = await Promise.all([
    DataStore.listEmployerJobs({ limit: 200 }),
    DataStore.listJobReports(),
    DataStore.listAllOrganizationsForAdmin(),
  ]);

  const pendingOrFlaggedJobs = allJobs.filter(
    (j) =>
      j.status === 'pending' ||
      (Array.isArray(j.moderationFlags) && j.moderationFlags.length > 0)
  );

  return NextResponse.json(
    {
      ok: true,
      pendingJobs: pendingOrFlaggedJobs,
      allEmployerJobs: allJobs,
      reports,
      organizations,
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

  const auth = verifyAdmin(req);
  if (!auth.isAdmin) {
    return NextResponse.json(
      { ok: false, error: 'FORBIDDEN', message: auth.reason || 'Admin access required.' },
      { status: 403 }
    );
  }

  const rl = await applyRateLimit(req, ADMIN_MOD_RL, auth.user?.userId || 'admin');
  if (!rl.allowed) return rl.errorResponse!;

  const bodyRes = await parseBoundedJsonBody<Record<string, unknown>>(req, 32 * 1024);
  if (!bodyRes.ok) return bodyRes.errorResponse;

  const parsed = moderationActionSchema.safeParse(bodyRes.data);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'VALIDATION_ERROR',
        message: parsed.error.issues[0]?.message || 'Invalid moderation action.',
      },
      { status: 400, headers: rl.headers }
    );
  }

  const data = parsed.data;
  if (data.targetType === 'job') {
    const job = await DataStore.adminModerateEmployerJob(data.jobId, data.action);
    if (!job) {
      return NextResponse.json(
        { ok: false, error: 'JOB_NOT_FOUND' },
        { status: 404, headers: rl.headers }
      );
    }
    return NextResponse.json({ ok: true, job }, { status: 200, headers: rl.headers });
  }

  if (data.targetType === 'organization') {
    const org = await DataStore.adminVerifyOrganization(data.orgId, data.verified);
    if (!org) {
      return NextResponse.json(
        { ok: false, error: 'ORGANIZATION_NOT_FOUND' },
        { status: 404, headers: rl.headers }
      );
    }
    return NextResponse.json({ ok: true, organization: org }, { status: 200, headers: rl.headers });
  }

  const report = await DataStore.updateJobReportStatus(data.reportId, data.status);
  if (!report) {
    return NextResponse.json(
      { ok: false, error: 'REPORT_NOT_FOUND' },
      { status: 404, headers: rl.headers }
    );
  }
  return NextResponse.json({ ok: true, report }, { status: 200, headers: rl.headers });
}

