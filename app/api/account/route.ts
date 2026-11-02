import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireAuth, comparePassword, revokeUserSessions } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { cancelUserActiveSubscription } from '@/lib/payments';
import {
  sendEmail,
  getAccountDeletedEmailHtml,
  getAccountDeleteConfirmEmailHtml,
} from '@/lib/email';
import { applyRateLimit, parseBoundedJsonBody } from '@/lib/rate-limit';
import { trackServerSubscriptionCancelled } from '@/lib/analytics';

const deleteEmailTokens = new Map<string, { hash: string; expiresAt: number }>();

function issueAccountDeleteEmailToken(userId: string): string {
  const rawToken = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8-char hex code
  const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
  deleteEmailTokens.set(userId, {
    hash,
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
  });
  return rawToken;
}

function verifyAccountDeleteEmailToken(userId: string, rawToken: string): boolean {
  const entry = deleteEmailTokens.get(userId);
  if (!entry) return false;
  if (entry.expiresAt <= Date.now()) {
    deleteEmailTokens.delete(userId);
    return false;
  }
  const candidateHash = crypto
    .createHash('sha256')
    .update(rawToken.trim().toUpperCase())
    .digest('hex');
  const a = Buffer.from(entry.hash, 'hex');
  const b = Buffer.from(candidateHash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return false;
  }
  deleteEmailTokens.delete(userId);
  return true;
}

const DELETED_EMAIL_SUBJECTS: Record<string, string> = {
  en: 'Your JobMatch AI Account Has Been Deleted',
  ar: 'تأكيد حذف حسابك في JobMatch AI',
  fr: 'Votre compte JobMatch AI a été supprimé',
  de: 'Ihr JobMatch AI-Konto wurde gelöscht',
  es: 'Tu cuenta de JobMatch AI ha sido eliminada',
  tr: 'JobMatch AI Hesabınız Silindi',
};

const DELETE_CODE_SUBJECTS: Record<string, string> = {
  en: 'Confirm Account Deletion - JobMatch AI ⚠️',
  ar: 'رمز تأكيد حذف الحساب - JobMatch AI ⚠️',
  fr: 'Confirmer la suppression du compte - JobMatch AI ⚠️',
  de: 'Kontolöschung bestätigen - JobMatch AI ⚠️',
  es: 'Confirmar eliminación de cuenta - JobMatch AI ⚠️',
  tr: 'Hesap Silme Onayı - JobMatch AI ⚠️',
};

/**
 * POST /api/account
 * Sends an email confirmation code for account deletion (alternative to password re-entry).
 */
