import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, validateCsrfOrigin } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { applyRateLimit, parseBoundedJsonBody } from '@/lib/rate-limit';
import { APPLICATION_STATUSES } from '@/lib/hr';
import { sanitizeProfileText } from '@/lib/profile';

const APP_UPDATE_RL = {
  keyPrefix: 'api_employer_application_patch',
  limit: 30,
  ipLimit: 60,
  windowMs: 60 * 1000,
};

const patchApplicationSchema = z.object({
  status: z.enum(APPLICATION_STATUSES).optional(),
  notes: z
    .string()
    .max(4000)
    .transform((v) => sanitizeProfileText(v, 4000))
    .optional(),
  manualRank: z.number().int().min(1).max(1000).nullable().optional(),
  runAnalysis: z.boolean().optional().default(false),
  runAiAnalysis: z.boolean().optional().default(false),
});

export async function PATCH(
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

  const rl = await applyRateLimit(req, APP_UPDATE_RL, user.id);
  if (!rl.allowed) return rl.errorResponse!;

  const { applicationId } = await context.params;
  const cleanAppId = (applicationId || '').trim();

  // Look up application via viewer check
  const appRecord = await DataStore.getApplicationById(cleanAppId, user.id);
  if (!appRecord) {
    return NextResponse.json(
      {
        ok: false,
        error: 'FORBIDDEN_OR_NOT_FOUND',
        message: 'Application not found or you do not have permission to access it.',
      },
      { status: 403, headers: rl.headers }
    );
  }

  // Strict organization ownership check (candidates cannot PATCH status/notes!)
  const isHrMember = await DataStore.isOrganizationMember(appRecord.orgId, user.id);
  if (!isHrMember) {
    return NextResponse.json(
      {
        ok: false,
        error: 'FORBIDDEN',
        message: 'Only organization HR members can update application status or notes.',
      },
      { status: 403, headers: rl.headers }
    );
  }

  const bodyRes = await parseBoundedJsonBody<Record<string, unknown>>(req, 64 * 1024);
  if (!bodyRes.ok) return bodyRes.errorResponse;

  const parsed = patchApplicationSchema.safeParse(bodyRes.data);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'VALIDATION_ERROR',
        message: parsed.error.issues[0]?.message || 'Invalid application update payload.',
      },
      { status: 400, headers: rl.headers }
    );
  }

  let updated = appRecord;
  if (
    parsed.data.status !== undefined ||
    parsed.data.notes !== undefined ||
    parsed.data.manualRank !== undefined
  ) {
    const res = await DataStore.updateApplicationStatusAndNotes(
      cleanAppId,
      appRecord.orgId,
      user.id,
      {
        status: parsed.data.status,
        notes: parsed.data.notes,
        manualRank: parsed.data.manualRank,
      }
    );
    if (res) updated = res;
  }

  if (parsed.data.runAnalysis || parsed.data.runAiAnalysis) {
    const batchRes = await DataStore.analyzeApplicantsBatchForHr({
      jobId: appRecord.jobId,
      orgId: appRecord.orgId,
      actorUserId: user.id,
      applicationIds: [cleanAppId],
    });

    if (batchRes.error === 'INSUFFICIENT_HR_CREDITS') {
      return NextResponse.json(
        {
          ok: false,
          error: 'INSUFFICIENT_HR_CREDITS',
          balanceAfter: batchRes.balanceAfter,
          purchaseUrl: '/pricing?tab=hr',
        },
        { status: 402, headers: rl.headers }
      );
    }

    if (batchRes.error === 'ORG_DAILY_LIMIT_EXCEEDED') {
      return NextResponse.json(
        {
          ok: false,
          error: 'ORG_DAILY_LIMIT_EXCEEDED',
          balanceAfter: batchRes.balanceAfter,
        },
        { status: 429, headers: rl.headers }
      );
    }

    const latest = await DataStore.getApplicationById(cleanAppId, user.id);
    if (latest) updated = latest;
  }

  return NextResponse.json(
    {
      ok: true,
      application: updated,
    },
    { status: 200, headers: rl.headers }
  );
}

