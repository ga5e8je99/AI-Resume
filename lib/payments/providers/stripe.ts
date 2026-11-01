import Stripe from 'stripe';
import { getPlanById, getPaygCredits, BillingCycle } from '../../plans';
import {
  CheckoutOrderInput,
  CheckoutUserInput,
  NormalizedEvent,
  PaymentProvider,
  WebhookSignatureError,
} from './types';
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
  if (trimmed.startsWith('your_')) return true;
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
 * Checks if Stripe is configured in environment variables.
 * Used to determine whether Stripe should be exposed in the UI or available for checkout.
 */
export function isStripeConfigured(
  planId?: 'pro' | 'payg',
  billingCycle: 'monthly' | 'annual' | 'once' = 'monthly'
): boolean {
  const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
  if (isUnconfiguredEnvValue(secretKey)) {
    return false;
  }
  if (planId === 'pro') {
    const cycle: BillingCycle = billingCycle === 'annual' ? 'annual' : 'monthly';
    return Boolean(getStripeProPriceId(cycle));
  }
  return true;
}

/**
 * Validates Stripe webhook event signature using Stripe's official constructEvent.
 */
export function verifyStripeWebhookSignature(
  rawBody: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  if (!secret || isUnconfiguredEnvValue(secret)) {
    throw new ProviderNotConfiguredError(
      'stripe',
      'Stripe webhook secret (STRIPE_WEBHOOK_SECRET) is not configured.'
    );
  }
  if (!signature || typeof signature !== 'string' || !signature.trim()) {
    throw new WebhookSignatureError('Missing Stripe signature header.');
  }

  const client =
    getStripeClient() ||
    new Stripe('sk_test_webhook_signature_verifier', {
      apiVersion: '2025-02-24.acacia' as any,
      typescript: true,
    });

  try {
    return client.webhooks.constructEvent(rawBody, signature.trim(), secret.trim());
  } catch (err: any) {
    throw new WebhookSignatureError(
      err?.message || 'Invalid Stripe webhook signature.'
    );
  }
}

function getHeaderValue(
  headers: Headers | Record<string, string | string[] | undefined>,
  name: string
): string | undefined {
  if (typeof (headers as Headers).get === 'function') {
    return (headers as Headers).get(name) || (headers as Headers).get(name.toLowerCase()) || undefined;
  }
  const record = headers as Record<string, string | string[] | undefined>;
  const target = name.toLowerCase();
  for (const [k, v] of Object.entries(record)) {
    if (k.toLowerCase() === target) {
      return Array.isArray(v) ? v[0] : v;
    }
  }
  return undefined;
}

/**
 * Stripe PaymentProvider implementation behind the unified PaymentProvider interface.
 */
export class StripeProvider implements PaymentProvider {
  public readonly name = 'stripe' as const;

  async createCheckout(
    order: CheckoutOrderInput,
    user: CheckoutUserInput
  ): Promise<{ url: string; externalId?: string }> {
    const plan = getPlanById(order.planId);
    if (!plan || plan.id === 'free') {
      throw new Error(`Invalid checkout plan ID: ${order.planId}`);
    }

    const isPro = plan.id === 'pro';
    const cycle: BillingCycle = order.billingCycle === 'annual' ? 'annual' : 'monthly';
    const stripeOrderRef =
      order.reference || `stripe_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const finalSuccessUrl =
      order.successUrl ||
      `${appUrl}/payment/success?reference=${encodeURIComponent(stripeOrderRef)}&order_id=${encodeURIComponent(order.id)}&session_id={CHECKOUT_SESSION_ID}&provider=stripe`;
    const finalCancelUrl =
      order.cancelUrl ||
      `${appUrl}/payment/cancelled?reference=${encodeURIComponent(stripeOrderRef)}&provider=stripe`;

    const stripe = getStripeClient();

    if (!stripe) {
      if (!isMockPaymentsAllowed()) {
        throw new ProviderNotConfiguredError(
          'stripe',
          'Stripe payment provider is not configured (missing STRIPE_SECRET_KEY).'
        );
      }

      const mockSessionId = `cs_test_mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      if (order.id) {
        await DataStore.completeOrder(order.id, {
          actor: 'mock_stripe',
          note: 'Mock Stripe checkout completed in non-production test mode',
        });
      }

      const mockUrl = `${appUrl}/payment/success?reference=${encodeURIComponent(stripeOrderRef)}&order_id=${encodeURIComponent(order.id)}&session_id=${mockSessionId}&provider=stripe&mock=true`;
      return {
        url: mockUrl,
        externalId: mockSessionId,
      };
    }

    const sessionMetadata: Record<string, string> = {
      orderId: String(order.id),
      reference: String(stripeOrderRef),
      userId: String(user.id),
      planId: String(plan.id),
      billingCycle: isPro ? cycle : 'once',
    };

