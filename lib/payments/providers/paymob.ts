import crypto from 'crypto';
import { getPlanById } from '../../plans';
import {
  ProviderNotConfiguredError,
  isMockPaymentsAllowed,
  isUnconfiguredEnvValue,
} from './stripe';
import {
  CheckoutOrderInput,
  CheckoutUserInput,
  NormalizedEvent,
  PaymentProvider,
  WebhookSignatureError,
} from './types';
import DataStore from '@/app/lib/datastore';

export function isPaymobConfigured(): boolean {
  const apiKey = (process.env.PAYMOB_API_KEY || '').trim();
  const integrationId = (process.env.PAYMOB_INTEGRATION_ID || '').trim();
  const iframeId = (process.env.PAYMOB_IFRAME_ID || '').trim();
  return (
    !isUnconfiguredEnvValue(apiKey) &&
    !isUnconfiguredEnvValue(integrationId) &&
    !isUnconfiguredEnvValue(iframeId)
  );
}

/**
 * Verifies Paymob transaction webhook HMAC using SHA512 and timing-safe comparison.
 * Concatenates mandatory fields in exact lexicographical order required by Paymob.
 */
export function verifyPaymobHmac(
  obj: Record<string, any>,
  receivedHmac: string,
  hmacSecret?: string
): boolean {
  const secret = (hmacSecret ?? process.env.PAYMOB_HMAC_SECRET ?? '').trim();
  if (
    !secret ||
    isUnconfiguredEnvValue(secret) ||
    !receivedHmac ||
    typeof receivedHmac !== 'string'
  ) {
    return false;
  }

  const normalizedReceived = receivedHmac.trim();
  if (!/^[0-9a-fA-F]{128}$/.test(normalizedReceived)) {
    return false;
  }

  // Paymob mandatory HMAC fields in exact sequence
  const fields = [
    obj.amount_cents,
    obj.created_at,
    obj.currency,
    obj.error_occured,
    obj.has_parent_transaction,
    obj.id,
    obj.integration_id,
    obj.is_3d_secure,
    obj.is_auth,
    obj.is_capture,
    obj.is_refunded,
    obj.is_standalone_payment,
    obj.is_voided,
    obj.order?.id ?? obj.order,
    obj.owner,
    obj.pending,
    obj.source_data?.pan ?? '',
    obj.source_data?.sub_type ?? '',
    obj.source_data?.type ?? '',
    obj.success,
  ];

  const concatenatedString = fields
    .map((val) => {
      if (val === undefined || val === null) return '';
      if (typeof val === 'boolean') return val ? 'true' : 'false';
      return String(val);
    })
    .join('');

  const calculatedHmac = crypto
    .createHmac('sha512', secret)
    .update(concatenatedString)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  try {
    const calcBuf = Buffer.from(calculatedHmac, 'hex');
    const recvBuf = Buffer.from(normalizedReceived, 'hex');
    if (calcBuf.length !== recvBuf.length || calcBuf.length === 0) {
      return false;
    }
    return crypto.timingSafeEqual(calcBuf, recvBuf);
  } catch {
    return false;
  }
}

