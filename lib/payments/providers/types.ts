export type PaymentProviderName = 'lemonsqueezy' | 'stripe' | 'paymob';

export type NormalizedEventAction =
  | 'activate_order'
  | 'subscription_updated'
  | 'subscription_renewed'
  | 'subscription_cancelled'
  | 'subscription_expired'
  | 'order_refunded'
  | 'ignore';

export interface CheckoutOrderInput {
  id: string;
  reference?: string;
  planId: 'pro' | 'payg';
  billingCycle: 'monthly' | 'annual' | 'once';
  amount: number;
  currency: 'USD' | 'EGP';
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, any>;
}

export interface CheckoutUserInput {
  id: string;
  email: string;
  name?: string;
  stripeCustomerId?: string;
  lemonCustomerId?: string;
}

export interface NormalizedEvent {
  eventId: string;
  provider: PaymentProviderName;
  eventType: string;
  action: NormalizedEventAction;
  orderId?: string;
  orderReference?: string;
  userId?: string;
  userEmail?: string;
  planId?: 'pro' | 'payg';
  billingCycle?: 'monthly' | 'annual' | 'once';
  amount?: number;
  amountCents?: number;
  currency?: string;
  customerId?: string;
  subscriptionId?: string;
  status?: string;
  renewsAt?: string | null;
  endsAt?: string | null;
  customerPortalUrl?: string | null;
  rawPayload?: Record<string, any>;
}

export class WebhookSignatureError extends Error {
  public readonly code = 'INVALID_SIGNATURE';
  public readonly statusCode = 401;

  constructor(message = 'Invalid or missing webhook signature.') {
    super(message);
    this.name = 'WebhookSignatureError';
    Object.setPrototypeOf(this, WebhookSignatureError.prototype);
  }
}

export interface PaymentProvider {
  name: PaymentProviderName | string;
  createCheckout(
    order: CheckoutOrderInput,
    user: CheckoutUserInput
  ): Promise<{ url: string; externalId?: string }>;
  handleWebhook(
    rawBody: string | Buffer,
    headers: Headers | Record<string, string | string[] | undefined>
  ): Promise<NormalizedEvent>;
}

