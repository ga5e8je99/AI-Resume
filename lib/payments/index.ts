import { CurrencyCode, BillingCycle, getPlanById, getPlanPrice } from '../plans';
import {
  ProviderNotConfiguredError,
  isMockPaymentsAllowed,
  isStripeConfigured,
  stripeProvider,
} from './providers/stripe';
import { isPaymobConfigured, paymobProvider } from './providers/paymob';
import {
  lemonSqueezyProvider,
  isLemonSqueezyConfigured,
} from './providers/lemonsqueezy';
import { PaymentProvider, PaymentProviderName } from './providers/types';
import DataStore from '@/app/lib/datastore';

export type ExtendedCurrencyCode = CurrencyCode;

export interface EnabledProviderInfo {
  id: PaymentProviderName;
  name: string;
  currencies: CurrencyCode[];
  enabled: boolean;
}

const PROVIDERS_MAP: Record<PaymentProviderName, PaymentProvider> = {
  lemonsqueezy: lemonSqueezyProvider,
  stripe: stripeProvider,
  paymob: paymobProvider,
};

export function getPaymentProvider(name: PaymentProviderName): PaymentProvider {
  const provider = PROVIDERS_MAP[name];
  if (!provider) {
    throw new Error(`Unknown payment provider: "${name}".`);
  }
  return provider;
}

/**
 * Returns the currently enabled payment providers and currencies based on
 * environment configuration.
 * Optional providers (Stripe, Paymob) are strictly hidden from the UI unless
 * their credentials are explicitly configured in process.env.
 */
export function getEnabledProviders(): {
  providers: EnabledProviderInfo[];
  enabledProviders: PaymentProviderName[];
  currencies: CurrencyCode[];
  defaultCurrency: CurrencyCode;
  mockMode: boolean;
} {
  const mockMode = isMockPaymentsAllowed();
  const lsEnabled = isLemonSqueezyConfigured() || mockMode;
  const stripeEnabled = isStripeConfigured();
  const paymobEnabled = isPaymobConfigured();

  const allProviders: EnabledProviderInfo[] = [
    {
      id: 'lemonsqueezy',
      name: 'Lemon Squeezy',
      currencies: ['USD'],
      enabled: lsEnabled,
    },
    {
      id: 'stripe',
      name: 'Stripe',
      currencies: ['USD'],
      enabled: stripeEnabled,
    },
    {
      id: 'paymob',
      name: 'Paymob',
      currencies: ['EGP'],
      enabled: paymobEnabled,
    },
  ];

  const enabledList = allProviders.filter((p) => p.enabled);
  const enabledIds = enabledList.map((p) => p.id);

  const currencies: CurrencyCode[] = [];
  if (lsEnabled || stripeEnabled) {
    currencies.push('USD');
  }
  if (paymobEnabled) {
    currencies.push('EGP');
  }

  const defaultCurrency: CurrencyCode = currencies[0] || 'USD';

  return {
    providers: enabledList,
    enabledProviders: enabledIds,
    currencies,
    defaultCurrency,
    mockMode,
  };
}