    const existingStripeCustomer =
      user.stripeCustomerId && user.stripeCustomerId.startsWith('cus_')
        ? user.stripeCustomerId
        : undefined;

    let session: Stripe.Checkout.Session;

    if (isPro) {
      const proPriceId = getStripeProPriceId(cycle);
      if (!proPriceId) {
        const missingVar =
          cycle === 'annual' ? 'STRIPE_PRICE_PRO_ANNUAL' : 'STRIPE_PRICE_PRO_MONTHLY';
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
      const unitAmountCents = Math.round(Number(order.amount) * 100);
      const paygCredits = getPaygCredits();
      const productName = `${plan.name.en} (${paygCredits} AI Credits)`;
      const productDesc = plan.description.en;

      session = await stripe.checkout.sessions.create({
        ...(existingStripeCustomer
          ? { customer: existingStripeCustomer }
          : { customer_email: user.email }),
        client_reference_id: user.id,
        metadata: sessionMetadata,
        payment_intent_data: {
          metadata: sessionMetadata,
        },
        line_items: [
          {
            price_data: {
              currency: (order.currency || 'USD').toLowerCase(),
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

    return {
      url: session.url,
      externalId: session.id,
    };
  }

  async handleWebhook(
    rawBody: string | Buffer,
    headers: Headers | Record<string, string | string[] | undefined>
  ): Promise<NormalizedEvent> {
    const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
    if (!webhookSecret || isUnconfiguredEnvValue(webhookSecret)) {
      throw new ProviderNotConfiguredError(
        'stripe',
        'Stripe webhook secret (STRIPE_WEBHOOK_SECRET) is not configured.'
      );
    }

    const signature = getHeaderValue(headers, 'stripe-signature');
    if (!signature) {
      throw new WebhookSignatureError('Missing stripe-signature header.');
    }

    const event = verifyStripeWebhookSignature(rawBody, signature, webhookSecret);
    const eventId = event.id;
    const eventType = event.type;
    const obj: Record<string, any> = (event.data?.object as Record<string, any>) || {};

    if (eventType === 'checkout.session.completed') {
      const metadata = obj.metadata || {};
      const orderId = metadata.orderId ? String(metadata.orderId) : undefined;
      const orderReference =
        metadata.reference || metadata.orderReference
          ? String(metadata.reference || metadata.orderReference)
          : undefined;
      const userId =
        metadata.userId || obj.client_reference_id
          ? String(metadata.userId || obj.client_reference_id)
          : undefined;

      const rawCents =
        typeof obj.amount_total === 'number'
          ? obj.amount_total
          : typeof obj.amount === 'number'
          ? obj.amount
          : undefined;
      const amountCents = typeof rawCents === 'number' ? Math.round(rawCents) : undefined;
      const amount = typeof amountCents === 'number' ? amountCents / 100 : undefined;
      const currency = obj.currency ? String(obj.currency).toUpperCase() : 'USD';

      const customerId =
        typeof obj.customer === 'string' ? obj.customer : obj.customer?.id || undefined;
      const subscriptionId =
        typeof obj.subscription === 'string'
          ? obj.subscription
          : obj.subscription?.id || undefined;

      return {
        eventId,
        provider: 'stripe',
        eventType,
        action: 'activate_order',
        orderId,
        orderReference,
        userId,
        userEmail: obj.customer_details?.email || obj.customer_email || undefined,
        planId:
          metadata.planId === 'pro' || metadata.planId === 'payg'
            ? metadata.planId
            : obj.mode === 'subscription'
            ? 'pro'
            : 'payg',
        billingCycle:
          metadata.billingCycle === 'annual'
            ? 'annual'
            : metadata.billingCycle === 'monthly'
            ? 'monthly'
            : 'once',
        amount,
        amountCents,
        currency,
        customerId,
        subscriptionId,
        status: obj.payment_status || obj.status || 'paid',
        rawPayload: event as unknown as Record<string, any>,
      };
    }

    if (eventType === 'invoice.paid') {
      const lineItem = obj.lines?.data?.[0] || {};
      const metadata = {
        ...(lineItem.metadata || {}),
        ...(obj.subscription_details?.metadata || {}),
        ...(obj.metadata || {}),
      };
      const customerId =
        typeof obj.customer === 'string' ? obj.customer : obj.customer?.id || undefined;
      const subscriptionId =
        typeof obj.subscription === 'string'
          ? obj.subscription
          : obj.subscription?.id || undefined;
      const recurringInterval = lineItem.price?.recurring?.interval;
      const billingCycle =
        metadata.billingCycle === 'annual' || recurringInterval === 'year'
          ? 'annual'
          : 'monthly';
      const periodEndSec = lineItem.period?.end;
      const renewsAt =
        typeof periodEndSec === 'number' && periodEndSec * 1000 > Date.now()
          ? new Date(periodEndSec * 1000).toISOString()
          : null;

      const rawCents =
        typeof obj.amount_paid === 'number'
          ? obj.amount_paid
          : typeof obj.total === 'number'
          ? obj.total
          : 0;
      const amountCents = Math.round(rawCents);
      const amount = amountCents / 100;
      const currency = obj.currency ? String(obj.currency).toUpperCase() : 'USD';

      return {
        eventId,
        provider: 'stripe',
        eventType,
        action: 'subscription_renewed',
        orderId: metadata.orderId ? String(metadata.orderId) : undefined,
        orderReference: metadata.reference ? String(metadata.reference) : undefined,
        userId: metadata.userId ? String(metadata.userId) : undefined,
        userEmail: obj.customer_email || undefined,
        planId: 'pro',
        billingCycle,
        amount,
        amountCents,
        currency,
        customerId,
        subscriptionId,
        status: 'active',
        renewsAt,
        rawPayload: event as unknown as Record<string, any>,
      };
    }

    if (eventType === 'customer.subscription.deleted') {
      const metadata = obj.metadata || {};
      const subscriptionId = obj.id ? String(obj.id) : undefined;
      const customerId =
        typeof obj.customer === 'string' ? obj.customer : obj.customer?.id || undefined;

      return {
        eventId,
        provider: 'stripe',
        eventType,
        action: 'subscription_expired',
        userId: metadata.userId ? String(metadata.userId) : undefined,
        customerId,
        subscriptionId,
        status: 'canceled',
        rawPayload: event as unknown as Record<string, any>,
      };
    }

    if (eventType === 'invoice.payment_failed') {
      const metadata = {
        ...(obj.subscription_details?.metadata || {}),
        ...(obj.metadata || {}),
        ...(obj.lines?.data?.[0]?.metadata || {}),
      };
      const customerId =
        typeof obj.customer === 'string' ? obj.customer : obj.customer?.id || undefined;
      const subscriptionId =
        typeof obj.subscription === 'string'
          ? obj.subscription
          : obj.subscription?.id || undefined;

      return {
        eventId,
        provider: 'stripe',
        eventType,
        action: 'subscription_updated',
        userId: metadata.userId ? String(metadata.userId) : undefined,
        userEmail: obj.customer_email || undefined,
        customerId,
        subscriptionId,
        status: 'past_due',
        rawPayload: event as unknown as Record<string, any>,
      };
    }

    if (eventType === 'charge.refunded') {
      const metadata = obj.metadata || {};
      const rawCents =
        typeof obj.amount_refunded === 'number'
          ? obj.amount_refunded
          : typeof obj.amount === 'number'
          ? obj.amount
          : undefined;
      const amountCents = typeof rawCents === 'number' ? Math.round(rawCents) : undefined;
      const amount = typeof amountCents === 'number' ? amountCents / 100 : undefined;

      return {
        eventId,
        provider: 'stripe',
        eventType,
        action: 'order_refunded',
        orderId: metadata.orderId ? String(metadata.orderId) : undefined,
        orderReference:
          metadata.reference || metadata.orderReference
            ? String(metadata.reference || metadata.orderReference)
            : undefined,
        userId: metadata.userId ? String(metadata.userId) : undefined,
        amount,
        amountCents,
        currency: obj.currency ? String(obj.currency).toUpperCase() : 'USD',
        customerId:
          typeof obj.customer === 'string' ? obj.customer : obj.customer?.id || undefined,
        status: 'refunded',
        rawPayload: event as unknown as Record<string, any>,
      };
    }

    return {
      eventId,
      provider: 'stripe',
      eventType,
      action: 'ignore',
      rawPayload: event as unknown as Record<string, any>,
    };
  }
}

export const stripeProvider = new StripeProvider();

/**
 * Cancels an active Stripe subscription via stripe.subscriptions.cancel(id).
 * Used when a user permanently deletes their account.
 */
export async function cancelStripeSubscription(
  subscriptionId: string
): Promise<{ canceled: boolean; provider: 'stripe'; subscriptionId: string; mode: 'live' | 'mock' }> {
  const cleanId = (subscriptionId || '').trim();
  if (!cleanId) {
    return { canceled: false, provider: 'stripe', subscriptionId: '', mode: 'mock' };
  }

  const stripe = getStripeClient();
  if (!stripe || cleanId.startsWith('sub_mock_') || cleanId.startsWith('cs_mock_')) {
    return { canceled: true, provider: 'stripe', subscriptionId: cleanId, mode: 'mock' };
  }

  try {
    await stripe.subscriptions.cancel(cleanId);
    return { canceled: true, provider: 'stripe', subscriptionId: cleanId, mode: 'live' };
  } catch (err: any) {
    if (err?.statusCode === 404 || err?.code === 'resource_missing') {
      return { canceled: true, provider: 'stripe', subscriptionId: cleanId, mode: 'live' };
    }
    throw err;
  }
}

