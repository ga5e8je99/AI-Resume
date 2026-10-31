import Stripe from 'stripe';
import { getPlanById, getPlanPrice, getPaygCredits, BillingCycle } from '../plans';
import DataStore from '@/app/lib/datastore';

/**
 * Custom error thrown when a payment provider's credentials are missing or unconfigured
 * and mock payments are not explicitly enabled in non-production.
 */
export class ProviderNotConfiguredError extends Error {
  public readonly code = 'PROVIDER_NOT_CONFIGURED';
  public readonly statusCode = 503;
  public readonly provider: string;

  constructor(provider: string, message?: string) {
    super(message || `Payment provider "${provider}" is not configured.`);
    this.name = 'ProviderNotConfiguredError';
    this.provider = provider;
    Object.setPrototypeOf(this, ProviderNotConfiguredError.prototype);
  }
}

/**
 * Mock payments are strictly allowed ONLY when NODE_ENV !== 'production'
 * AND ALLOW_MOCK_PAYMENTS === 'true'.
 */
export function isMockPaymentsAllowed(): boolean {
  const isRealProd =
    process.env.VERCEL_ENV === 'production' ||
    (process.env.NODE_ENV === 'production' && process.env.ALLOW_TEST_MODE_SERVER !== 'true');
  return !isRealProd && process.env.ALLOW_MOCK_PAYMENTS === 'true';
}

/**
 * Checks whether an environment variable value is missing or still set to a template placeholder.
 */
export function isUnconfiguredEnvValue(val?: string | null): boolean {
  if (!val) return true;
  const trimmed = val.trim();
  if (!trimmed) return true;
  if (trimmed.includes('replace_with_')) return true;
  return false;
}

// Lazy-initialized Stripe instance
let stripeInstance: Stripe | null = null;
let cachedStripeKey: string | null = null;

export function getStripeClient(): Stripe | null {
  const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
  if (isUnconfiguredEnvValue(secretKey)) {
    return null;
  }
  if (!stripeInstance || cachedStripeKey !== secretKey) {
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia' as any,
      typescript: true,
    });
    cachedStripeKey = secretKey;
  }
  return stripeInstance;
}

export interface CreateStripeCheckoutParams {
  user: {
    id: string;
    email: string;
    name?: string;
    stripeCustomerId?: string;
  };
  planId: string;
  billingCycle?: BillingCycle;
  successUrl?: string;
  cancelUrl?: string;
}

export interface StripeCheckoutResult {
  url: string;
  provider: 'stripe';
  sessionId: string;
  reference?: string;
}

/**
 * Resolves the Stripe Price ID for Pro subscription from environment variables.
 */
export function getStripeProPriceId(billingCycle: BillingCycle = 'monthly'): string | null {
  const envKey =
    billingCycle === 'annual' ? 'STRIPE_PRICE_PRO_ANNUAL' : 'STRIPE_PRICE_PRO_MONTHLY';
  const rawPriceId = (process.env[envKey] || '').trim();
  if (isUnconfiguredEnvValue(rawPriceId)) {
    return null;
  }
  return rawPriceId;
}

/**
 * Creates a Stripe Checkout Session:
 * - Pro plan: mode = 'subscription' using STRIPE_PRICE_PRO_MONTHLY / STRIPE_PRICE_PRO_ANNUAL
 * - PAYG plan: mode = 'payment' using canonical price & credits from lib/plans.ts
 */
