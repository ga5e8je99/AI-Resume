import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { isMockPaymentsAllowed } from '@/lib/payments/stripe';
import { applyRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/orders/status?reference=...
 * Authenticated endpoint that verifies order ownership (order.userId === user.id)
 * and returns strictly { status, planId, provider, amount, currency } with zero sensitive fields.
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const rateLimit = await applyRateLimit(
      req,
      { limit: 60, windowMs: 60 * 1000, keyPrefix: 'order_status' },
      authUser.userId
    );
    if (!rateLimit.allowed && rateLimit.errorResponse) {
      return rateLimit.errorResponse;
    }

    const reference = req.nextUrl.searchParams.get('reference')?.trim();
    if (!reference) {
      return NextResponse.json(
        { error: 'MISSING_REFERENCE' },
        { status: 400 }
      );
    }

    const order =
      (await DataStore.findOrderByReference(reference)) ||
      (await DataStore.findOrderById(reference));

    if (!order) {
      return NextResponse.json(
        { error: 'ORDER_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (String(order.userId) !== String(authUser.userId)) {
      return NextResponse.json(
        { error: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    let rawStatus = order.status;
    if (
      (rawStatus === 'awaiting_payment' || rawStatus === 'created') &&
      order.expiresAt &&
      new Date(order.expiresAt).getTime() <= Date.now()
    ) {
      await DataStore.updateOrderStatus(order.id, 'expired', {
        actor: 'system',
        note: 'Order expired on status check',
      });
      rawStatus = 'expired';
    }

    let status: 'paid' | 'awaiting_payment' | 'pending' | 'failed' | 'expired';
    if (rawStatus === 'paid') {
      status = 'paid';
    } else if (rawStatus === 'pending_review') {
      status = 'pending';
    } else if (rawStatus === 'expired') {
      status = 'expired';
    } else if (rawStatus === 'rejected') {
      status = 'failed';
    } else {
      status = 'awaiting_payment';
    }

    let provider: 'stripe' | 'paymob' | 'binance_pay' | 'manual_crypto';
    if (order.method === 'paymob' || order.network === 'paymob' || order.currency === 'EGP') {
      provider = 'paymob';
    } else if (order.method === 'stripe' || order.network === 'stripe' || order.currency === 'USD') {
      provider = 'stripe';
    } else if (order.method === 'binance_pay') {
      provider = 'binance_pay';
    } else {
      provider = 'manual_crypto';
    }

    return NextResponse.json(
      {
        status,
        planId: order.planId,
        provider,
        amount: order.amount,
        currency: order.currency,
      },
      {
        status: 200,
        headers: {
          'x-mock-payments-allowed': isMockPaymentsAllowed() ? 'true' : 'false',
        },
      }
    );
  } catch (error: any) {
    console.error('Order status check error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

