import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, signToken } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { sendEmail, getWelcomeEmailHtml } from '@/lib/email';
import { applyRateLimit, parseBoundedJsonBody } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ipLimit = await applyRateLimit(
      req,
      { limit: 20, ipLimit: 20, windowMs: 60 * 1000, keyPrefix: 'auth_register_ip' }
    );
    if (!ipLimit.allowed && ipLimit.errorResponse) {
      return ipLimit.errorResponse;
    }

    const parsed = await parseBoundedJsonBody(req, 16 * 1024);
    if (!parsed.ok) {
      return parsed.errorResponse;
    }
    const body = parsed.data;
    const { name, email, password } = body;

    if (
      !name ||
      !email ||
      !password ||
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Please provide full name, email, and password.' },
        { status: 400 }
      );
    }

    if (password.length < 6 || password.length > 128) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim().slice(0, 150);

    // Per-email + per-IP rate limiting (with Retry-After header on 429)
    const rateLimit = await applyRateLimit(
      req,
      { limit: 10, ipLimit: 20, windowMs: 60 * 1000, keyPrefix: 'auth_register' },
      cleanEmail
    );
    if (!rateLimit.allowed && rateLimit.errorResponse) {
      return rateLimit.errorResponse;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }
    const existingUser = await DataStore.findUserByEmail(cleanEmail);
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in.' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const allUsers = await DataStore.getUsers();
    const role = allUsers.length === 0 || cleanEmail === 'admin@jobmatch.ai' ? 'admin' : 'user';

    const newUser = await DataStore.createUserAccount({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role,
    });

    // Send Welcome email non-blocking (never fail registration if the email fails)
    const userLang = (['en', 'ar', 'fr', 'de', 'es', 'tr'].includes(body.language) ? body.language : 'en') as 'en' | 'ar' | 'fr' | 'de' | 'es' | 'tr';
    const welcomeSubjects: Record<string, string> = {
      en: 'Welcome to JobMatch AI 👋',
      ar: 'أهلاً بك في JobMatch AI 👋',
      fr: 'Bienvenue sur JobMatch AI 👋',
      de: 'Willkommen bei JobMatch AI 👋',
      es: '¡Bienvenido a JobMatch AI! 👋',
      tr: "JobMatch AI'a Hoş Geldiniz 👋",
    };

    sendEmail({
      to: cleanEmail,
      subject: welcomeSubjects[userLang] || welcomeSubjects.en,
      html: getWelcomeEmailHtml({
        name: newUser.name,
        language: userLang,
      }),
      isDemo: Boolean(newUser.isDemo),
    }).catch((err) => {
      console.error('[Register] Welcome email send error (non-blocking):', err);
    });

    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    });

    const response = NextResponse.json(
      {
        message: 'Account created successfully',
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );

    // Set secure HTTP-only cookie
    response.cookies.set('jobmatch_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
