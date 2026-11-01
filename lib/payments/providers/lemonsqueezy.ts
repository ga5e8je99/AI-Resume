import crypto from 'crypto';
import DataStore from '@/app/lib/datastore';
import {
  ProviderNotConfiguredError,
  isMockPaymentsAllowed,
  isUnconfiguredEnvValue,
} from '../stripe';
import {
  PaymentProvider,
  CheckoutOrderInput,
  CheckoutUserInput,
  NormalizedEvent,
  NormalizedEventAction,
  WebhookSignatureError,
} from './types';

export const LEMONSQUEEZY_API_BASE = 'https://api.lemonsqueezy.com/v1';

export type LemonSqueezyEventName =
  | 'order_created'
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_payment_success'
  | 'subscription_cancelled'
  | 'subscription_expired'
  | 'order_refunded';

/**
 * Resolves the Lemon Squeezy Variant ID for the requested plan and billing cycle.
 */
export function getLemonSqueezyVariantId(
  planId: 'pro' | 'payg',
  billingCycle: 'monthly' | 'annual' | 'once' = 'monthly'
): { variantId: string | null; envKey: string } {
  const envKey =
    planId === 'payg'
      ? 'LEMONSQUEEZY_VARIANT_PAYG'
      : billingCycle === 'annual'
      ? 'LEMONSQUEEZY_VARIANT_PRO_ANNUAL'
      : 'LEMONSQUEEZY_VARIANT_PRO_MONTHLY';

  const rawVal = (process.env[envKey] || '').trim();
  if (isUnconfiguredEnvValue(rawVal)) {
    return { variantId: null, envKey };
  }
  return { variantId: rawVal, envKey };
}

/**
 * Checks whether Lemon Squeezy credentials & variant IDs are configured in environment.
 */
export function isLemonSqueezyConfigured(
  planId?: 'pro' | 'payg',
  billingCycle: 'monthly' | 'annual' | 'once' = 'monthly'
): boolean {
  const apiKey = (process.env.LEMONSQUEEZY_API_KEY || '').trim();
  const storeId = (process.env.LEMONSQUEEZY_STORE_ID || '').trim();

  if (isUnconfiguredEnvValue(apiKey) || isUnconfiguredEnvValue(storeId)) {
    return false;
  }

  if (planId) {
    const { variantId } = getLemonSqueezyVariantId(planId, billingCycle);
    return Boolean(variantId);
  }

  // General configuration check: API key, Store ID, and at least one variant ID configured
  const proMonthly = (process.env.LEMONSQUEEZY_VARIANT_PRO_MONTHLY || '').trim();
  const proAnnual = (process.env.LEMONSQUEEZY_VARIANT_PRO_ANNUAL || '').trim();
  const payg = (process.env.LEMONSQUEEZY_VARIANT_PAYG || '').trim();

  return (
    !isUnconfiguredEnvValue(proMonthly) ||
    !isUnconfiguredEnvValue(proAnnual) ||
    !isUnconfiguredEnvValue(payg)
  );
}

/**
 * Verifies Lemon Squeezy X-Signature header using HMAC-SHA256(rawBody, secret)
 * and crypto.timingSafeEqual on the raw body.
 */
