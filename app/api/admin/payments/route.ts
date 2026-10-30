import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';

/**
 * GET /api/admin/payments?status=pending_review
 * Protected by ADMIN_EMAILS allowlist / admin verification
 */
export async function GET(req: NextRequest) {
  try {
    const auth = verifyAdmin(req);
    if (!auth.isAdmin) {
      return NextResponse.json(
        { error: auth.reason || 'Admin access required' },
        { status: 403 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all';

    const orders = await DataStore.listOrders({
      status: status !== 'all' ? status : undefined,
      limit: 200,
    });

    return NextResponse.json({
      success: true,
      orders,
      count: orders.length,
    });
  } catch (error: any) {
    console.error('Admin list orders error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to retrieve orders' },
      { status: 500 }
    );
  }
}
