import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import DataStore from '@/app/lib/datastore';
import { sendEmail, getPasswordResetEmailHtml } from '@/lib/email';

// In-memory sliding rate limiter (5 requests per 15 minutes per IP/email)
interface RateLimitEntry {
  timestamps: number[];
}
const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 5;

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier) || { timestamps: [] };

  // Filter timestamps within window
  const activeTimestamps = entry.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (activeTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(identifier, { timestamps: activeTimestamps });
    return true;
  }

  activeTimestamps.push(now);
  rateLimitMap.set(identifier, { timestamps: activeTimestamps });

  // Cleanup old entries if map gets large
  if (rateLimitMap.size > 1000) {
    for (const [key, val] of rateLimitMap.entries()) {
      const valid = val.timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
      if (valid.length === 0) rateLimitMap.delete(key);
    }
  }

  return false;
}

/**
 * POST /api/auth/forgot-password
 * Initiates password reset flow with enumeration protection, rate limiting,
 * cryptographically random tokens, SHA-256 storage, and 15-minute expiry.
 */
export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown-ip';

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { email, language = 'en' } = body;
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check rate limit for IP and email
    if (isRateLimited(`ip:${ip}`) || isRateLimited(`email:${cleanEmail}`)) {
      return NextResponse.json(
        {
          error: 'RATE_LIMITED',
          message:
            language === 'ar'
              ? 'عدد الطلبات كبير جداً. يرجى الانتظار 15 دقيقة ثم المحاولة مجدداً.'
              : 'Too many password reset requests. Please try again in 15 minutes.',
        },
        { status: 429 }
      );
    }

    // Always return this generic response to prevent user enumeration
    const genericResponse = {
      success: true,
      message:
        language === 'ar'
          ? 'إذا كان هذا البريد مسجلاً لدينا، فستصلك رسالة تحتوي على رابط لإعادة تعيين كلمة المرور.'
          : 'If an account exists with this email address, a password reset link has been sent.',
    };

    const user = await DataStore.findUserByEmail(cleanEmail);

    // If user does not exist, return generic message immediately
    if (!user) {
      return NextResponse.json(genericResponse, { status: 200 });
    }

    // Requirement: Skip all emails for demo users
    if (user.isDemo) {
      return NextResponse.json(genericResponse, { status: 200 });
    }

    // Generate cryptographically random 32-byte hex token
    const rawToken = crypto.randomBytes(32).toString('hex');

    // Store only SHA-256 hash in database
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 15-minute expiry
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    // Save hash + expiry to user record
    await DataStore.setResetPasswordToken(user.id, tokenHash, expires);

    // Send transactional email non-blocking (never fail the response)
    const userLang = (['en', 'ar', 'fr', 'de', 'es', 'tr'].includes(language) ? language : 'en') as 'en' | 'ar' | 'fr' | 'de' | 'es' | 'tr';
    const resetSubjects: Record<string, string> = {
      en: 'Reset Your Password - JobMatch AI',
      ar: 'إعادة تعيين كلمة المرور - JobMatch AI',
      fr: 'Réinitialisation de votre mot de passe - JobMatch AI',
      de: 'Passwort zurücksetzen - JobMatch AI',
      es: 'Restablecer su contraseña - JobMatch AI',
      tr: 'Şifrenizi Sıfırlayın - JobMatch AI',
    };

    sendEmail({
      to: cleanEmail,
      subject: resetSubjects[userLang] || resetSubjects.en,
      html: getPasswordResetEmailHtml({
        name: user.name,
        resetToken: rawToken,
        language: userLang,
      }),
      isDemo: false,
    }).catch((err) => {
      console.error('[Forgot Password] Failed to send email:', err);
    });

    return NextResponse.json(genericResponse, { status: 200 });
  } catch (error: any) {
    console.error('[Forgot Password Error]', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