export function verifyLemonSqueezySignature(
  rawBody: string | Buffer,
  signature: string | null | undefined,
  secret?: string
): boolean {
  const webhookSecret = (secret ?? process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? '').trim();
  if (
    !webhookSecret ||
    isUnconfiguredEnvValue(webhookSecret) ||
    !signature ||
    typeof signature !== 'string'
  ) {
    return false;
  }

  const normalizedSig = signature.trim();
  if (!/^[0-9a-fA-F]{64}$/.test(normalizedSig)) {
    return false;
  }

  const rawBuffer =
    typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : Buffer.from(rawBody);

  const expectedHex = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBuffer)
    .digest('hex');

  try {
    const expectedBuf = Buffer.from(expectedHex, 'hex');
    const receivedBuf = Buffer.from(normalizedSig, 'hex');
    if (expectedBuf.length === 0 || expectedBuf.length !== receivedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}

function getHeaderValue(
  headers: Headers | Record<string, string | string[] | undefined>,
  name: string
): string | undefined {
  if (!headers) return undefined;
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

export class LemonSqueezyProvider implements PaymentProvider {
  public readonly name = 'lemonsqueezy' as const;

  public isConfigured(
    planId?: 'pro' | 'payg',
    billingCycle?: 'monthly' | 'annual' | 'once'
  ): boolean {
    return isLemonSqueezyConfigured(planId, billingCycle);
  }

  /**
   * Creates a Lemon Squeezy checkout via POST /v1/checkouts
   * Sends custom_data: { orderId, userId } in the checkout payload (never in query).
   */
  public async createCheckout(
    order: CheckoutOrderInput,
    user: CheckoutUserInput
  ): Promise<{ url: string; externalId?: string }> {
    const apiKey = (process.env.LEMONSQUEEZY_API_KEY || '').trim();
    const storeId = (process.env.LEMONSQUEEZY_STORE_ID || '').trim();
    const { variantId, envKey } = getLemonSqueezyVariantId(
      order.planId,
      order.billingCycle
    );

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const reference = order.reference || order.id;
    const redirectUrl =
      order.successUrl ||
      `${appUrl}/payment/success?reference=${encodeURIComponent(reference)}&provider=lemonsqueezy`;

    if (
      isUnconfiguredEnvValue(apiKey) ||
      isUnconfiguredEnvValue(storeId) ||
      !variantId
    ) {
      if (!isMockPaymentsAllowed()) {
        throw new ProviderNotConfiguredError(
          'lemonsqueezy',
          `Lemon Squeezy payment provider is not configured (missing LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID, or ${envKey}).`
        );
      }

      // Mock mode allowed ONLY when ALLOW_MOCK_PAYMENTS=true outside production
      await DataStore.completeOrder(order.id, {
        actor: 'mock_lemonsqueezy',
        note: 'Mock Lemon Squeezy checkout completed in non-production test mode',
        provider: 'lemonsqueezy',
      });

      const mockUrl = `${appUrl}/payment/success?reference=${encodeURIComponent(reference)}&provider=lemonsqueezy&mock=true`;
      return {
        url: mockUrl,
        externalId: `ls_mock_${order.id}`,
      };
    }

    const requestBody = {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: user.email,
            ...(user.name ? { name: user.name } : {}),
            custom: {
              orderId: String(order.id),
              userId: String(user.id),
            },
          },
          product_options: {
            redirect_url: redirectUrl,
          },
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: String(storeId),
            },
          },
          variant: {
            data: {
              type: 'variants',
              id: String(variantId),
            },
          },
        },
      },
    };

    const res = await fetch(`${LEMONSQUEEZY_API_BASE}/checkouts`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(
        `Lemon Squeezy checkout creation failed (HTTP ${res.status}): ${errText.slice(0, 200)}`
      );
    }

    const json = await res.json();
    const checkoutUrl = json?.data?.attributes?.url;
    const checkoutId = json?.data?.id ? String(json.data.id) : undefined;

    if (!checkoutUrl || typeof checkoutUrl !== 'string') {
      throw new Error('Lemon Squeezy response did not include a valid checkout URL.');
    }

    return {
      url: checkoutUrl,
      externalId: checkoutId,
    };
  }

  /**
   * Verifies X-Signature (HMAC-SHA256 with timingSafeEqual on rawBody)
   * and normalizes Lemon Squeezy webhook events:
   * - order_created (PAYG)
   * - subscription_created
   * - subscription_updated
   * - subscription_payment_success (renewal)
   * - subscription_cancelled
   * - subscription_expired
   * - order_refunded
   */
  public async handleWebhook(
    rawBody: string | Buffer,
    headers: Headers | Record<string, string | string[] | undefined>
  ): Promise<NormalizedEvent> {
    const signature = getHeaderValue(headers, 'x-signature');
    const secret = (process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '').trim();

    if (!verifyLemonSqueezySignature(rawBody, signature, secret)) {
      throw new WebhookSignatureError('Invalid or missing Lemon Squeezy X-Signature.');
    }

    const rawText = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    let payload: Record<string, any>;
    try {
      payload = JSON.parse(rawText);
    } catch {
      throw new Error('Invalid JSON payload in Lemon Squeezy webhook.');
    }

    const meta = payload.meta || {};
    const data = payload.data || {};
    const attributes = data.attributes || {};
    const customData =
      meta.custom_data ||
      payload.custom_data ||
      attributes.custom_data ||
      {};

    const eventType = String(
      meta.event_name ||
        getHeaderValue(headers, 'x-event-name') ||
        payload.event_name ||
        payload.type ||
        ''
    ).trim();

    const orderId = customData.orderId || customData.order_id
      ? String(customData.orderId || customData.order_id).trim()
      : undefined;
    const orderReference = customData.reference
      ? String(customData.reference).trim()
      : undefined;
    const userId = customData.userId || customData.user_id
      ? String(customData.userId || customData.user_id).trim()
      : undefined;

    const resourceId = data.id ? String(data.id).trim() : '';
    const explicitWebhookId = meta.webhook_id || payload.eventId || payload.webhook_id;
    const eventId = explicitWebhookId
      ? String(explicitWebhookId).trim()
      : `ls_${eventType}_${resourceId || orderId || 'evt'}`;

    // Parse amount & currency from Lemon Squeezy attributes
    // In Lemon Squeezy, attributes.total / subtotal / amount_cents are in cents (e.g. 500 = $5.00)
    let amountCents: number | undefined;
    let amount: number | undefined;

    if (typeof attributes.total === 'number' && Number.isFinite(attributes.total)) {
      amountCents = Math.round(attributes.total);
      amount = amountCents / 100;
    } else if (
      typeof attributes.amount_cents === 'number' &&
      Number.isFinite(attributes.amount_cents)
    ) {
      amountCents = Math.round(attributes.amount_cents);
      amount = amountCents / 100;
    } else if (
      typeof attributes.subtotal === 'number' &&
      Number.isFinite(attributes.subtotal)
    ) {
      amountCents = Math.round(attributes.subtotal);
      amount = amountCents / 100;
    } else if (
      typeof attributes.first_order_item?.price === 'number' &&
      Number.isFinite(attributes.first_order_item.price)
    ) {
      amountCents = Math.round(attributes.first_order_item.price);
      amount = amountCents / 100;
    } else if (
      typeof attributes.amount === 'number' &&
      Number.isFinite(attributes.amount)
    ) {
      amount = attributes.amount;
      amountCents = Math.round(attributes.amount * 100);
    }

    const currency = attributes.currency
      ? String(attributes.currency).trim().toUpperCase()
      : undefined;

    const customerId =
      attributes.customer_id !== undefined && attributes.customer_id !== null
        ? String(attributes.customer_id)
        : undefined;

    let subscriptionId: string | undefined;
    if (
      eventType.startsWith('subscription_') &&
      eventType !== 'subscription_payment_success' &&
      resourceId
    ) {
      subscriptionId = resourceId;
    } else if (
      attributes.subscription_id !== undefined &&
      attributes.subscription_id !== null
    ) {
      subscriptionId = String(attributes.subscription_id);
    } else if (
      attributes.first_order_item?.subscription_id !== undefined &&
      attributes.first_order_item?.subscription_id !== null
    ) {
      subscriptionId = String(attributes.first_order_item.subscription_id);
    } else if (eventType === 'subscription_payment_success' && resourceId) {
      subscriptionId = resourceId;
    }

    const customerPortalUrl =
      attributes.urls?.customer_portal ||
      attributes.urls?.update_payment_method ||
      null;

    const renewsAt = attributes.renews_at ? String(attributes.renews_at) : null;
    const endsAt = attributes.ends_at ? String(attributes.ends_at) : null;
    const userEmail = attributes.user_email
      ? String(attributes.user_email).trim().toLowerCase()
      : undefined;

    let action: NormalizedEventAction = 'ignore';
    switch (eventType) {
      case 'order_created':
      case 'subscription_created':
        action = 'activate_order';
        break;
      case 'subscription_updated':
        action = 'subscription_updated';
        break;
      case 'subscription_payment_success':
        action = 'subscription_renewed';
        break;
      case 'subscription_cancelled':
        action = 'subscription_cancelled';
        break;
      case 'subscription_expired':
        action = 'subscription_expired';
        break;
      case 'order_refunded':
        action = 'order_refunded';
        break;
      default:
        action = 'ignore';
        break;
    }

    return {
      eventId,
      provider: 'lemonsqueezy',
      eventType,
      action,
      orderId,
      orderReference,
      userId,
      userEmail,
      amount,
      amountCents,
      currency,
      customerId,
      subscriptionId,
      status: attributes.status ? String(attributes.status) : undefined,
      renewsAt,
      endsAt,
      customerPortalUrl,
      rawPayload: payload,
    };
  }
}

