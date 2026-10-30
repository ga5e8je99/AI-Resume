'use client';

import { CurrencyCode, BillingCycle } from './plans';

export interface CheckoutOptions {
  currency?: CurrencyCode;
  billingCycle?: BillingCycle;
  method?: 'card' | 'binance' | 'manual_crypto' | 'auto';
  network?: 'BEP20' | 'TRC20';
}

export interface CheckoutResponse {
  success: boolean;
  status?: number;
  message?: string;
  url?: string;
  error?: string;
  comingSoon?: boolean;
}

/**
 * Initiates the checkout flow for a given plan.
 * POSTs to /api/checkout.
 * If the route returns HTTP 501 (Not Implemented) or 404, returns a clear "coming soon" result.
 */
export async function startCheckout(
  planId: string,
  options: CheckoutOptions = {}
): Promise<CheckoutResponse> {
  const currency = options.currency || 'USD';
  const billingCycle = options.billingCycle || 'monthly';
  const method = options.method;
  const network = options.network;

  try {
    const res = await fetch('/api/checkout', {
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

    // 501 Not Implemented or 404 Not Found indicates payment gateway route is coming soon
    if (res.status === 501 || res.status === 404) {
      return {
        success: false,
        status: res.status,
        comingSoon: true,
        message: 'Payment gateway integration is coming soon! Stay tuned for live Stripe & Paymob checkout.',
        error: 'GATEWAY_COMING_SOON',
      };
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        comingSoon: res.status === 501,
        message: data.message || data.error || 'Failed to initialize checkout session.',
        error: data.error || 'CHECKOUT_FAILED',
      };
    }

    // If API provided a direct checkout redirection URL (Stripe Checkout / Paymob iframe)
    if (data.url) {
      window.location.href = data.url;
      return {
        success: true,
        status: 200,
        url: data.url,
        message: 'Redirecting to payment gateway...',
      };
    }

    return {
      success: true,
      status: 200,
      message: data.message || 'Checkout session created successfully.',
    };
  } catch (err: any) {
    // Network errors or offline fallback
    return {
      success: false,
      status: 501,
      comingSoon: true,
      message: 'Payment gateway integration is coming soon! Stay tuned for live Stripe & Paymob checkout.',
      error: err?.message || 'NETWORK_ERROR',
    };
  }
}

export default startCheckout;
