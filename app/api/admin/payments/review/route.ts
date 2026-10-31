import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { sendEmail, getPaymentReceiptEmailHtml } from '@/lib/email';
import { applyRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/admin/payments/review
 * Approves or rejects a manual payment order.
 * Protected by ADMIN_EMAILS allowlist and shared rate limiter.
 *
 * Body: { orderId: string, action: 'approve' | 'reject', reason?: string, txid?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = verifyAdmin(req);
    if (!auth.isAdmin) {
      return NextResponse.json(
        { error: auth.reason || 'Admin access required' },
        { status: 403 }
      );
    }

    const rl = await applyRateLimit(req, {
      prefix: 'admin_payment_review',
      maxRequests: 60,
      windowMs: 60 * 1000,
      userId: auth.user?.userId,
    });
    if (!rl.allowed && rl.response) {
      return rl.response;
    }

    const body = await req.json().catch(() => ({}));
    const { orderId, action, reason, txid } = body;

    if (!orderId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Valid orderId and action ("approve" | "reject") are required.' },
        { status: 400 }
      );
    }

    const order = await DataStore.findOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const adminEmail = auth.user?.email || 'admin';

    if (action === 'approve') {
      const result = await DataStore.completeOrder(orderId, {
        txid: typeof txid === 'string' && txid.trim() ? txid.trim().toLowerCase() : undefined,
        actor: `admin (${adminEmail})`,
        note: reason || 'Approved manually by admin after reviewing transaction',
      });

      if (!result.success) {
        if (result.error === 'TXID_ALREADY_USED') {
          return NextResponse.json(
            {
              error: 'TXID_ALREADY_USED',
              message: 'This transaction hash (txid) has already been used for another order.',
            },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: result.error || 'Failed to complete order.' },
          { status: 500 }
        );
      }

      // Send confirmation email to user
      const user = await DataStore.findUserById(order.userId);
      const emailHtml = getPaymentReceiptEmailHtml({
        name: user?.name || 'Valued Member',
        amount: order.amount,
        currency: 'USDT',
        planId: order.planId,
        transactionId: order.txid || order.reference,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
      });

      sendEmail({
        to: order.userEmail,
        subject: `Payment Approved: JobMatch ${order.planId.toUpperCase()} Subscription Confirmation`,
        html: emailHtml,
        isDemo: user?.isDemo,
      }).catch((emailErr) => {
        console.error('Failed to send receipt email from admin approval:', emailErr);
      });

      return NextResponse.json({
        success: true,
        action: 'approved',
        order: result.order,
      });
    }

    if (action === 'reject') {
      const updated = await DataStore.updateOrderStatus(orderId, 'rejected', {
        actor: `admin (${adminEmail})`,
        note: reason || 'Rejected manually by admin after verification failure',
      });

      return NextResponse.json({
        success: true,
        action: 'rejected',
        order: updated,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin review error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to review order' },
      { status: 500 }
    );
  }
}
