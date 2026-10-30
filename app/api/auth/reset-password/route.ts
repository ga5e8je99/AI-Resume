import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import DataStore from '@/app/lib/datastore';
import { hashPassword } from '@/app/lib/auth';

/**
 * POST /api/auth/reset-password
 * Confirms password reset.
 * Validates the token against stored SHA-256 hash & expiration,
 * updates the user password, and invalidates the token (single-use).
 */
export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'INVALID_JSON', message: 'Invalid JSON payload' }, { status: 400 });
    }

    const { token, password } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'MISSING_TOKEN', message: 'Reset token is required.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'INVALID_PASSWORD', message: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Compute SHA-256 hash of incoming raw token
    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    // Find user by valid, unexpired token hash
    const user = await DataStore.findUserByResetToken(tokenHash);

    if (!user) {
      return NextResponse.json(
        {
          error: 'INVALID_OR_EXPIRED_TOKEN',
          message: 'The password reset link is invalid or has expired. Please request a new one.',
        },
        { status: 400 }
      );
    }

    // Guard against demo account alteration
    if (user.isDemo) {
      return NextResponse.json(
        { error: 'DEMO_USER', message: 'Demo accounts cannot be modified.' },
        { status: 403 }
      );
    }

    // Hash the new password securely
    const hashedPassword = await hashPassword(password);

    // Update password and clear reset token & expiration (single-use guarantee)
    const success = await DataStore.resetUserPassword(user.id, hashedPassword);

    if (!success) {
      return NextResponse.json(
        { error: 'RESET_FAILED', message: 'Failed to reset password. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Your password has been successfully reset. You can now log in with your new password.',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Reset Password Exception]', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: error?.message || 'Server error occurred.' },
      { status: 500 }
    );
  }
}
