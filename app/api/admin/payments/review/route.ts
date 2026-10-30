import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { sendEmail, getPaymentReceiptEmailHtml } from '@/lib/email';

/**
 * POST /api/admin/payments/review
 * Approves or rejects a manual payment order.
 * Protected by ADMIN_EMAILS allowlist.
 *
 * Body: { orderId: string, action: 'approve' | 'reject', reason?: string }
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

    const body = await req.json().catch(() => ({}));
    const { orderId, action, reason } = body;

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
        actor: `admin (${adminEmail})`,
        note: reason || 'Approved manually by admin after reviewing transaction',
      });

      if (!result.success) {
        return NextResponse.json(
          { error: 'Failed to complete order.' },
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