export async function createStripeCheckoutSession({
  user,
  planId,
  billingCycle = 'monthly',
  successUrl,
  cancelUrl,
}: CreateStripeCheckoutParams): Promise<StripeCheckoutResult> {
  const plan = getPlanById(planId);
  if (!plan) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }
  if (plan.id === 'free') {
    throw new Error('Free plan does not require payment checkout.');
  }

  // Strictly read USD price and credits from lib/plans.ts (no hardcoded fallbacks)
  const priceUsd = getPlanPrice(plan.id, 'USD', billingCycle);
  const unitAmountCents = Math.round(priceUsd * 100);
  const stripeOrderRef = `stripe_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const defaultSuccessUrl = `${appUrl}/payment/success?reference=${stripeOrderRef}&session_id={CHECKOUT_SESSION_ID}&provider=stripe`;
  const defaultCancelUrl = `${appUrl}/payment/cancelled?reference=${stripeOrderRef}&provider=stripe`;

  const finalSuccessUrl = successUrl || defaultSuccessUrl;
  const finalCancelUrl = cancelUrl || defaultCancelUrl;

  const stripe = getStripeClient();

  if (!stripe) {
    if (!isMockPaymentsAllowed()) {
      throw new ProviderNotConfiguredError(
        'stripe',
        'Stripe payment provider is not configured (missing STRIPE_SECRET_KEY).'
      );
    }

    const createdOrder = await DataStore.createOrder({
      userId: user.id,
      userEmail: user.email,
      planId: plan.id as 'pro' | 'payg',
      billingCycle: plan.id === 'payg' ? 'once' : billingCycle,
      baseAmount: priceUsd,
      amount: priceUsd,
      currency: 'USD',
      method: 'stripe',
      network: 'stripe',
      reference: stripeOrderRef,
      expiresAt,
      metadata: { mock: true },
    });

    const mockSessionId = `cs_test_mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await DataStore.completeOrder(createdOrder.id, {
      txid: mockSessionId,
      actor: 'mock_stripe',
      note: 'Mock Stripe checkout completed in test mode',
    });

    const mockUrl = `${appUrl}/payment/success?reference=${stripeOrderRef}&session_id=${mockSessionId}&provider=stripe&mock=true&planId=${plan.id}&billingCycle=${billingCycle}`;
    return {
      url: mockUrl,
      provider: 'stripe',
      sessionId: mockSessionId,
      reference: stripeOrderRef,
    };
  }

  const isPro = plan.id === 'pro';
  const sessionMetadata = {
    userId: user.id,
    planId: plan.id,
    billingCycle: isPro ? billingCycle : 'once',
    reference: stripeOrderRef,
  };

  const existingStripeCustomer =
    user.stripeCustomerId && user.stripeCustomerId.startsWith('cus_')
      ? user.stripeCustomerId
      : undefined;

  let session: Stripe.Checkout.Session;

  if (isPro) {
    const proPriceId = getStripeProPriceId(billingCycle);
    if (!proPriceId) {
      const missingVar =
        billingCycle === 'annual' ? 'STRIPE_PRICE_PRO_ANNUAL' : 'STRIPE_PRICE_PRO_MONTHLY';
      throw new ProviderNotConfiguredError(
        'stripe',
        `Stripe subscription price ID (${missingVar}) is not configured.`
      );
    }

    session = await stripe.checkout.sessions.create({
      ...(existingStripeCustomer
        ? { customer: existingStripeCustomer }
        : { customer_email: user.email }),
      client_reference_id: user.id,
      metadata: sessionMetadata,
      subscription_data: {
        metadata: sessionMetadata,
      },
      line_items: [
        {
          price: proPriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
    });
  } else {
    const paygCredits = getPaygCredits();
    const productName = `${plan.name.en} (${paygCredits} AI Credits)`;
    const productDesc = plan.description.en;

    session = await stripe.checkout.sessions.create({
      ...(existingStripeCustomer
        ? { customer: existingStripeCustomer }
        : { customer_email: user.email }),
      client_reference_id: user.id,
      metadata: sessionMetadata,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: unitAmountCents,
            product_data: {
              name: productName,
              description: productDesc,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
    });
  }

  if (!session.url) {
    throw new Error('Stripe failed to return a checkout session URL.');
  }

  await DataStore.createOrder({
    userId: user.id,
    userEmail: user.email,
    planId: plan.id as 'pro' | 'payg',
    billingCycle: plan.id === 'payg' ? 'once' : billingCycle,
    baseAmount: priceUsd,
    amount: priceUsd,
    currency: 'USD',
    method: 'stripe',
    network: 'stripe',
    reference: stripeOrderRef,
    expiresAt,
    metadata: {
      stripeSessionId: session.id,
    },
  });

  return {
    url: session.url,
    provider: 'stripe',
    sessionId: session.id,
    reference: stripeOrderRef,
  };
}

/**
 * Creates a Stripe Customer Billing Portal session for managing active Pro subscriptions.
 */
export async function createStripeBillingPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl?: string;
}): Promise<{ url: string }> {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const finalReturnUrl = returnUrl || `${appUrl}/dashboard?tab=settings`;
  const stripe = getStripeClient();

  if (!stripe) {
    if (!isMockPaymentsAllowed()) {
      throw new ProviderNotConfiguredError(
        'stripe',
        'Stripe Billing Portal is not configured (missing STRIPE_SECRET_KEY).'
      );
    }
    return {
      url: `${finalReturnUrl}${finalReturnUrl.includes('?') ? '&' : '?'}mock_portal=true`,
    };
  }

  if (!customerId || !customerId.trim()) {
    throw new Error('Stripe customer ID is required to open the Billing Portal.');
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId.trim(),
    return_url: finalReturnUrl,
  });

  if (!portalSession.url) {
    throw new Error('Stripe failed to return a Billing Portal URL.');
  }

  return { url: portalSession.url };
}

/**
 * Validates Stripe webhook event signature.
 */
export function verifyStripeWebhookSignature(
  rawBody: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error('Stripe client is not initialized. Missing STRIPE_SECRET_KEY.');
  }
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}
