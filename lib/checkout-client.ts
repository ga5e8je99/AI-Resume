'use client';

import { Sentry } from './sentry';
import { CurrencyCode, BillingCycle } from './plans';
import { LanguageCode } from '@/app/lib/translations/types';

export type CheckoutErrorCode =
  | 'PROVIDER_NOT_CONFIGURED'
  | 'NETWORK_ERROR'
  | 'UNAUTHENTICATED'
  | 'CHECKOUT_FAILED';

export interface CheckoutOptions {
  currency?: CurrencyCode;
  billingCycle?: BillingCycle;
  method?: 'card' | 'binance' | 'manual_crypto' | 'auto';
  network?: 'BEP20' | 'TRC20';
  language?: LanguageCode;
  /** Optional internal router navigation callback (e.g. router.push) */
  onNavigate?: (path: string) => void;
  /** Whether to automatically redirect on external gateway URLs (default: true) */
  autoRedirect?: boolean;
  /** Optional custom fetch implementation for testing */
  customFetch?: typeof fetch;
}

export interface CheckoutResponse {
  success: boolean;
  status?: number;
  message?: string;
  url?: string;
  loginUrl?: string;
  error?: CheckoutErrorCode | string;
  errorCode?: CheckoutErrorCode;
  canRetry?: boolean;
  provider?: string;
  reference?: string;
  orderId?: string | number;
}

const ERROR_MESSAGES: Record<CheckoutErrorCode, Record<LanguageCode, string>> = {
  PROVIDER_NOT_CONFIGURED: {
    ar: 'الطريقة دي مش متاحة حالياً، جرّب طريقة تانية',
    en: 'This payment method is currently unavailable, please try another method.',
    fr: 'Ce moyen de paiement n’est pas disponible actuellement, veuillez essayer une autre méthode.',
    de: 'Diese Zahlungsmethode ist derzeit nicht verfügbar. Bitte versuchen Sie eine andere Methode.',
    es: 'Este método de pago no está disponible actualmente, por favor prueba con otro método.',
    tr: 'Bu ödeme yöntemi şu anda kullanılamıyor, lütfen başka bir yöntem deneyin.',
  },
  NETWORK_ERROR: {
    ar: 'مشكلة في الاتصال، حاول تاني',
    en: 'Connection problem, please try again.',
    fr: 'Problème de connexion, veuillez réessayer.',
    de: 'Verbindungsproblem, bitte versuchen Sie es erneut.',
    es: 'Problema de conexión, inténtalo de nuevo.',
    tr: 'Bağlantı sorunu, lütfen tekrar deneyin.',
  },
  UNAUTHENTICATED: {
    ar: 'يرجى تسجيل الدخول للمتابعة إلى الدفع.',
    en: 'Please sign in to continue to checkout.',
    fr: 'Veuillez vous connecter pour continuer vers le paiement.',
    de: 'Bitte melden Sie sich an, um mit der Zahlung fortzufahren.',
    es: 'Por favor, inicia sesión para continuar con el pago.',
    tr: 'Ödemeye devam etmek için lütfen giriş yapın.',
  },
  CHECKOUT_FAILED: {
    ar: 'حدث خطأ غير متوقع أثناء بدء الدفع. يرجى المحاولة مرة أخرى.',
    en: 'An unexpected error occurred while starting checkout. Please try again.',
    fr: 'Une erreur inattendue s’est produite lors du paiement. Veuillez réessayer.',
    de: 'Beim Starten des Bezahlvorgangs ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut.',
    es: 'Ocurrió un error inesperado al iniciar el pago. Por favor, inténtalo de nuevo.',
    tr: 'Ödeme başlatılırken beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
  },
};

export function getCheckoutErrorMessage(
  code: CheckoutErrorCode,
  language: LanguageCode = 'ar'
): string {
  const dict = ERROR_MESSAGES[code] || ERROR_MESSAGES.CHECKOUT_FAILED;
  return dict[language] || dict.en;
}

/**
 * Extracts an internal app path (e.g. "/payment/crypto?...") if the URL belongs to the app,
 * or returns null for external gateway URLs (Stripe, Paymob, Binance Pay).
 */
