import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { applyRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/account/export
 * Authenticated, rate-limited endpoint to export all user data as JSON:
 * { exportedAt, profile, resumes, coverLetters, orders }
 */
export async function GET(req: NextRequest) {
  try {
    const { user, errorResponse } = requireAuth(req);
    if (!user || errorResponse) {
      return (
        errorResponse ||
        NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'Authentication required' },
          { status: 401 }
        )
      );
    }

    // Rate limit: 5 exports per hour per user (10 per IP)
    const rateLimit = await applyRateLimit(
      req,
      {
        limit: 5,
        ipLimit: 10,
        windowMs: 60 * 60 * 1000,
        keyPrefix: 'account_export',
      },
      user.id
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'RATE_LIMITED',
          message: 'Too many data export requests. Please try again later.',
        },
        {
          status: 429,
          headers: rateLimit.headers,
        }
      );
    }

    const exportedData = await DataStore.exportUserData(user.id);
    if (!exportedData) {
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', message: 'Account not found.' },
        { status: 404 }
      );
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `jobmatch-data-export-${dateStr}.json`;

    return new NextResponse(JSON.stringify(exportedData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('[Account Export Error]', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to export account data.' },
      { status: 500 }
    );
  }
}

