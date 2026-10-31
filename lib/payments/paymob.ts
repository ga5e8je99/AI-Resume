import crypto from 'crypto';
import { getPlanById, getPlanPrice, BillingCycle } from '../plans';
import {
  ProviderNotConfiguredError,
  isMockPaymentsAllowed,
  isUnconfiguredEnvValue,
} from './stripe';
import DataStore from '@/app/lib/datastore';

export { ProviderNotConfiguredError, isMockPaymentsAllowed };

export interface CreatePaymobCheckoutParams {
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

export interface PaymobCheckoutResult {
  url: string;
  provider: 'paymob';
  orderId?: string | number;
  reference?: string;
  token?: string;
}

/**
 * Creates a Paymob payment session for Egyptian users paying in EGP.
 * Uses Paymob Accept APIs (Auth Token -> Ecommerce Order -> Payment Key)
 * and persists an Order with status 'awaiting_payment' in DataStore for webhook verification.
 */
export async function createPaymobCheckoutSession({
  user,
  planId,
  billingCycle = 'monthly',
}: CreatePaymobCheckoutParams): Promise<PaymobCheckoutResult> {
  const plan = getPlanById(planId);
  if (!plan) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }
  if (plan.id === 'free') {
    throw new Error('Free plan does not require payment checkout.');
  }

  // Strictly read EGP price from lib/plans.ts (no hardcoded fallbacks)
  const priceEgp = getPlanPrice(plan.id, 'EGP', billingCycle);
  const amountCents = Math.round(priceEgp * 100);
  const merchantOrderId = `jm_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const apiKey = (process.env.PAYMOB_API_KEY || '').trim();
  const integrationId = (process.env.PAYMOB_INTEGRATION_ID || '').trim();
  const iframeId = (process.env.PAYMOB_IFRAME_ID || '').trim();

  const isUnconfigured =
    isUnconfiguredEnvValue(apiKey) ||
    isUnconfiguredEnvValue(integrationId) ||
    isUnconfiguredEnvValue(iframeId);

  if (isUnconfigured) {
    if (!isMockPaymentsAllowed()) {
      throw new ProviderNotConfiguredError(
        'paymob',
        'Paymob payment provider is not configured (missing PAYMOB_API_KEY, PAYMOB_INTEGRATION_ID, or PAYMOB_IFRAME_ID).'
      );
    }

    const createdOrder = await DataStore.createOrder({
      userId: user.id,
      userEmail: user.email,
      planId: plan.id as 'pro' | 'payg',
      billingCycle: plan.id === 'payg' ? 'once' : billingCycle,
      baseAmount: priceEgp,
      amount: priceEgp,
      currency: 'EGP',
      method: 'paymob',
      network: 'paymob',
      reference: merchantOrderId,
      expiresAt,
      metadata: { mock: true },
    });

    await DataStore.completeOrder(createdOrder.id, {
      txid: `paymob_mock_${merchantOrderId}`,
      actor: 'mock_paymob',
      note: 'Mock Paymob checkout completed in test mode',
    });

    const mockUrl = `${appUrl}/payment/success?order_id=${merchantOrderId}&reference=${merchantOrderId}&provider=paymob&mock=true&planId=${plan.id}&billingCycle=${billingCycle}`;
    return {
      url: mockUrl,
      provider: 'paymob',
      orderId: merchantOrderId,
      reference: merchantOrderId,
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
          name: `${plan.name.en} (${plan.id === 'payg' ? 'one-time' : billingCycle})`,
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
  const orderId = orderData.id;
  if (!orderId) {
    throw new Error('Paymob order registration response did not include an order ID.');
  }

  // Persist Order in DataStore with status 'awaiting_payment' linked to merchantOrderId
  await DataStore.createOrder({
    userId: user.id,
    userEmail: user.email,
    planId: plan.id as 'pro' | 'payg',
    billingCycle: plan.id === 'payg' ? 'once' : billingCycle,
    baseAmount: priceEgp,
    amount: priceEgp,
    currency: 'EGP',
    method: 'paymob',
    network: 'paymob',
    reference: merchantOrderId,
    expiresAt,
    metadata: {
      paymobOrderId: orderId,
    },
  });

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
      order_id: orderId,
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
    provider: 'paymob',
    orderId,
    reference: merchantOrderId,
    token: paymentToken,
  };
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
  if (!secret || isUnconfiguredEnvValue(secret) || !receivedHmac || typeof receivedHmac !== 'string') {
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
