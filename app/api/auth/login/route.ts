import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { comparePassword, signToken } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { sendEmail, getEmailVerificationHtml } from '@/lib/email';
import { applyRateLimit, parseBoundedJsonBody } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ipLimit = await applyRateLimit(
      req,
      { limit: 30, ipLimit: 30, windowMs: 60 * 1000, keyPrefix: 'auth_login_ip' }
    );
    if (!ipLimit.allowed && ipLimit.errorResponse) {
      return ipLimit.errorResponse;
    }

    const parsed = await parseBoundedJsonBody(req, 16 * 1024);
    if (!parsed.ok) {
      return parsed.errorResponse;
    }
    const body = parsed.data;
    const { email, password } = body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Please enter both email and password.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim().slice(0, 150);

    // Per-account + per-IP rate limiting (with Retry-After header on 429)
    const rateLimit = await applyRateLimit(
      req,
      { limit: 15, ipLimit: 30, windowMs: 60 * 1000, keyPrefix: 'auth_login' },
      cleanEmail
    );
    if (!rateLimit.allowed && rateLimit.errorResponse) {
      return rateLimit.errorResponse;
    }

    const user = await DataStore.findUserByEmail(cleanEmail);
    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // If an unverified user logs in and does not have an active verification token,
    // automatically generate a 24h verification token (SHA-256 hash stored) and send the verification email.
    if (!user.emailVerified && !user.isDemo && user.role !== 'admin') {
      const hasValidToken =
        Boolean(user.emailVerifyTokenHash) &&
        Boolean(user.emailVerifyExpires) &&
        new Date(user.emailVerifyExpires as string).getTime() > Date.now();

      if (!hasValidToken) {
        const rawVerifyToken = crypto.randomBytes(32).toString('hex');
        const verifyTokenHash = crypto.createHash('sha256').update(rawVerifyToken).digest('hex');
        const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await DataStore.setEmailVerifyToken(user.id, verifyTokenHash, verifyExpires);

        const userLang = (
          ['en', 'ar', 'fr', 'de', 'es', 'tr'].includes(body.language) ? body.language : 'en'
        ) as 'en' | 'ar' | 'fr' | 'de' | 'es' | 'tr';

        sendEmail({
          to: user.email,
          subject: 'Verify Your Email Address - JobMatch AI ✉️',
          html: getEmailVerificationHtml({
            name: user.name,
            verifyToken: rawVerifyToken,
            language: userLang,
          }),
          isDemo: Boolean(user.isDemo),
        }).catch((err) => {
          console.error('[Login] Verification email send error (non-blocking):', err);
        });
      }
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'user',
    });

    const response = NextResponse.json({
      message: 'Login successful',
      requiresVerification: !user.emailVerified && !user.isDemo && user.role !== 'admin',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        emailVerified: user.emailVerified || null,
      },
    });

    response.cookies.set('jobmatch_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
