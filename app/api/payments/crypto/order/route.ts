import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { getReceivingWalletAddress } from '@/lib/payments/crypto-utils';
import { applyRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/payments/crypto/order?reference=ORD-XXXX
 * Retrieves order status and payment details for the authenticated order owner.
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthenticatedUser(req);
    if (!authUser || !authUser.userId) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required.' },
        { status: 401 }
      );
    }

    const rl = await applyRateLimit(req, {
      prefix: 'crypto_order_status',
      maxRequests: 60,
      windowMs: 60 * 1000,
      userId: authUser.userId,
    });
    if (!rl.allowed && rl.response) {
      return rl.response;
    }

    const searchParams = req.nextUrl.searchParams;
    const reference = searchParams.get('reference')?.trim();
    const orderId = searchParams.get('orderId')?.trim();

    if (!reference && !orderId) {
      return NextResponse.json(
        { error: 'reference or orderId query parameter is required' },
        { status: 400 }
      );
    }

    const order = reference
      ? await DataStore.findOrderByReference(reference)
      : await DataStore.findOrderById(orderId!);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or has expired' },
        { status: 404 }
      );
    }

    if (String(order.userId) !== String(authUser.userId)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'You do not have permission to access this order.' },
        { status: 403 }
      );
    }

    const now = Date.now();
    const expiresAtMs = new Date(order.expiresAt).getTime();
    const remainingSeconds = Math.max(0, Math.floor((expiresAtMs - now) / 1000));
    let currentStatus = order.status;

    // Check expiry
    if (remainingSeconds === 0 && (order.status === 'awaiting_payment' || order.status === 'created')) {
      await DataStore.updateOrderStatus(order.id, 'expired', {
        actor: 'system',
        note: 'Order expired on status query',
      });
      currentStatus = 'expired';
    }

    // Ensure recipient address is up-to-date with current env
    const recipientAddress =
      order.recipientAddress || getReceivingWalletAddress(order.network as any);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        reference: order.reference,
        planId: order.planId,
        billingCycle: order.billingCycle,
        baseAmount: order.baseAmount,
        amount: order.amount,
        currency: order.currency,
        network: order.network,
        method: order.method,
        status: currentStatus,
        recipientAddress,
        expiresAt: order.expiresAt,
        remainingSeconds,
        isExpired: remainingSeconds === 0 && currentStatus === 'expired',
        txid: order.txid || null,
        paidAt: order.paidAt || null,
      },
    });
  } catch (error: any) {
    console.error('Fetch crypto order error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}
