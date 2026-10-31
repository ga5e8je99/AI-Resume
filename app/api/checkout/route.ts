import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { getPlanById, BillingCycle } from '@/lib/plans';
import { createCheckout, ProviderNotConfiguredError } from '@/lib/payments';
import { applyRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/checkout
 * Authenticated endpoint to initiate a checkout session.
 * Always validates plan and prices server-side from lib/plans.ts.
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Please sign in or create an account to upgrade.',
          loginUrl: '/login?redirect=/pricing',
        },
        { status: 401 }
      );
    }

    const rateLimit = await applyRateLimit(
      req,
      { limit: 20, ipLimit: 40, windowMs: 60 * 1000, keyPrefix: 'checkout' },
      authUser.userId
    );
    if (!rateLimit.allowed && rateLimit.errorResponse) {
      return rateLimit.errorResponse;
    }

    const user = await DataStore.findUserById(authUser.userId);
    if (!user) {
      return NextResponse.json(
        {
          error: 'USER_NOT_FOUND',
          message: 'User account could not be found.',
        },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      planId,
      currency: rawCurrency,
      billingCycle: rawBillingCycle,
      method: rawMethod,
      network: rawNetwork,
    } = body;

    if (!planId) {
      return NextResponse.json(
        {
          error: 'MISSING_PLAN_ID',
          message: 'planId is required.',
        },
        { status: 400 }
      );
    }

    // Server-side plan validation (Never trust prices sent from client)
    const plan = getPlanById(planId);
    if (!plan) {
      return NextResponse.json(
        {
          error: 'INVALID_PLAN',
          message: `Plan "${planId}" does not exist in system catalog.`,
        },
        { status: 400 }
      );
    }

    if (plan.id === 'free') {
      return NextResponse.json(
        {
          error: 'FREE_PLAN',
          message: 'The Starter plan is free and does not require payment checkout.',
        },
        { status: 400 }
      );
    }

    // Validate currency and parameters
    const currency =
      rawCurrency === 'EGP' ? 'EGP' : rawCurrency === 'USDT' ? 'USDT' : 'USD';
    const billingCycle: BillingCycle = rawBillingCycle === 'annual' ? 'annual' : 'monthly';
    const method =
      rawMethod === 'binance' || rawMethod === 'manual_crypto'
        ? rawMethod
        : currency === 'USDT'
        ? 'binance'
        : 'auto';
    const network = rawNetwork === 'TRC20' ? 'TRC20' : 'BEP20';

    // Dispatch to universal payment provider abstraction
    const checkoutResult = await createCheckout({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        stripeCustomerId: (user as any).stripeCustomerId || '',
      },
      planId: plan.id,
      currency,
      billingCycle,
      method,
      network,
    });

    return NextResponse.json({
      success: true,
      url: checkoutResult.url,
      provider: checkoutResult.provider,
      sessionId: checkoutResult.sessionId,
      orderId: checkoutResult.orderId,
      reference: checkoutResult.reference,
      amount: checkoutResult.amount,
      network: checkoutResult.network,
    });
  } catch (error: any) {
    if (
      error instanceof ProviderNotConfiguredError ||
      error?.name === 'ProviderNotConfiguredError' ||
      error?.code === 'PROVIDER_NOT_CONFIGURED'
    ) {
      return NextResponse.json(
        {
          error: 'PROVIDER_NOT_CONFIGURED',
          message: error?.message || 'Payment provider is not configured.',
        },
        { status: 503 }
      );
    }

    console.error('Checkout creation error:', error);
    return NextResponse.json(
      {
        error: 'CHECKOUT_ERROR',
        message: error?.message || 'Failed to create checkout session.',
      },
      { status: 500 }
    );
  }
}
