import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, validateCsrfOrigin } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { applyRateLimit, parseBoundedJsonBody } from '@/lib/rate-limit';
import { HR_CREDIT_PACKS, getHrPackById, isHrPackId } from '@/lib/plans';
import { createCheckout, ProviderNotConfiguredError } from '@/lib/payments';

const BILLING_GET_RL = {
  keyPrefix: 'api_employer_billing_get',
  limit: 60,
  ipLimit: 120,
  windowMs: 60 * 1000,
};

const BILLING_MUTATE_RL = {
  keyPrefix: 'api_employer_billing_mutate',
  limit: 25,
  ipLimit: 50,
  windowMs: 60 * 1000,
};

const billingSettingsSchema = z.object({
  orgId: z.string().min(1).max(120).optional(),
  monthlySpendCap: z.number().int().min(1).max(1_000_000).nullable().optional(),
  lowBalanceThreshold: z.number().int().min(0).max(100_000).optional(),
  lowBalanceAlertEnabled: z.boolean().optional(),
});

const billingCheckoutSchema = z.object({
  orgId: z.string().min(1).max(120).optional(),
  packId: z.enum(['hr_pack_50', 'hr_pack_200', 'hr_pack_1000']),
  currency: z.enum(['USD', 'EGP']).optional().default('USD'),
});

async function resolveTargetOrganization(userId: string, requestedOrgId?: string | null) {
  if (requestedOrgId && requestedOrgId.trim()) {
    const cleanOrgId = requestedOrgId.trim();
    const isMember = await DataStore.isOrganizationMember(cleanOrgId, userId);
    if (!isMember) {
      return { org: null, forbidden: true };
    }
    const org = await DataStore.getOrganizationById(cleanOrgId);
    return { org, forbidden: false };
  }

  const userOrgs = await DataStore.getUserOrganizations(userId);
  if (userOrgs.length > 0) {
    return { org: userOrgs[0], forbidden: false };
  }

  return { org: null, forbidden: false };
}

/**
 * GET /api/employer/billing
 * Returns Organization HR credit balance, monthly spend vs cap, low-balance warning status,
 * negative-balance block status, credit ledger history, recent HR pack orders, and available 50/200/1000 credit packs.
 */
export async function GET(req: NextRequest) {
  const { user, errorResponse } = requireAuth(req);
  if (errorResponse || !user) return errorResponse!;

  const rl = await applyRateLimit(req, BILLING_GET_RL, user.id);
  if (!rl.allowed) return rl.errorResponse!;

  const requestedOrgId = req.nextUrl.searchParams.get('orgId');
  const { org, forbidden } = await resolveTargetOrganization(user.id, requestedOrgId);

  if (forbidden) {
    return NextResponse.json(
      {
        ok: false,
        error: 'FORBIDDEN',
        message: 'You do not have access to this organization billing account.',
      },
      { status: 403, headers: rl.headers }
    );
  }

  if (!org) {
    return NextResponse.json(
      {
        ok: true,
        organization: null,
        monthlySpent: 0,
        lowBalanceWarning: false,
        negativeBalanceBlocked: false,
        ledger: [],
        orders: [],
        packs: HR_CREDIT_PACKS,
      },
      { status: 200, headers: rl.headers }
    );
  }

  const [ledger, monthlySpent, userOrders] = await Promise.all([
    DataStore.getHrCreditLedger(org.id, 100),
    DataStore.getOrgMonthlyCreditSpend(org.id),
    DataStore.listOrders({ userId: user.id, limit: 50 }),
  ]);

  const orgOrders = userOrders.filter(
    (o) => isHrPackId(o.planId) && (!o.metadata?.orgId || o.metadata.orgId === org.id)
  );

  const threshold =
    typeof org.lowBalanceThreshold === 'number' ? org.lowBalanceThreshold : 10;
  const alertEnabled = org.lowBalanceAlertEnabled !== false;
  const lowBalanceWarning = alertEnabled && org.hrCredits <= threshold;
  const negativeBalanceBlocked = org.hrCredits < 0;

  return NextResponse.json(
    {
      ok: true,
      organization: org,
      monthlySpent,
      lowBalanceWarning,
      negativeBalanceBlocked,
      ledger,
      orders: orgOrders,
      packs: HR_CREDIT_PACKS,
    },
    { status: 200, headers: rl.headers }
  );
}

/**
 * PUT /api/employer/billing
 * Updates Organization billing settings:
 * - monthlySpendCap (optional monthly credit spend limit, or null for unlimited)
 * - lowBalanceThreshold (threshold for low-balance warning & email alert)
 * - lowBalanceAlertEnabled (toggle low-balance alerts)
 */
