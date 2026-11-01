import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { hashPassword, signToken } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { sendEmail, getWelcomeEmailHtml, getEmailVerificationHtml } from '@/lib/email';
import { applyRateLimit, parseBoundedJsonBody } from '@/lib/rate-limit';

const CURRENT_TERMS_VERSION = '2026-10-31';

const UNIFIED_REGISTER_MESSAGES: Record<string, string> = {
  en: 'If this email is eligible for registration, a verification link has been sent to your inbox. If you already have an account, please sign in.',
  ar: 'إذا كان هذا البريد مؤهلاً للتسجيل، فقد أرسلنا رابط تأكيد إلى صندوق الوارد الخاص بك. إذا كان لديك حساب بالفعل، يرجى تسجيل الدخول.',
  fr: 'Si cet e-mail est éligible à l\'inscription, un lien de vérification a été envoyé dans votre boîte de réception. Si vous avez déjà un compte, veuillez vous connecter.',
  de: 'Wenn diese E-Mail-Adresse für die Registrierung berechtigt ist, wurde ein Bestätigungslink an Ihren Posteingang gesendet. Falls Sie bereits ein Konto haben, melden Sie sich bitte an.',
  es: 'Si este correo es elegible para el registro, se ha enviado un enlace de verificación a tu bandeja de entrada. Si ya tienes una cuenta, inicia sesión.',
  tr: 'Bu e-posta kayıt için uygunsa gelen kutunuza bir doğrulama bağlantısı gönderildi. Zaten bir hesabınız varsa lütfen giriş yapın.',
};

const VERIFY_EMAIL_SUBJECTS: Record<string, string> = {
  en: 'Verify Your Email Address - JobMatch AI ✉️',
  ar: 'تأكيد عنوان بريدك الإلكتروني - JobMatch AI ✉️',
  fr: 'Vérifiez votre adresse e-mail - JobMatch AI ✉️',
  de: 'Bestätigen Sie Ihre E-Mail-Adresse - JobMatch AI ✉️',
  es: 'Verifica tu dirección de correo electrónico - JobMatch AI ✉️',
  tr: 'E-posta Adresinizi Doğrulayın - JobMatch AI ✉️',
};

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

    if (body.termsAccepted === false) {
      return NextResponse.json(
        {
          error: 'You must accept the Terms of Service and Privacy Policy to register.',
          code: 'TERMS_NOT_ACCEPTED',
        },
        { status: 400 }
      );
    }

    const termsAcceptedAt = new Date();
    const termsVersion =
      typeof body.termsVersion === 'string' && body.termsVersion.trim()
        ? body.termsVersion.trim().slice(0, 32)
        : CURRENT_TERMS_VERSION;

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

    const userLang = (
      ['en', 'ar', 'fr', 'de', 'es', 'tr'].includes(body.language) ? body.language : 'en'
    ) as 'en' | 'ar' | 'fr' | 'de' | 'es' | 'tr';
    const unifiedMessage = UNIFIED_REGISTER_MESSAGES[userLang] || UNIFIED_REGISTER_MESSAGES.en;

    const existingUser = await DataStore.findUserByEmail(cleanEmail);
    if (existingUser) {
      // Enumeration protection: never disclose that the email is already registered.
      // If the existing user is still unverified, silently refresh & re-send their verification email.
      if (!existingUser.emailVerified && !existingUser.isDemo) {
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await DataStore.setEmailVerifyToken(existingUser.id, tokenHash, expires);

        sendEmail({
          to: cleanEmail,
          subject: VERIFY_EMAIL_SUBJECTS[userLang] || VERIFY_EMAIL_SUBJECTS.en,
          html: getEmailVerificationHtml({
            name: existingUser.name,
            verifyToken: rawToken,
            language: userLang,
          }),
          isDemo: Boolean(existingUser.isDemo),
        }).catch((err) => {
          console.error('[Register] Re-send verification email error (non-blocking):', err);
        });
      }

      return NextResponse.json(
        {
          success: true,
          requiresVerification: true,
          message: unifiedMessage,
        },
        { status: 200 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const allUsers = await DataStore.getUsers();
    const role = allUsers.length === 0 || cleanEmail === 'admin@jobmatch.ai' ? 'admin' : 'user';

    // Generate cryptographically random 32-byte token, store ONLY its SHA-256 hash, 24h validity
    const rawVerifyToken = crypto.randomBytes(32).toString('hex');
    const verifyTokenHash = crypto.createHash('sha256').update(rawVerifyToken).digest('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const newUser = await DataStore.createUserAccount({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role,
      emailVerified: null,
      emailVerifyTokenHash: verifyTokenHash,
      emailVerifyExpires: verifyExpires,
      termsAcceptedAt,
      termsVersion,
    });

    // Send Email Verification link (/auth/verify-email?token=...) via Resend
    sendEmail({
      to: cleanEmail,
      subject: VERIFY_EMAIL_SUBJECTS[userLang] || VERIFY_EMAIL_SUBJECTS.en,
      html: getEmailVerificationHtml({
        name: newUser.name,
        verifyToken: rawVerifyToken,
        language: userLang,
      }),
      isDemo: Boolean(newUser.isDemo),
    }).catch((err) => {
      console.error('[Register] Verification email send error (non-blocking):', err);
    });

    // Send Welcome email non-blocking (never fail registration if the email fails)
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
        success: true,
        requiresVerification: true,
        message: unifiedMessage,
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          emailVerified: null,
          termsAcceptedAt: newUser.termsAcceptedAt || termsAcceptedAt.toISOString(),
          termsVersion: newUser.termsVersion || termsVersion,
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
