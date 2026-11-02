import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, validateCsrfOrigin } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { applyRateLimit, parseBoundedJsonBody } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/email';

const VERIFY_ORG_RL = {
  keyPrefix: 'api_employer_org_verify',
  limit: 10,
  ipLimit: 25,
  windowMs: 60 * 1000,
};

const verifyPayloadSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('request'),
    workEmail: z.string().email().max(180),
  }),
  z.object({
    action: z.literal('confirm'),
    code: z.string().min(4).max(12),
  }),
]);

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ orgId: string }> }
) {
  if (!validateCsrfOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: 'CSRF_ORIGIN_MISMATCH', message: 'Invalid request origin.' },
      { status: 403 }
    );
  }

  const { user, errorResponse } = requireAuth(req);
  if (errorResponse || !user) return errorResponse!;

  const rl = await applyRateLimit(req, VERIFY_ORG_RL, user.id);
  if (!rl.allowed) return rl.errorResponse!;

  const { orgId } = await context.params;
  const cleanOrgId = (orgId || '').trim();

  // Strict ownership check
  const isMember = await DataStore.isOrganizationMember(cleanOrgId, user.id);
  if (!isMember) {
    return NextResponse.json(
      {
        ok: false,
        error: 'FORBIDDEN',
        message: 'You do not have permission to verify this organization.',
      },
      { status: 403, headers: rl.headers }
    );
  }

  const bodyRes = await parseBoundedJsonBody<Record<string, unknown>>(req, 32 * 1024);
  if (!bodyRes.ok) return bodyRes.errorResponse;

  const parsed = verifyPayloadSchema.safeParse(bodyRes.data);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'VALIDATION_ERROR',
        message: parsed.error.issues[0]?.message || 'Invalid verification payload.',
      },
      { status: 400, headers: rl.headers }
    );
  }

  if (parsed.data.action === 'request') {
    const reqRes = await DataStore.requestOrganizationDomainVerification(
      cleanOrgId,
      user.id,
      parsed.data.workEmail
    );

    if (!reqRes.ok) {
      const status = reqRes.error === 'FORBIDDEN_ORG_MEMBER_REQUIRED' ? 403 : 400;
      return NextResponse.json(
        {
          ok: false,
          error: reqRes.error,
          message:
            reqRes.error === 'CONSUMER_EMAIL_DOMAIN_NOT_ALLOWED'
              ? 'Please use an official company domain email (not Gmail, Yahoo, Outlook, etc.).'
              : 'Invalid company email.',
        },
        { status, headers: rl.headers }
      );
    }

    const org = await DataStore.getOrganizationById(cleanOrgId);
    await sendEmail({
      to: reqRes.workEmail!,
      subject: `Verify your organization domain for ${org?.name || 'JobMatch AI'}`,
      html: `<div style="font-family:sans-serif;padding:24px;">
        <h2 style="color:rgb(4,120,87);">Organization Domain Verification</h2>
        <p>Your verification code for <strong>${org?.name || 'your organization'}</strong> is:</p>
        <div data-verification-code="${reqRes.code}" style="font-size:28px;font-weight:bold;letter-spacing:4px;padding:12px 20px;background:#f0fdf4;border:1px solid rgb(4,120,87);border-radius:8px;display:inline-block;">
          ${reqRes.code}
        </div>
        <p style="color:#64748b;font-size:13px;margin-top:16px;">This code expires in 24 hours.</p>
      </div>`,
    });

    return NextResponse.json(
      {
        ok: true,
        workEmail: reqRes.workEmail,
        domain: reqRes.domain,
        message: 'Verification code sent to your company email.',
      },
      { status: 200, headers: rl.headers }
    );
  }

  // Confirm verification code
  const confirmRes = await DataStore.confirmOrganizationDomainVerification(
    cleanOrgId,
    user.id,
    parsed.data.code
  );

  if (!confirmRes.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: confirmRes.error,
        message: 'Invalid or expired verification code.',
      },
      { status: 400, headers: rl.headers }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      organization: confirmRes.organization,
    },
    { status: 200, headers: rl.headers }
  );
}

