import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAuthenticatedUser } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { sendEmail, getEmailVerificationHtml } from '@/lib/email';
import { applyRateLimit, parseBoundedJsonBody } from '@/lib/rate-limit';

const RESEND_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_RESENDS_PER_HOUR = 3; // 3 requests per hour

const VERIFY_EMAIL_SUBJECTS: Record<string, string> = {
  en: 'Verify Your Email Address - JobMatch AI ✉️',
  ar: 'تأكيد عنوان بريدك الإلكتروني - JobMatch AI ✉️',
  fr: 'Vérifiez votre adresse e-mail - JobMatch AI ✉️',
  de: 'Bestätigen Sie Ihre E-Mail-Adresse - JobMatch AI ✉️',
  es: 'Verifica tu dirección de correo electrónico - JobMatch AI ✉️',
  tr: 'E-posta Adresinizi Doğrulayın - JobMatch AI ✉️',
};

const GENERIC_RESEND_MESSAGES: Record<string, string> = {
  en: 'If an unverified account exists for this email address, a new verification link has been sent.',
  ar: 'إذا كان هناك حساب غير مؤكد مرتبط بهذا البريد الإلكتروني، فقد تم إرسال رابط تأكيد جديد.',
  fr: 'Si un compte non vérifié existe pour cette adresse e-mail, un nouveau lien de vérification a été envoyé.',
  de: 'Wenn ein unbestätigtes Konto für diese E-Mail-Adresse existiert, wurde ein neuer Bestätigungslink gesendet.',
  es: 'Si existe una cuenta no verificada para este correo electrónico, se ha enviado un nuevo enlace de verificación.',
  tr: 'Bu e-posta adresi için doğrulanmamış bir hesap varsa yeni bir doğrulama bağlantısı gönderildi.',
};

/**
 * POST /api/auth/resend-verification
 * Rate limited to 3 requests per hour.
 * Generates a fresh 32-byte random token, stores only its SHA-256 hash with 24h expiry,
 * and sends a verification email via Resend.
 */
export async function POST(req: NextRequest) {
  try {
    let body: Record<string, any> = {};
    try {
      const text = await req.text();
      if (text && text.trim()) {
        body = JSON.parse(text);
      }
    } catch {
      body = {};
    }

    const language = (
      ['en', 'ar', 'fr', 'de', 'es', 'tr'].includes(body.language) ? body.language : 'en'
    ) as 'en' | 'ar' | 'fr' | 'de' | 'es' | 'tr';

    const authUser = getAuthenticatedUser(req);
    const requestedEmail =
      typeof body.email === 'string' && body.email.trim()
        ? body.email.toLowerCase().trim().slice(0, 150)
        : authUser?.email?.toLowerCase().trim();

    if (!authUser && !requestedEmail) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Please sign in or provide your email address to resend verification.',
        },
        { status: 401 }
      );
    }

    const rateKey = authUser?.userId || requestedEmail || 'anon';

    // Strict 3/hour rate limit per user/email (and 6/hour per IP)
    const rateLimit = await applyRateLimit(
      req,
      {
        limit: MAX_RESENDS_PER_HOUR,
        ipLimit: MAX_RESENDS_PER_HOUR * 2,
        windowMs: RESEND_WINDOW_MS,
        keyPrefix: 'auth_resend_verify',
      },
      rateKey
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'RATE_LIMITED',
          message:
            language === 'ar'
              ? 'لقد تجاوزت الحد المسموح (3 مرات في الساعة). يرجى المحاولة لاحقاً.'
              : 'Too many verification emails requested (limit: 3 per hour). Please try again later.',
        },
        {
          status: 429,
          headers: rateLimit.headers,
        }
      );
    }

    const genericResponse = {
      success: true,
      message: GENERIC_RESEND_MESSAGES[language] || GENERIC_RESEND_MESSAGES.en,
    };

    const user = authUser?.userId
      ? await DataStore.findUserById(authUser.userId)
      : requestedEmail
        ? await DataStore.findUserByEmail(requestedEmail)
        : null;

    if (!user || user.isDemo) {
      return NextResponse.json(genericResponse, { status: 200 });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        {
          ...genericResponse,
          alreadyVerified: true,
        },
        { status: 200 }
      );
    }

    // Generate cryptographically random 32-byte token, store ONLY SHA-256 hash, 24h expiry
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await DataStore.setEmailVerifyToken(user.id, tokenHash, expires);

    sendEmail({
      to: user.email,
      subject: VERIFY_EMAIL_SUBJECTS[language] || VERIFY_EMAIL_SUBJECTS.en,
      html: getEmailVerificationHtml({
        name: user.name,
        verifyToken: rawToken,
        language,
      }),
      isDemo: Boolean(user.isDemo),
    }).catch((err) => {
      console.error('[Resend Verification] Email send error:', err);
    });

    return NextResponse.json(genericResponse, { status: 200 });
  } catch (error: any) {
    console.error('[Resend Verification Error]', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}