function getHeaderValue(
  headers: Headers | Record<string, string | string[] | undefined>,
  name: string
): string | undefined {
  if (typeof (headers as Headers).get === 'function') {
    return (
      (headers as Headers).get(name) ||
      (headers as Headers).get(name.toLowerCase()) ||
      undefined
    );
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
 * Paymob PaymentProvider implementation behind the unified PaymentProvider interface.
 */
export class PaymobProvider implements PaymentProvider {
  public readonly name = 'paymob' as const;

  async createCheckout(
    order: CheckoutOrderInput,
    user: CheckoutUserInput
  ): Promise<{ url: string; externalId?: string }> {
    const plan = getPlanById(order.planId);
    if (!plan || plan.id === 'free') {
      throw new Error(`Invalid checkout plan ID: ${order.planId}`);
    }

    const amountCents = Math.round(Number(order.amount) * 100);
    const merchantOrderId =
      order.reference ||
      order.id ||
      `jm_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000');

    const apiKey = (process.env.PAYMOB_API_KEY || '').trim();
    const integrationId = (process.env.PAYMOB_INTEGRATION_ID || '').trim();
    const iframeId = (process.env.PAYMOB_IFRAME_ID || '').trim();

    if (!isPaymobConfigured()) {
      if (!isMockPaymentsAllowed()) {
        throw new ProviderNotConfiguredError(
          'paymob',
          'Paymob payment provider is not configured (missing PAYMOB_API_KEY, PAYMOB_INTEGRATION_ID, or PAYMOB_IFRAME_ID).'
        );
      }

      if (order.id) {
        await DataStore.completeOrder(order.id, {
          actor: 'mock_paymob',
          note: 'Mock Paymob checkout completed in non-production test mode',
        });
      }

      const mockUrl = `${appUrl}/payment/success?order_id=${encodeURIComponent(merchantOrderId)}&reference=${encodeURIComponent(merchantOrderId)}&provider=paymob&mock=true`;
      return {
        url: mockUrl,
        externalId: merchantOrderId,
      };
    }

    // Step 1: Authentication Request
    const authRes = await fetch('https://accept.paymob.com/api/auth/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey }),
    });

    if (!authRes.ok) {
      throw new Error(`Paymob authentication failed: HTTP ${authRes.status}`);
    }
    const authData = await authRes.json();
    const authToken = authData.token;
    if (!authToken) {
      throw new Error('Paymob authentication response did not include an auth token.');
    }

    // Step 2: Order Registration
    const orderRes = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: authToken,
        delivery_needed: 'false',
        amount_cents: amountCents,
        currency: 'EGP',
        merchant_order_id: merchantOrderId,
        items: [
          {
            name: `${plan.name.en} (${plan.id === 'payg' ? 'one-time' : order.billingCycle})`,
            amount_cents: amountCents,
            description: plan.description.en,
            quantity: '1',
          },
        ],
      }),
    });

    if (!orderRes.ok) {
      throw new Error(`Paymob order creation failed: HTTP ${orderRes.status}`);
    }
    const orderData = await orderRes.json();
    const paymobOrderId = orderData.id;
    if (!paymobOrderId) {
      throw new Error('Paymob order registration response did not include an order ID.');
    }

    // Step 3: Payment Key Request
    const nameParts = (user.name || 'JobMatch User').split(' ');
    const firstName = nameParts[0] || 'JobMatch';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    const keyRes = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: authToken,
        amount_cents: amountCents,
        expiration: 3600,
        order_id: paymobOrderId,
        billing_data: {
          apartment: 'NA',
          email: user.email,
          floor: 'NA',
          first_name: firstName,
          street: 'NA',
          building: 'NA',
          phone_number: '+201000000000',
          shipping_method: 'NA',
          postal_code: 'NA',
          city: 'Cairo',
          country: 'EG',
          last_name: lastName,
          state: 'Cairo',
        },
        currency: 'EGP',
        integration_id: Number(integrationId),
        lock_order_when_paid: 'true',
      }),
    });

    if (!keyRes.ok) {
      throw new Error(`Paymob payment key request failed: HTTP ${keyRes.status}`);
    }
    const keyData = await keyRes.json();
    const paymentToken = keyData.token;
    if (!paymentToken) {
      throw new Error('Paymob payment key response did not include a payment token.');
    }

    // Step 4: Construct Paymob Iframe URL
    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentToken}`;

    return {
      url: iframeUrl,
      externalId: String(paymobOrderId),
    };
  }

  async handleWebhook(
    rawBody: string | Buffer,
    headers: Headers | Record<string, string | string[] | undefined>
  ): Promise<NormalizedEvent> {
    const hmacSecret = (process.env.PAYMOB_HMAC_SECRET || '').trim();
    if (!hmacSecret || isUnconfiguredEnvValue(hmacSecret)) {
      throw new ProviderNotConfiguredError(
        'paymob',
        'PAYMOB_HMAC_SECRET is not configured.'
      );
    }

    const receivedHmac =
      getHeaderValue(headers, 'x-paymob-hmac') || getHeaderValue(headers, 'hmac');

    const rawString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
    let parsedBody: Record<string, any> = {};
    try {
      parsedBody = JSON.parse(rawString);
    } catch {
      throw new Error('Invalid JSON payload in Paymob webhook.');
    }

    const obj: Record<string, any> = parsedBody.obj || parsedBody;

    if (!receivedHmac || !verifyPaymobHmac(obj, receivedHmac, hmacSecret)) {
      throw new WebhookSignatureError('Missing or invalid Paymob HMAC signature.');
    }

    const merchantOrderId = String(
      obj.order?.merchant_order_id || obj.merchant_order_id || obj.reference || ''
    ).trim();

    const actualAmountCents = Number(obj.amount_cents);
    const amountCents = Number.isFinite(actualAmountCents)
      ? Math.round(actualAmountCents)
      : undefined;
    const amount = typeof amountCents === 'number' ? amountCents / 100 : undefined;
    const currency = String(obj.currency || '').toUpperCase();
    const eventId = `paymob_tx_${obj.id || merchantOrderId}`;

    const isRefunded = obj.is_refunded === true || obj.is_refunded === 'true';
    const isSuccessful =
      (obj.success === true || obj.success === 'true') &&
      obj.is_voided !== true &&
      !isRefunded &&
      obj.pending !== true &&
      obj.error_occured !== true;

    let action: NormalizedEvent['action'] = 'ignore';
    let status = 'failed';

    if (isRefunded) {
      action = 'order_refunded';
      status = 'refunded';
    } else if (isSuccessful) {
      action = 'activate_order';
      status = 'paid';
    }

    return {
      eventId,
      provider: 'paymob',
      eventType: 'TRANSACTION',
      action,
      orderReference: merchantOrderId || undefined,
      amount,
      amountCents,
      currency,
      status,
      rawPayload: obj,
    };
  }
}

export const paymobProvider = new PaymobProvider();

