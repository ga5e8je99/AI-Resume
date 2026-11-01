import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import DataStore from '@/app/lib/datastore';
import { sendEmail, getPasswordResetEmailHtml } from '@/lib/email';
import { applyRateLimit, parseBoundedJsonBody } from '@/lib/rate-limit';

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 5;

/**
 * POST /api/auth/forgot-password
 * Initiates password reset flow with enumeration protection, shared rate limiting,
 * cryptographically random tokens, SHA-256 storage, and 15-minute expiry.
 */
export async function POST(req: NextRequest) {
  try {
    const parsed = await parseBoundedJsonBody(req, 16 * 1024);
    if (!parsed.ok) {
      return parsed.errorResponse;
    }
    const body = parsed.data;

    const { email, language = 'en' } = body;
    if (!email || typeof email !== 'string' || email.length > 150) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Shared rate limit per email + per IP with Retry-After headers
    const rateLimit = await applyRateLimit(
      req,
      {
        limit: MAX_REQUESTS_PER_WINDOW,
        ipLimit: MAX_REQUESTS_PER_WINDOW,
        windowMs: RATE_LIMIT_WINDOW_MS,
        keyPrefix: 'forgot_pw',
      },
      cleanEmail
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'RATE_LIMITED',
          message:
            language === 'ar'
              ? 'عدد الطلبات كبير جداً. يرجى الانتظار 15 دقيقة ثم المحاولة مجدداً.'
              : 'Too many password reset requests. Please try again in 15 minutes.',
        },
        {
          status: 429,
          headers: rateLimit.headers,
        }
      );
    }

    const userLang = (
      ['en', 'ar', 'fr', 'de', 'es', 'tr'].includes(language) ? language : 'en'
    ) as 'en' | 'ar' | 'fr' | 'de' | 'es' | 'tr';

    const genericMessages: Record<string, string> = {
      en: 'If an account exists with this email address, a password reset link has been sent.',
      ar: 'إذا كان هذا البريد مسجلاً لدينا، فستصلك رسالة تحتوي على رابط لإعادة تعيين كلمة المرور.',
      fr: 'Si un compte existe avec cette adresse e-mail, un lien de réinitialisation a été envoyé.',
      de: 'Wenn ein Konto mit dieser E-Mail-Adresse existiert, wurde ein Link zum Zurücksetzen des Passworts gesendet.',
      es: 'Si existe una cuenta con este correo electrónico, se ha enviado un enlace para restablecer la contraseña.',
      tr: 'Bu e-posta adresiyle kayıtlı bir hesap varsa, şifre sıfırlama bağlantısı gönderilmiştir.',
    };

    // Always return this generic response to prevent user enumeration
    const genericResponse = {
      success: true,
      message: genericMessages[userLang] || genericMessages.en,
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