/**
 * Fetches the signed Lemon Squeezy Customer Portal URL from the Lemon Squeezy API
 * using either the user's lemonSubscriptionId or lemonCustomerId.
 */
export async function getLemonSqueezyCustomerPortalUrl({
  subscriptionId,
  customerId,
  returnUrl,
}: {
  subscriptionId?: string;
  customerId?: string;
  returnUrl?: string;
}): Promise<{ url: string }> {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const finalReturnUrl = returnUrl || `${appUrl}/dashboard?tab=settings`;

  const apiKey = (process.env.LEMONSQUEEZY_API_KEY || '').trim();
  if (isUnconfiguredEnvValue(apiKey)) {
    if (!isMockPaymentsAllowed()) {
      throw new ProviderNotConfiguredError(
        'lemonsqueezy',
        'Lemon Squeezy Billing Portal is not configured (missing LEMONSQUEEZY_API_KEY).'
      );
    }
    return {
      url: `${finalReturnUrl}${finalReturnUrl.includes('?') ? '&' : '?'}mock_portal=true&provider=lemonsqueezy`,
    };
  }

  const headers = {
    Accept: 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
    Authorization: `Bearer ${apiKey}`,
  };

  if (subscriptionId && subscriptionId.trim()) {
    const subRes = await fetch(
      `${LEMONSQUEEZY_API_BASE}/subscriptions/${encodeURIComponent(subscriptionId.trim())}`,
      { method: 'GET', headers }
    );
    if (subRes.ok) {
      const subJson = await subRes.json().catch(() => null);
      const portalUrl = subJson?.data?.attributes?.urls?.customer_portal;
      if (portalUrl && typeof portalUrl === 'string') {
        return { url: portalUrl };
      }
    }
  }

  if (customerId && customerId.trim()) {
    const custRes = await fetch(
      `${LEMONSQUEEZY_API_BASE}/customers/${encodeURIComponent(customerId.trim())}`,
      { method: 'GET', headers }
    );
    if (custRes.ok) {
      const custJson = await custRes.json().catch(() => null);
      const portalUrl = custJson?.data?.attributes?.urls?.customer_portal;
      if (portalUrl && typeof portalUrl === 'string') {
        return { url: portalUrl };
      }
    }
  }

  throw new Error('Failed to retrieve Lemon Squeezy Customer Portal URL.');
}

