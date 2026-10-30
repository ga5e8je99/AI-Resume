import Stripe from 'stripe';
import { getPlanById, BillingCycle } from '../plans';

// Lazy-initialized Stripe instance
let stripeInstance: Stripe | null = null;

export function getStripeClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia' as any,
      typescript: true,
    });
  }
  return stripeInstance;
}

export interface CreateStripeCheckoutParams {
  user: {
    id: string;
    email: string;
    name?: string;
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
}

/**
 * Creates a Stripe Checkout Session for Pro subscription or Pay-As-You-Go credits.
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

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const defaultSuccessUrl = `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&provider=stripe`;
  const defaultCancelUrl = `${appUrl}/payment/cancelled?provider=stripe`;

  const finalSuccessUrl = successUrl || defaultSuccessUrl;
  const finalCancelUrl = cancelUrl || defaultCancelUrl;

  const stripe = getStripeClient();

  // If Stripe secret key is not set (e.g. local preview/mock testing without live Stripe credentials)
  if (!stripe) {
    const mockSessionId = `cs_test_mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const mockUrl = `${appUrl}/payment/success?session_id=${mockSessionId}&provider=stripe&mock=true&planId=${planId}&billingCycle=${billingCycle}`;
    return {
      url: mockUrl,
      provider: 'stripe',
      sessionId: mockSessionId,
    };
  }

  // Build line items from server-side config in lib/plans.ts
  const isPro = plan.id === 'pro';
  const isPayg = plan.id === 'payg';

  let unitAmountCents = 0;
  let productName = plan.name.en;
  let productDesc = plan.description.en;

  if (isPro) {
    if (billingCycle === 'annual') {
      const annualTotal = plan.pricing.USD.annualTotal || 84;
      unitAmountCents = annualTotal * 100;
      productName = `${plan.name.en} (Annual Plan)`;
      productDesc = `Unlimited AI generations, all templates & priority support (1 Year)`;
    } else {
      const monthlyPrice = plan.pricing.USD.monthly || 9;
      unitAmountCents = monthlyPrice * 100;
      productName = `${plan.name.en} (Monthly Plan)`;
      productDesc = `Unlimited AI generations, all templates & priority support (Monthly)`;
    }
  } else if (isPayg) {
    const oneTimePrice = plan.pricing.USD.oneTime || 3;
    unitAmountCents = oneTimePrice * 100;
    productName = `${plan.name.en} (15 AI Credits)`;
    productDesc = `15 credits for ATS-tailored cover letters and resume enhancements. Never expires.`;
  }

  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    client_reference_id: user.id,
    metadata: {
      userId: user.id,
      planId: plan.id,
      billingCycle,
    },
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
    mode: 'payment', // using payment mode for simplified webhook handling
    success_url: finalSuccessUrl,
    cancel_url: finalCancelUrl,
  });

  if (!session.url) {
    throw new Error('Stripe failed to return a checkout session URL.');
  }

  return {
    url: session.url,
    provider: 'stripe',
    sessionId: session.id,
  };
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