export async function PUT(req: NextRequest) {
  if (!validateCsrfOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: 'CSRF_ORIGIN_MISMATCH', message: 'Invalid request origin.' },
      { status: 403 }
    );
  }

  const { user, errorResponse } = requireAuth(req);
  if (errorResponse || !user) return errorResponse!;

  const rl = await applyRateLimit(req, BILLING_MUTATE_RL, user.id);
  if (!rl.allowed) return rl.errorResponse!;

  const bodyRes = await parseBoundedJsonBody<Record<string, unknown>>(req, 32 * 1024);
  if (!bodyRes.ok) return bodyRes.errorResponse;

  const parsed = billingSettingsSchema.safeParse(bodyRes.data);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'VALIDATION_ERROR',
        message: parsed.error.issues[0]?.message || 'Invalid billing settings.',
      },
      { status: 400, headers: rl.headers }
    );
  }

  const { org, forbidden } = await resolveTargetOrganization(user.id, parsed.data.orgId);
  if (forbidden) {
    return NextResponse.json(
      {
        ok: false,
        error: 'FORBIDDEN',
        message: 'You do not have permission to modify billing settings for this organization.',
      },
      { status: 403, headers: rl.headers }
    );
  }
  if (!org) {
    return NextResponse.json(
      {
        ok: false,
        error: 'ORGANIZATION_NOT_FOUND',
        message: 'Organization not found.',
      },
      { status: 404, headers: rl.headers }
    );
  }

  const updatedOrg = await DataStore.updateOrganizationBillingSettings(org.id, user.id, {
    monthlySpendCap: parsed.data.monthlySpendCap,
    lowBalanceThreshold: parsed.data.lowBalanceThreshold,
    lowBalanceAlertEnabled: parsed.data.lowBalanceAlertEnabled,
  });

  const monthlySpent = await DataStore.getOrgMonthlyCreditSpend(org.id);
  const threshold =
    typeof updatedOrg?.lowBalanceThreshold === 'number'
      ? updatedOrg.lowBalanceThreshold
      : 10;
  const alertEnabled = updatedOrg?.lowBalanceAlertEnabled !== false;

  return NextResponse.json(
    {
      ok: true,
      organization: updatedOrg,
      monthlySpent,
      lowBalanceWarning: Boolean(
        updatedOrg && alertEnabled && updatedOrg.hrCredits <= threshold
      ),
      negativeBalanceBlocked: Boolean(updatedOrg && updatedOrg.hrCredits < 0),
    },
    { status: 200, headers: rl.headers }
  );
}

/**
 * POST /api/employer/billing
 * Initiates a Lemon Squeezy checkout session for an HR Credit Pack (50 / 200 / 1000 credits)
 * using dedicated Lemon Squeezy product variants (`LEMONSQUEEZY_VARIANT_HR_50`, `200`, `1000`).
 * Note: Credits are NEVER activated here — they are activated strictly via verified webhook (`order_created`).
 */
export async function POST(req: NextRequest) {
  if (!validateCsrfOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: 'CSRF_ORIGIN_MISMATCH', message: 'Invalid request origin.' },
      { status: 403 }
    );
  }

  const { user, errorResponse } = requireAuth(req);
  if (errorResponse || !user) return errorResponse!;

  const rl = await applyRateLimit(req, BILLING_MUTATE_RL, user.id);
  if (!rl.allowed) return rl.errorResponse!;

  const bodyRes = await parseBoundedJsonBody<Record<string, unknown>>(req, 32 * 1024);
  if (!bodyRes.ok) return bodyRes.errorResponse;

  const parsed = billingCheckoutSchema.safeParse(bodyRes.data);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'VALIDATION_ERROR',
        message: parsed.error.issues[0]?.message || 'Invalid HR credit pack selection.',
      },
      { status: 400, headers: rl.headers }
    );
  }

  const { org, forbidden } = await resolveTargetOrganization(user.id, parsed.data.orgId);
  if (forbidden) {
    return NextResponse.json(
      {
        ok: false,
        error: 'FORBIDDEN',
        message: 'You do not have permission to purchase credits for this organization.',
      },
      { status: 403, headers: rl.headers }
    );
  }
  if (!org) {
    return NextResponse.json(
      {
        ok: false,
        error: 'ORGANIZATION_NOT_FOUND',
        message: 'Please create an employer organization first.',
      },
      { status: 404, headers: rl.headers }
    );
  }

  const pack = getHrPackById(parsed.data.packId);
  if (!pack) {
    return NextResponse.json(
      {
        ok: false,
        error: 'INVALID_PACK',
        message: 'Selected HR credit pack does not exist.',
      },
      { status: 400, headers: rl.headers }
    );
  }

  const dbUser = await DataStore.findUserById(user.id);
  if (!dbUser) {
    return NextResponse.json(
      { ok: false, error: 'USER_NOT_FOUND', message: 'User account not found.' },
      { status: 404, headers: rl.headers }
    );
  }

  try {
    const checkout = await createCheckout({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        lemonCustomerId: (dbUser as any).lemonCustomerId || '',
      },
      planId: pack.id,
      currency: parsed.data.currency,
      billingCycle: 'monthly',
      method: 'lemonsqueezy',
      provider: 'lemonsqueezy',
      orgId: org.id,
      metadata: {
        orgId: org.id,
        orgName: org.name,
        isHrPack: true,
        hrCredits: Number(pack.credits),
      },
    });

    return NextResponse.json(
      {
        ok: true,
        url: checkout.url,
        checkoutUrl: checkout.url,
        provider: checkout.provider,
        orderId: checkout.orderId,
        reference: checkout.reference,
        orderReference: checkout.reference,
        packId: pack.id,
        amount: checkout.amount,
        amountUsd: checkout.amount,
        credits: Number(pack.credits),
      },
      { status: 200, headers: rl.headers }
    );
  } catch (err: any) {
    if (
      err instanceof ProviderNotConfiguredError ||
      err?.name === 'ProviderNotConfiguredError' ||
      err?.code === 'PROVIDER_NOT_CONFIGURED'
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: 'PROVIDER_NOT_CONFIGURED',
          message: err?.message || 'Lemon Squeezy HR pack variant is not configured.',
        },
        { status: 503, headers: rl.headers }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: 'CHECKOUT_FAILED',
        message: err?.message || 'Failed to create HR credit pack checkout.',
      },
      { status: 500, headers: rl.headers }
    );
  }
}