/**
 * Cancels an active Lemon Squeezy subscription via DELETE /v1/subscriptions/{id}.
 * Used when a user permanently deletes their account.
 */
export async function cancelLemonSqueezySubscription(
  subscriptionId: string
): Promise<{ canceled: boolean; provider: 'lemonsqueezy'; subscriptionId: string; mode: 'live' | 'mock' }> {
  const cleanId = (subscriptionId || '').trim();
  if (!cleanId) {
    return { canceled: false, provider: 'lemonsqueezy', subscriptionId: '', mode: 'mock' };
  }

  const apiKey = (process.env.LEMONSQUEEZY_API_KEY || '').trim();
  if (isUnconfiguredEnvValue(apiKey) || cleanId.startsWith('ls_mock_') || cleanId.startsWith('sub_mock_')) {
    return { canceled: true, provider: 'lemonsqueezy', subscriptionId: cleanId, mode: 'mock' };
  }

  const res = await fetch(`${LEMONSQUEEZY_API_BASE}/subscriptions/${encodeURIComponent(cleanId)}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!res.ok && res.status !== 404 && res.status !== 422) {
    const errText = await res.text().catch(() => '');
    throw new Error(
      `Lemon Squeezy subscription cancellation failed (HTTP ${res.status}): ${errText.slice(0, 200)}`
    );
  }

  return { canceled: true, provider: 'lemonsqueezy', subscriptionId: cleanId, mode: 'live' };
}

export const lemonSqueezyProvider = new LemonSqueezyProvider();
export default lemonSqueezyProvider;

