import { NextRequest, NextResponse } from 'next/server';
import DataStore from '@/app/lib/datastore';
import { verifyCryptoPayment } from '@/lib/payments/manual-crypto';
import { sendEmail, getPaymentReceiptEmailHtml } from '@/lib/email';

// Rate limiter: IP -> array of timestamps
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_VERIFY_REQUESTS = 12;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= MAX_VERIFY_REQUESTS) {
    return true;
  }
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return false;
}

/**
 * POST /api/payments/crypto/verify
 * Submits a transaction hash (TXID) for on-chain verification
 *
 * Body: { reference: string, txid: string }
 */
export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'anonymous';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many verification attempts. Please wait 1 minute before retrying.',
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { reference, orderId, txid } = body;

    if ((!reference && !orderId) || !txid || typeof txid !== 'string') {
      return NextResponse.json(
        {
          error: 'INVALID_INPUT',
          message: 'Both order reference and transaction hash (txid) are required.',
        },
        { status: 400 }
      );
    }

    const cleanTxid = txid.trim();

    // Find the order
    const order = reference
      ? await DataStore.findOrderByReference(reference)
      : await DataStore.findOrderById(orderId);

    if (!order) {
      return NextResponse.json(
        {
          error: 'ORDER_NOT_FOUND',
          message: 'Order could not be located or has expired.',
        },
        { status: 404 }
      );
    }

    // Idempotency: if already completed, return immediately
    if (order.status === 'paid') {
      return NextResponse.json({
        success: true,
        status: 'paid',
        alreadyPaid: true,
        message: 'This order is already confirmed and paid.',
        order: {
          id: order.id,
          reference: order.reference,
          status: 'paid',
          txid: order.txid,
        },
      });
    }

    if (order.status === 'expired') {
      return NextResponse.json(
        {
          error: 'ORDER_EXPIRED',
          status: 'expired',
          message: 'This payment order has expired. Please create a new order with the updated amount.',
        },
        { status: 400 }
      );
    }

    // Run on-chain verification
    const verification = await verifyCryptoPayment(order, cleanTxid);

    if (verification.verified && verification.status === 'paid') {
      // Auto-activate plan/credits
      const completeResult = await DataStore.completeOrder(order.id, {
        txid: cleanTxid,
        actor: 'on_chain_verifier',
        note: `On-chain verification succeeded on ${order.network} (${verification.txDetails?.amount} USDT, ${verification.txDetails?.confirmations} confs)`,
      });

      // Send payment receipt email
      const user = await DataStore.findUserById(order.userId);
      const emailHtml = getPaymentReceiptEmailHtml({
        name: user?.name || 'Valued Member',
        amount: order.amount,
        currency: 'USDT',
        planId: order.planId,
        transactionId: cleanTxid,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
      });

      sendEmail({
        to: order.userEmail,
        subject: `Payment Receipt: JobMatch ${order.planId.toUpperCase()} Subscription Confirmation`,
        html: emailHtml,
        isDemo: user?.isDemo,
      }).catch((emailErr) => {
        console.error('Failed to send receipt email:', emailErr);
      });

      return NextResponse.json({
        success: true,
        status: 'paid',
        message: 'Payment verified successfully! Your account has been upgraded.',
        txDetails: verification.txDetails,
        order: completeResult.order,
      });
    }

    if (verification.status === 'pending_review') {
      // Inconclusive verification (e.g. explorer timeout, pending mempool confirmations)
      await DataStore.updateOrderStatus(order.id, 'pending_review', {
        txid: cleanTxid,
        actor: 'on_chain_verifier',
        note: `Verification inconclusive: ${verification.reason}`,
      });

      return NextResponse.json({
        success: false,
        status: 'pending_review',
        message:
          verification.reason ||
          'Your transaction has been submitted and is pending network confirmations or manual review. You will be notified shortly.',
      });
    }

    // Rejected
    await DataStore.updateOrderStatus(order.id, order.status, {
      actor: 'on_chain_verifier',
      note: `Verification failed: ${verification.reason}`,
    });

    return NextResponse.json(
      {
        success: false,
        status: 'rejected',
        error: 'VERIFICATION_FAILED',
        message: verification.reason || 'Transaction verification failed.',
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Crypto verification API error:', error);
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: error?.message || 'Internal error during payment verification.',
      },
      { status: 500 }
    );
  }
}
