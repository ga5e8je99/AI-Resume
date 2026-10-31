import { NextRequest, NextResponse } from 'next/server';
import { comparePassword, signToken } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
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

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'user',
    });

    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
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
