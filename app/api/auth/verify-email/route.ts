import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import DataStore from '@/app/lib/datastore';
import { applyRateLimit, parseBoundedJsonBody } from '@/lib/rate-limit';
import { trackServerEvent } from '@/lib/analytics';

async function handleVerifyToken(rawToken: string | null | undefined) {
  if (!rawToken || typeof rawToken !== 'string' || rawToken.trim().length < 16 || rawToken.length > 256) {
    return NextResponse.json(
      {
        error: 'INVALID_OR_EXPIRED_TOKEN',
        message: 'Invalid or expired verification link. Please request a new verification email.',
      },
      { status: 400 }
    );
  }

  const cleanToken = rawToken.trim();
  const tokenHash = crypto.createHash('sha256').update(cleanToken).digest('hex');

  const user = await DataStore.findUserByEmailVerifyToken(tokenHash);
  if (!user) {
    return NextResponse.json(
      {
        error: 'INVALID_OR_EXPIRED_TOKEN',
        message: 'Invalid or expired verification link. Please request a new verification email.',
      },
      { status: 400 }
    );
  }

  if (user.emailVerifyExpires && new Date(user.emailVerifyExpires).getTime() <= Date.now()) {
    return NextResponse.json(
      {
        error: 'INVALID_OR_EXPIRED_TOKEN',
        message: 'Verification link has expired. Please request a new verification email.',
      },
      { status: 400 }
    );
  }

  const verified = await DataStore.verifyUserEmail(user.id);
  if (!verified) {
    return NextResponse.json(
      {
        error: 'VERIFICATION_FAILED',
        message: 'Could not verify email address. Please try again.',
      },
      { status: 500 }
    );
  }

  trackServerEvent('email_verified', { method: 'token' }, { distinctId: user.id });

  return NextResponse.json(
    {
      success: true,
      emailVerified: new Date().toISOString(),
      message: 'Your email address has been verified successfully.',
    },
    { status: 200 }
  );
}

/**
 * GET /api/auth/verify-email?token=...
 * Verifies user email token, activates account, and deletes the verification token.
 */
export async function GET(req: NextRequest) {
  try {
    const rateLimit = await applyRateLimit(req, {
      limit: 20,
      ipLimit: 30,
      windowMs: 15 * 60 * 1000,
      keyPrefix: 'verify_email_get',
    });
    if (!rateLimit.allowed && rateLimit.errorResponse) {
      return rateLimit.errorResponse;
    }

    const token = req.nextUrl.searchParams.get('token');
    return await handleVerifyToken(token);
  } catch (error: any) {
    console.error('[Verify Email GET Error]', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'An unexpected error occurred while verifying your email.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/verify-email
 * Body: { token: string }
 * Verifies user email token, activates account, and deletes the verification token.
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimit = await applyRateLimit(req, {
      limit: 20,
      ipLimit: 30,
      windowMs: 15 * 60 * 1000,
      keyPrefix: 'verify_email_post',
    });
    if (!rateLimit.allowed && rateLimit.errorResponse) {
      return rateLimit.errorResponse;
    }

    const parsed = await parseBoundedJsonBody(req, 8 * 1024);
    if (!parsed.ok) {
      return parsed.errorResponse;
    }

    const token = parsed.data?.token || req.nextUrl.searchParams.get('token');
    return await handleVerifyToken(token);
  } catch (error: any) {
    console.error('[Verify Email POST Error]', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'An unexpected error occurred while verifying your email.' },
      { status: 500 }
    );
  }
}

