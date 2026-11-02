import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/app/lib/datastore';
import { requireAuth } from '@/app/lib/auth';
import { applyRateLimit } from '@/app/lib/rateLimit';

export async function GET(request: NextRequest) {
  try {
    const rl = await applyRateLimit(request, {
      limit: 60,
      windowMs: 60 * 1000,
      keyPrefix: 'candidate_apps_get',
    });
    if (!rl.allowed) return rl.errorResponse!;

    const auth = requireAuth(request);
    if (auth.errorResponse || !auth.user) {
      return (
        auth.errorResponse ||
        NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
      );
    }

    const applications = await DataStore.getCandidateApplicationsEnriched(auth.user.id);
    return NextResponse.json({
      ok: true,
      applications,
    });
  } catch (err) {
    console.error('[GET /api/applications] Error:', err);
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