export function toInternalPath(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (typeof window !== 'undefined' && parsed.origin === window.location.origin) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    if (
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1'
    ) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Initiates the checkout flow for a given plan by POSTing to /api/checkout.
 * Distinguishes strictly between:
 * - PROVIDER_NOT_CONFIGURED (503)
 * - NETWORK_ERROR (offline / fetch failure, with retry capability)
 * - UNAUTHENTICATED (401 -> redirects to /login?redirect=%2Fpricing)
 * - Other errors -> generic message + Sentry.captureException
 */
export async function startCheckout(
  planId: string,
  options: CheckoutOptions = {}
): Promise<CheckoutResponse> {
  const currency = options.currency || 'USD';
  const billingCycle = options.billingCycle || 'monthly';
  const method = options.method;
  const network = options.network;
  const lang: LanguageCode = options.language || 'ar';
  const doFetch = options.customFetch || fetch;

  try {
    const res = await doFetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId,
        currency,
        billingCycle,
        method,
        network,
      }),
    });

    const data = await res.json().catch(() => ({}));

    // 1. UNAUTHENTICATED (401) -> redirect to login with return URL to /pricing
    if (
      res.status === 401 ||
      data.error === 'UNAUTHORIZED' ||
      data.error === 'UNAUTHENTICATED'
    ) {
      const loginUrl = `/login?redirect=${encodeURIComponent('/pricing')}`;
      if (options.onNavigate) {
        options.onNavigate(loginUrl);
      }
      return {
        success: false,
        status: 401,
        error: 'UNAUTHENTICATED',
        errorCode: 'UNAUTHENTICATED',
        loginUrl,
        canRetry: false,
        message: getCheckoutErrorMessage('UNAUTHENTICATED', lang),
      };
    }

    // 2. PROVIDER_NOT_CONFIGURED (503) -> method unavailable, try another method
    if (res.status === 503 || data.error === 'PROVIDER_NOT_CONFIGURED') {
      return {
        success: false,
        status: 503,
        error: 'PROVIDER_NOT_CONFIGURED',
        errorCode: 'PROVIDER_NOT_CONFIGURED',
        canRetry: false,
        message: getCheckoutErrorMessage('PROVIDER_NOT_CONFIGURED', lang),
      };
    }

    // 3. Any other non-OK HTTP status -> generic message + Sentry.captureException
    if (!res.ok) {
      const checkoutErr = new Error(
        data.message || data.error || `Checkout failed with status ${res.status}`
      );
      Sentry.captureException(checkoutErr, {
        tags: {
          feature: 'checkout',
          planId,
          currency,
          billingCycle,
          httpStatus: String(res.status),
        },
        extra: {
          error: data.error,
          message: data.message,
          method,
          network,
        },
      });

      return {
        success: false,
        status: res.status,
        error: data.error || 'CHECKOUT_FAILED',
        errorCode: 'CHECKOUT_FAILED',
        canRetry: true,
        message: getCheckoutErrorMessage('CHECKOUT_FAILED', lang),
      };
    }

    // 4. Success
    if (data.url) {
      const internalPath = toInternalPath(data.url);
      if (internalPath && options.onNavigate) {
        options.onNavigate(internalPath);
      } else if (!internalPath && options.autoRedirect !== false && typeof window !== 'undefined') {
        window.location.assign(data.url);
      }

      return {
        success: true,
        status: 200,
        url: data.url,
        provider: data.provider,
        reference: data.reference,
        orderId: data.orderId,
      };
    }

    return {
      success: true,
      status: 200,
      provider: data.provider,
      reference: data.reference,
      orderId: data.orderId,
      message: data.message,
    };
  } catch (err: any) {
    // Network / connection failure -> NETWORK_ERROR + canRetry: true
    return {
      success: false,
      status: 0,
      error: 'NETWORK_ERROR',
      errorCode: 'NETWORK_ERROR',
      canRetry: true,
      message: getCheckoutErrorMessage('NETWORK_ERROR', lang),
    };
  }
}

export default startCheckout;
