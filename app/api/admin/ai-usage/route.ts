import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { getCircuitBreakerState, getRecentAiAlerts } from '@/app/lib/aiGovernance';

export async function GET(req: NextRequest) {
  try {
    const auth = verifyAdmin(req);
    if (!auth.isAdmin) {
      return NextResponse.json(
        { error: auth.reason || 'Admin access required' },
        { status: 403 }
      );
    }

    const usageStats = await DataStore.getAiUsageStats();
    const circuitBreaker = getCircuitBreakerState();
    const alerts = getRecentAiAlerts();

    return NextResponse.json({
      success: true,
      ...usageStats,
      circuitBreaker,
      alerts,
    });
  } catch (error: any) {
    console.error('[Admin AI Usage] Error fetching AI usage stats:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch AI usage stats' },
      { status: 500 }
    );
  }
}

