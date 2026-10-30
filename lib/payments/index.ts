import { CurrencyCode, BillingCycle, getPlanById } from '../plans';
import { createStripeCheckoutSession } from './stripe';
import { createPaymobCheckoutSession } from './paymob';
import { isBinancePayConfigured, createBinancePayOrder } from './binance-pay';
import {
  getPlanPriceUsdt,
  calculateUniqueCryptoAmount,
  generateOrderReference,
  getReceivingWalletAddress,
  ORDER_EXPIRY_MINUTES,
} from './crypto-utils';
import DataStore from '@/app/lib/datastore';
import { CryptoNetwork, PaymentMethodType } from '@/app/models/Order';

export type ExtendedCurrencyCode = CurrencyCode | 'USDT';

export interface CreateCheckoutParams {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  planId: string;
  currency?: ExtendedCurrencyCode;
  billingCycle?: BillingCycle;
  method?: 'card' | 'binance' | 'manual_crypto' | 'auto';
  network?: CryptoNetwork;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutResult {
  url: string;
  provider: 'stripe' | 'paymob' | 'binance_pay' | 'manual_crypto';
  sessionId?: string;
  orderId?: string | number;
  reference?: string;
  amount?: number;
  network?: CryptoNetwork;
}

/**
 * Universal checkout dispatcher supporting:
 * 1. USDT / Crypto:
 *    - Method A: Binance Pay Merchant API (if credentials exist)
 *    - Method B: Direct manual crypto transfer to personal Binance wallet with on-chain verification
 * 2. EGP -> Paymob (Egypt local channels)
 * 3. USD -> Stripe (Cards)
 */
export async function createCheckout({
  user,
  planId,
  currency = 'USD',
  billingCycle = 'monthly',
  method = 'auto',
  network = 'BEP20',
  successUrl,
  cancelUrl,
}: CreateCheckoutParams): Promise<CheckoutResult> {
  const plan = getPlanById(planId);
  if (!plan) {
    throw new Error(`Plan "${planId}" not found in system catalog.`);
  }

  if (plan.id === 'free') {
    throw new Error('Free plan does not require checkout.');
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  // Crypto / Binance Route (Method A or Method B)
  if (currency === 'USDT' || method === 'binance' || method === 'manual_crypto') {
    const basePrice = getPlanPriceUsdt(
      planId as 'pro' | 'payg',
      billingCycle === 'annual' ? 'annual' : 'monthly'
    );

    // Fetch existing active orders to guarantee a unique cents suffix
    const activeOrders = await DataStore.listOrders({ status: 'awaiting_payment' });
    const activeAmounts = activeOrders.map((o) => o.amount);
    const { amount, centsSuffix } = calculateUniqueCryptoAmount(basePrice, activeAmounts);

    const reference = generateOrderReference();
    const expiresAt = new Date(Date.now() + ORDER_EXPIRY_MINUTES * 60 * 1000);
    const recipientAddress = getReceivingWalletAddress(network);

    // Method A: Binance Pay Merchant API (if credentials exist and not forced manual)
    if (isBinancePayConfigured() && method !== 'manual_crypto') {
      const binanceOrder = await createBinancePayOrder({
        merchantTradeNo: reference,
        orderAmount: amount,
        planId: planId as any,
        planName: plan.name.en,
        returnUrl: successUrl || `${appUrl}/payment/success?reference=${reference}&provider=binance_pay`,
        cancelUrl: cancelUrl || `${appUrl}/payment/cancelled?reference=${reference}&provider=binance_pay`,
        webhookUrl: `${appUrl}/api/webhooks/binance-pay`,
      });

      if (binanceOrder.success && (binanceOrder.checkoutUrl || binanceOrder.universalUrl)) {
        await DataStore.createOrder({
          userId: user.id,
          userEmail: user.email,
          planId: planId as any,
          billingCycle: planId === 'payg' ? 'once' : billingCycle,
          baseAmount: basePrice,
          amount,
          currency: 'USDT',
          method: 'binance_pay',
          network: 'binance',
          reference,
          expiresAt,
          metadata: {
            prepayId: binanceOrder.prepayId,
            checkoutUrl: binanceOrder.checkoutUrl,
          },
        });

        return {
          url: binanceOrder.checkoutUrl || binanceOrder.universalUrl || '',
          provider: 'binance_pay',
          orderId: reference,
          reference,
          amount,
        };
      }
    }

    // Method B: Manual Crypto Payment (Personal Binance deposit address fallback)
    const storedOrder = await DataStore.createOrder({
      userId: user.id,
      userEmail: user.email,
      planId: planId as any,
      billingCycle: planId === 'payg' ? 'once' : billingCycle,
      baseAmount: basePrice,
      amount,
      currency: 'USDT',
      method: 'manual_crypto',
      network,
      reference,
      recipientAddress,
      expiresAt,
      metadata: {
        centsSuffix,
      },
    });

    const paymentPageUrl = `${appUrl}/payment/crypto?reference=${storedOrder.reference}`;
    return {
      url: paymentPageUrl,
      provider: 'manual_crypto',
      orderId: storedOrder.id,
      reference: storedOrder.reference,
      amount: storedOrder.amount,
      network,
    };
  }

  // Local Egyptian payment options (Paymob)
  if (currency === 'EGP') {
    const paymobSession = await createPaymobCheckoutSession({
      user,
      planId,
      billingCycle,
      successUrl,
      cancelUrl,
    });
    return {
      url: paymobSession.url,
      provider: 'paymob',
      orderId: paymobSession.orderId,
    };
  }

  // Default to Stripe for international USD card checkouts
  const stripeSession = await createStripeCheckoutSession({
    user,
    planId,
    billingCycle,
    successUrl,
    cancelUrl,
  });

  return {
    url: stripeSession.url,
    provider: 'stripe',
    sessionId: stripeSession.sessionId,
  };
}

export * from './stripe';
export * from './paymob';
export * from './binance-pay';
export * from './manual-crypto';
export * from './crypto-utils';
export default createCheckout;
