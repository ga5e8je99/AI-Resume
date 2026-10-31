import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import {
  createStripeBillingPortalSession,
  ProviderNotConfiguredError,
  isMockPaymentsAllowed,
} from '@/lib/payments/stripe';
import { applyRateLimit } from '@/lib/rate-limit';

async function resolvePortalUrl(req: NextRequest) {
  const authUser = getAuthenticatedUser(req);
  if (!authUser) {
    return {
      status: 401,
      body: {
        error: 'UNAUTHORIZED',
        message: 'Please sign in to manage your subscription.',
      },
    };
  }

  const rateLimit = await applyRateLimit(
    req,
    { limit: 20, ipLimit: 40, windowMs: 60 * 1000, keyPrefix: 'billing_portal' },
    authUser.userId
  );
  if (!rateLimit.allowed) {
    return {
      status: 429,
      headers: rateLimit.headers,
      body: {
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please slow down.',
      },
    };
  }

  const user = await DataStore.findUserById(authUser.userId);
  if (!user) {
    return {
      status: 404,
      body: {
        error: 'USER_NOT_FOUND',
        message: 'User account could not be found.',
      },
    };
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  let returnUrl = `${appUrl}/dashboard?tab=settings`;
  if (req.method === 'POST') {
    const body = await req.json().catch(() => ({}));
    if (typeof body?.returnUrl === 'string' && body.returnUrl.trim()) {
      returnUrl = body.returnUrl.trim();
    }
  } else {
    const queryReturnUrl = req.nextUrl.searchParams.get('returnUrl');
    if (queryReturnUrl && queryReturnUrl.trim()) {
      returnUrl = queryReturnUrl.trim();
    }
  }

  const customerId =
    (user as any).stripeCustomerId ||
    ((user as any).paymentProvider === 'stripe' ? (user as any).providerCustomerId : '') ||
    (isMockPaymentsAllowed() ? `cus_mock_${user.id}` : '');

  if (!customerId) {
    return {
      status: 400,
      body: {
        error: 'NO_STRIPE_CUSTOMER',
        message: 'No active Stripe customer billing record is linked to this account.',
      },
    };
  }

  const session = await createStripeBillingPortalSession({
    customerId,
    returnUrl,
  });

  return {
    status: 200,
    body: {
      success: true,
      url: session.url,
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const result = await resolvePortalUrl(req);
    return NextResponse.json(result.body, {
      status: result.status,
      headers: (result as any).headers,
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
          message: error?.message || 'Stripe Billing Portal is not configured.',
        },
        { status: 503 }
      );
    }

    console.error('Billing portal session error:', error);
    return NextResponse.json(
      {
        error: 'BILLING_PORTAL_ERROR',
        message: error?.message || 'Failed to open Stripe Billing Portal.',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const result = await resolvePortalUrl(req);
    if (result.status === 200 && (result.body as any).url) {
      const accept = req.headers.get('accept') || '';
      if (accept.includes('text/html')) {
        return NextResponse.redirect((result.body as any).url);
      }
    }
    return NextResponse.json(result.body, {
      status: result.status,
      headers: (result as any).headers,
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
          message: error?.message || 'Stripe Billing Portal is not configured.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'BILLING_PORTAL_ERROR',
        message: error?.message || 'Failed to open Stripe Billing Portal.',
      },
      { status: 500 }
    );
  }
}

