import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';

export async function GET(req: NextRequest) {
  try {
    const auth = verifyAdmin(req);
    if (!auth.isAdmin) {
      return NextResponse.json(
        { error: auth.reason || 'Admin access required' },
        { status: 403 }
      );
    }

    const stats = await DataStore.getAdminStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}
