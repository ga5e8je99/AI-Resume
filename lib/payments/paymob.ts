import { getPlanById, getPlanPrice, BillingCycle } from '../plans';
import DataStore from '@/app/lib/datastore';
import {
  ProviderNotConfiguredError,
  isMockPaymentsAllowed,
  isUnconfiguredEnvValue,
} from './providers/stripe';
import {
  isPaymobConfigured,
  verifyPaymobHmac,
  PaymobProvider,
  paymobProvider,
} from './providers/paymob';

export {
  ProviderNotConfiguredError,
  isMockPaymentsAllowed,
  isUnconfiguredEnvValue,
  isPaymobConfigured,
  verifyPaymobHmac,
  PaymobProvider,
  paymobProvider,
};

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
 * Creates a stored Order in DataStore and delegates Paymob session creation to paymobProvider.createCheckout().
 */
export async function createPaymobCheckoutSession({
  user,
  planId,
  billingCycle = 'monthly',
  successUrl,
  cancelUrl,
}: CreatePaymobCheckoutParams): Promise<PaymobCheckoutResult> {
  const plan = getPlanById(planId);
  if (!plan) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }
  if (plan.id === 'free') {
    throw new Error('Free plan does not require payment checkout.');
  }

  // Strictly read EGP price from lib/plans.ts
  const priceEgp = getPlanPrice(plan.id, 'EGP', billingCycle);
  const merchantOrderId = `jm_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  const storedOrder = await DataStore.createOrder({
    userId: user.id,
    userEmail: user.email,
    planId: plan.id as 'pro' | 'payg',
    billingCycle: plan.id === 'payg' ? 'once' : billingCycle,
    baseAmount: priceEgp,
    amount: priceEgp,
    currency: 'EGP',
    method: 'paymob',
    reference: merchantOrderId,
    expiresAt,
  });

  const session = await paymobProvider.createCheckout(
    {
      id: storedOrder.id,
      reference: storedOrder.reference,
      planId: storedOrder.planId,
      billingCycle: storedOrder.billingCycle,
      amount: storedOrder.amount,
      currency: 'EGP',
      successUrl,
      cancelUrl,
    },
    user
  );

  return {
    url: session.url,
    provider: 'paymob',
    orderId: session.externalId || storedOrder.id,
    reference: storedOrder.reference,
  };
}
