import { getPlanById, getPlanPrice, BillingCycle } from '../plans';
import DataStore from '@/app/lib/datastore';
import {
  ProviderNotConfiguredError,
  isMockPaymentsAllowed,
  isUnconfiguredEnvValue,
  getStripeClient,
  getStripeProPriceId,
  isStripeConfigured,
  verifyStripeWebhookSignature,
  StripeProvider,
  stripeProvider,
} from './providers/stripe';

export {
  ProviderNotConfiguredError,
  isMockPaymentsAllowed,
  isUnconfiguredEnvValue,
  getStripeClient,
  getStripeProPriceId,
  isStripeConfigured,
  verifyStripeWebhookSignature,
  StripeProvider,
  stripeProvider,
};

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
  orderId: string;
  reference: string;
}

/**
 * Creates a stored Order in DataStore and delegates session creation to stripeProvider.createCheckout().
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

  // Strictly read USD price from lib/plans.ts
  const priceUsd = getPlanPrice(plan.id, 'USD', billingCycle);
  const stripeOrderRef = `stripe_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  const storedOrder = await DataStore.createOrder({
    userId: user.id,
    userEmail: user.email,
    planId: plan.id as 'pro' | 'payg',
    billingCycle: plan.id === 'payg' ? 'once' : billingCycle,
    baseAmount: priceUsd,
    amount: priceUsd,
    currency: 'USD',
    method: 'stripe',
    reference: stripeOrderRef,
    expiresAt,
  });

  const session = await stripeProvider.createCheckout(
    {
      id: storedOrder.id,
      reference: storedOrder.reference,
      planId: storedOrder.planId,
      billingCycle: storedOrder.billingCycle,
      amount: storedOrder.amount,
      currency: 'USD',
      successUrl,
      cancelUrl,
    },
    user
  );

  return {
    url: session.url,
    provider: 'stripe',
    sessionId: session.externalId || stripeOrderRef,
    orderId: storedOrder.id,
    reference: storedOrder.reference,
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
