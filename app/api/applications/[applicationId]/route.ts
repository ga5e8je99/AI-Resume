import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/app/lib/datastore';
import { requireAuth, validateCsrfOrigin } from '@/app/lib/auth';
import { applyRateLimit } from '@/app/lib/rateLimit';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ applicationId: string }> }
) {
  try {
    if (!validateCsrfOrigin(request)) {
      return NextResponse.json({ ok: false, error: 'INVALID_ORIGIN' }, { status: 403 });
    }

    const rl = await applyRateLimit(request, {
      limit: 20,
      windowMs: 60 * 1000,
      keyPrefix: 'candidate_app_withdraw',
    });
    if (!rl.allowed) return rl.errorResponse!;

    const auth = requireAuth(request);
    if (auth.errorResponse || !auth.user) {
      return (
        auth.errorResponse ||
        NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
      );
    }

    const { applicationId } = await context.params;
    const cleanId = String(applicationId || '').trim();
    if (!cleanId) {
      return NextResponse.json({ ok: false, error: 'INVALID_ID' }, { status: 400 });
    }

    const result = await DataStore.withdrawCandidateApplication(cleanId, auth.user.id);
    if (!result.deleted) {
      if (result.error === 'APPLICATION_NOT_FOUND') {
        return NextResponse.json({ ok: false, error: 'APPLICATION_NOT_FOUND' }, { status: 404 });
      }
      if (result.error === 'FORBIDDEN') {
        return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });
      }
      return NextResponse.json({ ok: false, error: 'WITHDRAW_FAILED' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      deletedApplicationId: cleanId,
      jobId: result.jobId,
    });
  } catch (err) {
    console.error('[DELETE /api/applications/[applicationId]] Error:', err);
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