export async function POST(req: NextRequest) {
  try {
    const { user: authUser, errorResponse } = requireAuth(req);
    if (!authUser || errorResponse) {
      return (
        errorResponse ||
        NextResponse.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 })
      );
    }

    const rateLimit = await applyRateLimit(
      req,
      { limit: 3, ipLimit: 6, windowMs: 60 * 60 * 1000, keyPrefix: 'account_delete_code' },
      authUser.id
    );
    if (!rateLimit.allowed && rateLimit.errorResponse) {
      return rateLimit.errorResponse;
    }

    const user = await DataStore.findUserById(authUser.id);
    if (!user) {
      return NextResponse.json({ error: 'USER_NOT_FOUND', message: 'Account not found.' }, { status: 404 });
    }
    if (user.isDemo) {
      return NextResponse.json(
        { error: 'DEMO_ACCOUNT', message: 'Demo accounts cannot be deleted.' },
        { status: 403 }
      );
    }

    const parsed = await parseBoundedJsonBody(req, 16 * 1024);
    if (!parsed.ok) {
      return parsed.errorResponse;
    }
    const body: Record<string, any> = parsed.data || {};

    const language = (
      ['en', 'ar', 'fr', 'de', 'es', 'tr'].includes(body.language) ? body.language : 'en'
    ) as 'en' | 'ar' | 'fr' | 'de' | 'es' | 'tr';

    const confirmToken = issueAccountDeleteEmailToken(user.id);

    sendEmail({
      to: user.email,
      subject: DELETE_CODE_SUBJECTS[language] || DELETE_CODE_SUBJECTS.en,
      html: getAccountDeleteConfirmEmailHtml({
        name: user.name,
        confirmToken,
        language,
      }),
      isDemo: false,
    }).catch((err) => {
      console.error('[Account Delete Code] Email send error:', err);
    });

    return NextResponse.json(
      {
        success: true,
        message: 'A confirmation code has been sent to your email address.',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Account Delete Code POST Error]', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Failed to send confirmation code.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/account
 * Permanently deletes the user's account after verifying password (or email confirmation code):
 * 1. Cancels any active subscription at the payment provider (Lemon Squeezy / Stripe / Paymob).
 * 2. Deletes all resumes, cover letters, analyses, and invalidates active sessions.
 * 3. Anonymizes orders and payments (preserves financial records without personal identifiers).
 * 4. Sends post-deletion confirmation email.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { user: authUser, errorResponse } = requireAuth(req);
    if (!authUser || errorResponse) {
      return (
        errorResponse ||
        NextResponse.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 })
      );
    }

    const rateLimit = await applyRateLimit(
      req,
      { limit: 5, ipLimit: 10, windowMs: 15 * 60 * 1000, keyPrefix: 'account_delete' },
      authUser.id
    );
    if (!rateLimit.allowed && rateLimit.errorResponse) {
      return rateLimit.errorResponse;
    }

    const parsed = await parseBoundedJsonBody(req, 16 * 1024);
    if (!parsed.ok) {
      return parsed.errorResponse;
    }
    const body = parsed.data || {};
    const { password, confirmToken, confirmText, language: rawLang } = body;

    const language = (
      ['en', 'ar', 'fr', 'de', 'es', 'tr'].includes(rawLang) ? rawLang : 'en'
    ) as 'en' | 'ar' | 'fr' | 'de' | 'es' | 'tr';

    const user = await DataStore.findUserById(authUser.id);
    if (!user) {
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', message: 'Account not found.' },
        { status: 404 }
      );
    }

    if (user.isDemo) {
      return NextResponse.json(
        { error: 'DEMO_ACCOUNT', message: 'Demo accounts cannot be deleted.' },
        { status: 403 }
      );
    }

    // If confirmText is provided by the double-confirmation UI, enforce exact match 'DELETE'
    if (confirmText !== undefined && String(confirmText).trim().toUpperCase() !== 'DELETE') {
      return NextResponse.json(
        {
          error: 'CONFIRM_TEXT_MISMATCH',
          message: 'Please type DELETE to confirm permanent account deletion.',
        },
        { status: 400 }
      );
    }

    const hasPassword = typeof password === 'string' && password.length > 0;
    const hasConfirmToken = typeof confirmToken === 'string' && confirmToken.trim().length > 0;

    if (!hasPassword && !hasConfirmToken) {
      return NextResponse.json(
        {
          error: 'CONFIRMATION_REQUIRED',
          message:
            'Please re-enter your password or provide the email confirmation code to delete your account.',
        },
        { status: 400 }
      );
    }

    let verifiedIdentity = false;
    const userWithCreds = (user as any).password
      ? user
      : await DataStore.findUserByEmail(user.email);
    const storedPasswordHash = (user as any).password || (userWithCreds as any)?.password;
    if (hasPassword && storedPasswordHash) {
      verifiedIdentity = await comparePassword(password, storedPasswordHash);
    } else if (hasConfirmToken) {
      verifiedIdentity = verifyAccountDeleteEmailToken(user.id, confirmToken);
    }

    if (!verifiedIdentity) {
      return NextResponse.json(
        {
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid password or confirmation code. Account deletion aborted.',
        },
        { status: 401 }
      );
    }

    const userEmailSnapshot = user.email;
    const userNameSnapshot = user.name;

    // 1. Cancel any active subscription at the payment provider
    let subscriptionResult: {
      hadActiveSubscription: boolean;
      canceled: boolean;
      provider?: string;
      subscriptionId?: string;
    } = {
      hadActiveSubscription: false,
      canceled: false,
    };

    try {
      subscriptionResult = await cancelUserActiveSubscription(user as any);
      if (subscriptionResult.hadActiveSubscription && subscriptionResult.canceled) {
        trackServerSubscriptionCancelled({
          userId: user.id,
          plan: 'pro',
          provider: subscriptionResult.provider || (user as any).paymentProvider || 'lemonsqueezy',
          reason: 'account_deleted',
        });
      }
    } catch (subErr) {
      console.error('[Account Delete] Provider subscription cancel error:', subErr);
      // Still mark as attempted and proceed with account deletion & anonymization
      subscriptionResult = {
        hadActiveSubscription: true,
        canceled: false,
        provider: (user as any).paymentProvider || undefined,
      };
    }

    // 2. Delete resumes, cover letters, analyses, user & anonymize orders/payments
    const deletionSummary = await DataStore.deleteAccountAndAnonymizeBilling(user.id);

    // 3. Invalidate all sessions for this user ID + clear auth cookie
    revokeUserSessions(user.id);

    // 4. Send post-deletion confirmation email non-blocking
    sendEmail({
      to: userEmailSnapshot,
      subject: DELETED_EMAIL_SUBJECTS[language] || DELETED_EMAIL_SUBJECTS.en,
      html: getAccountDeletedEmailHtml({
        name: userNameSnapshot,
        language,
      }),
      isDemo: false,
    }).catch((err) => {
      console.error('[Account Delete] Confirmation email send error:', err);
    });

    const response = NextResponse.json(
      {
        success: true,
        message: 'Your account has been permanently deleted and billing records anonymized.',
        subscriptionCanceled: subscriptionResult.canceled,
        hadActiveSubscription: subscriptionResult.hadActiveSubscription,
        deletedCounts: deletionSummary.deletedCounts,
        anonymizedCounts: deletionSummary.anonymizedCounts,
      },
      { status: 200 }
    );

    response.cookies.set('jobmatch_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error: any) {
    console.error('[Account Delete Error]', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: error?.message || 'Failed to delete account.' },
      { status: 500 }
    );
  }
}