export interface CreateCheckoutParams {
  user: {
    id: string;
    email: string;
    name?: string;
    stripeCustomerId?: string;
    lemonCustomerId?: string;
  };
  planId: string;
  currency?: CurrencyCode;
  billingCycle?: BillingCycle;
  method?: 'lemonsqueezy' | 'stripe' | 'paymob' | 'card' | 'auto';
  provider?: PaymentProviderName;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutResult {
  url: string;
  provider: PaymentProviderName;
  sessionId?: string;
  orderId?: string | number;
  reference?: string;
  amount?: number;
}

/**
 * Universal checkout dispatcher behind the unified PaymentProvider interface:
 * 1. USD -> Lemon Squeezy (primary) or Stripe (optional when configured/requested)
 * 2. EGP -> Paymob (optional when configured/requested)
 *
 * Persists a canonical Order in DataStore (with prices from lib/plans.ts)
 * and delegates checkout URL generation to provider.createCheckout(order, user).
 */
export async function createCheckout({
  user,
  planId,
  currency = 'USD',
  billingCycle = 'monthly',
  method = 'auto',
  provider,
  successUrl,
  cancelUrl,
}: CreateCheckoutParams): Promise<CheckoutResult> {
  if (!user || !user.id || !user.email) {
    throw new Error('Authenticated user with valid ID and email is required to create checkout.');
  }

  const plan = getPlanById(planId);
  if (!plan) {
    throw new Error(`Plan "${planId}" not found in system catalog.`);
  }

  if (plan.id === 'free') {
    throw new Error('Free plan does not require checkout.');
  }

  if (currency !== 'USD' && currency !== 'EGP') {
    throw new Error(`Unsupported checkout currency: "${currency}".`);
  }

  const requestedProvider: PaymentProviderName | undefined =
    provider ||
    (method === 'lemonsqueezy' || method === 'stripe' || method === 'paymob'
      ? method
      : undefined);

  let selectedProviderName: PaymentProviderName;
  let targetCurrency: CurrencyCode = currency;

  if (currency === 'EGP' || requestedProvider === 'paymob') {
    selectedProviderName = 'paymob';
    targetCurrency = 'EGP';
  } else if (requestedProvider === 'stripe') {
    selectedProviderName = 'stripe';
    targetCurrency = 'USD';
  } else if (requestedProvider === 'lemonsqueezy') {
    selectedProviderName = 'lemonsqueezy';
    targetCurrency = 'USD';
  } else if (
    isLemonSqueezyConfigured(
      plan.id as 'pro' | 'payg',
      plan.id === 'payg' ? 'once' : billingCycle
    )
  ) {
    selectedProviderName = 'lemonsqueezy';
    targetCurrency = 'USD';
  } else if (
    isStripeConfigured(
      plan.id as 'pro' | 'payg',
      plan.id === 'payg' ? 'once' : billingCycle
    )
  ) {
    selectedProviderName = 'stripe';
    targetCurrency = 'USD';
  } else {
    selectedProviderName = 'lemonsqueezy';
    targetCurrency = 'USD';
  }

  const selectedProvider = getPaymentProvider(selectedProviderName);
  const canonicalPrice = getPlanPrice(plan.id, targetCurrency, billingCycle);
  const refPrefix =
    selectedProviderName === 'paymob'
      ? 'jm'
      : selectedProviderName === 'stripe'
      ? 'stripe'
      : 'ls';
  const orderRef = `${refPrefix}_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  const storedOrder = await DataStore.createOrder({
    userId: user.id,
    userEmail: user.email,
    planId: plan.id as 'pro' | 'payg',
    billingCycle: plan.id === 'payg' ? 'once' : billingCycle,
    baseAmount: canonicalPrice,
    amount: canonicalPrice,
    currency: targetCurrency,
    method: selectedProviderName,
    reference: orderRef,
    expiresAt,
  });

  const session = await selectedProvider.createCheckout(
    {
      id: storedOrder.id,
      reference: storedOrder.reference,
      planId: storedOrder.planId,
      billingCycle: storedOrder.billingCycle,
      amount: storedOrder.amount,
      currency: targetCurrency,
      successUrl,
      cancelUrl,
    },
    user
  );

  if (!session.url) {
    throw new Error(`Payment provider "${selectedProviderName}" failed to return a checkout URL.`);
  }

  return {
    url: session.url,
    provider: selectedProviderName,
    sessionId: session.externalId,
    orderId: storedOrder.id,
    reference: storedOrder.reference,
    amount: storedOrder.amount,
  };
}

/**
 * Cancels any active subscription at the user's configured payment provider (Lemon Squeezy, Stripe, or Paymob)
 * before permanent account deletion.
 */
export async function cancelUserActiveSubscription(user: {
  id: string;
  plan?: string;
  subscriptionStatus?: string;
  paymentProvider?: string;
  lemonSubscriptionId?: string;
  stripeSubscriptionId?: string;
  providerSubscriptionId?: string;
}): Promise<{
  hadActiveSubscription: boolean;
  canceled: boolean;
  provider?: 'lemonsqueezy' | 'stripe' | 'paymob';
  subscriptionId?: string;
  mode?: 'live' | 'mock';
}> {
  const lemonSubId =
    user.lemonSubscriptionId ||
    (user.paymentProvider === 'lemonsqueezy' ? user.providerSubscriptionId : '') ||
    '';
  const stripeSubId =
    user.stripeSubscriptionId ||
    (user.paymentProvider === 'stripe' ? user.providerSubscriptionId : '') ||
    '';
  const hasActiveStatus =
    user.subscriptionStatus === 'active' ||
    user.subscriptionStatus === 'past_due' ||
    user.plan === 'pro' ||
    Boolean(lemonSubId) ||
    Boolean(stripeSubId);

  if (!hasActiveStatus) {
    return { hadActiveSubscription: false, canceled: false };
  }

  if (lemonSubId) {
    const { cancelLemonSqueezySubscription } = await import('./providers/lemonsqueezy');
    const res = await cancelLemonSqueezySubscription(lemonSubId);
    return {
      hadActiveSubscription: true,
      canceled: res.canceled,
      provider: 'lemonsqueezy',
      subscriptionId: res.subscriptionId,
      mode: res.mode,
    };
  }

  if (stripeSubId) {
    const { cancelStripeSubscription } = await import('./providers/stripe');
    const res = await cancelStripeSubscription(stripeSubId);
    return {
      hadActiveSubscription: true,
      canceled: res.canceled,
      provider: 'stripe',
      subscriptionId: res.subscriptionId,
      mode: res.mode,
    };
  }

  // Paymob or non-recurring Pro plan
  return {
    hadActiveSubscription: true,
    canceled: true,
    provider: (user.paymentProvider as any) || 'paymob',
    subscriptionId: user.providerSubscriptionId || `local_sub_${user.id}`,
    mode: 'mock',
  };
}

export * from './providers/types';
export * from './providers/lemonsqueezy';
export * from './providers/stripe';
export * from './providers/paymob';
export * from './stripe';
export * from './paymob';
export default createCheckout;
