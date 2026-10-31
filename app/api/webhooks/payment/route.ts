import { NextRequest, NextResponse } from 'next/server';
import DataStore from '@/app/lib/datastore';
import {
  verifyStripeWebhookSignature,
  isUnconfiguredEnvValue,
} from '@/lib/payments/stripe';
import { verifyPaymobHmac } from '@/lib/payments/paymob';
import {
  sendEmail,
  getPaymentReceiptEmailHtml,
  getSubscriptionAlertEmailHtml,
} from '@/lib/email';
import { getPlanCredits, getPlanPrice } from '@/lib/plans';
import { applyRateLimit } from '@/lib/rate-limit';

async function resolveStripeUser({
  userId,
  subscriptionId,
  customerId,
}: {
  userId?: string;
  subscriptionId?: string;
  customerId?: string;
}) {
  if (userId) {
    const byId = await DataStore.findUserById(userId);
    if (byId) return byId;
  }
  if (subscriptionId) {
    const bySub = await DataStore.findUserByStripeSubscriptionId(subscriptionId);
    if (bySub) return bySub;
  }
  if (customerId) {
    const byCust = await DataStore.findUserByStripeCustomerId(customerId);
    if (byCust) return byCust;
  }
  return null;
}

/**
 * POST /api/webhooks/payment
 * Universal webhook endpoint handling separated Stripe and Paymob payment notifications.
 * Security & Integrity Guarantees:
 * - Stripe branch: Uses stripe.webhooks.constructEvent with raw body & signature; handles checkout.session.completed (no duplicate payment_intent.succeeded activation).
 * - Paymob branch: Enforces PAYMOB_HMAC_SECRET (500 if missing in production) and timing-safe HMAC verification (401 if missing/invalid).
 * - Order-bound verification: Never trusts userId/planId from query or body; looks up stored Order by merchant_order_id/reference, verifies amount_cents & currency, and activates idempotently via DataStore.completeOrder.
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimit = await applyRateLimit(req, {
      limit: 120,
      ipLimit: 120,
      windowMs: 60 * 1000,
      keyPrefix: 'webhook_payment',
    });
    if (!rateLimit.allowed && rateLimit.errorResponse) {
      return rateLimit.errorResponse;
    }

    const rawBody = await req.text();
    const stripeSignature = req.headers.get('stripe-signature');
    const paymobHmac =
      req.headers.get('x-paymob-hmac') ||
      req.nextUrl.searchParams.get('hmac');
    const testHeader = req.headers.get('x-test-webhook');

    // ==========================================
    // 1. STRIPE WEBHOOK HANDLER
    // ==========================================
    if (stripeSignature) {
      const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
      if (!webhookSecret || isUnconfiguredEnvValue(webhookSecret)) {
        console.error('CRITICAL: STRIPE_WEBHOOK_SECRET is not configured.');
        return NextResponse.json(
          {
            error: 'CONFIGURATION_ERROR',
            message: 'Stripe webhook secret is not configured.',
          },
          { status: 500 }
        );
      }

      let event: any;
      try {
        event = verifyStripeWebhookSignature(rawBody, stripeSignature, webhookSecret);
      } catch (err: any) {
        console.error('Stripe webhook signature verification failed:', err.message);
        return NextResponse.json(
          { error: 'INVALID_SIGNATURE', message: err.message },
          { status: 400 }
        );
      }

      const eventId = event.id;
      const eventType = event.type;

      // Idempotency check: ignore duplicate events
      if (await DataStore.isEventProcessed(eventId)) {
        return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
      }

      // Handle checkout.session.completed ONLY for checkout activation (payment_intent.succeeded removed to prevent duplicate activation)
      if (eventType === 'checkout.session.completed') {
        const session = event.data?.object || {};
        const metadata = session.metadata || {};
        const userId = metadata.userId || session.client_reference_id;
        const planId = metadata.planId || (session.mode === 'subscription' ? 'pro' : 'payg');
        const billingCycle = (metadata.billingCycle || 'monthly') as 'monthly' | 'annual';
        const amount = (session.amount_total ?? session.amount ?? 0) / 100;
        const currency = (session.currency || 'USD').toUpperCase();
        const customerId =
          typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id || '';
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id || '';

        const user = await resolveStripeUser({ userId, subscriptionId, customerId });
        if (user) {
          if (planId === 'pro') {
            const now = Date.now();
            const existingRaw = (user as any).proExpiresAt || (user as any).planExpiresAt;
            const existingExpiry = existingRaw ? new Date(existingRaw).getTime() : 0;
            const baseTime = existingExpiry > now ? existingExpiry : now;
            const extensionDays = billingCycle === 'annual' ? 365 : 30;
            const proExpiresAt = new Date(baseTime + extensionDays * 24 * 60 * 60 * 1000);

            await DataStore.upgradeUserPlan(user.id, {
              plan: 'pro',
              billingCycle,
              planExpiresAt: proExpiresAt,
              proExpiresAt,
              paymentProvider: 'stripe',
              providerCustomerId: customerId || (user as any).stripeCustomerId || '',
              providerSubscriptionId: subscriptionId || (user as any).stripeSubscriptionId || '',
              stripeCustomerId: customerId || (user as any).stripeCustomerId || '',
              stripeSubscriptionId: subscriptionId || (user as any).stripeSubscriptionId || '',
              subscriptionStatus: 'active',
              paymentFailedAt: null,
            });
          } else {
            const creditsToGrant = getPlanCredits(planId);
            if (typeof creditsToGrant === 'number' && creditsToGrant > 0) {
              await DataStore.incrementUserCredits(user.id, creditsToGrant);
            }
            if (customerId) {
              await DataStore.upgradeUserPlan(user.id, {
                plan: ((user as any).plan || 'free') as any,
                billingCycle: (user as any).billingCycle || 'none',
                planExpiresAt: (user as any).proExpiresAt || (user as any).planExpiresAt || null,
                proExpiresAt: (user as any).proExpiresAt || (user as any).planExpiresAt || null,
                paymentProvider: 'stripe',
                stripeCustomerId: customerId,
                providerCustomerId: customerId,
              });
            }
          }

          // Mark associated Order as paid if reference is present in metadata
          const orderRef = metadata.reference || metadata.orderReference;
          if (orderRef) {
            const stripeOrder = await DataStore.findOrderByReference(String(orderRef));
            if (stripeOrder && stripeOrder.status !== 'paid') {
              await DataStore.updateOrderStatus(stripeOrder.id, 'paid', {
                txid: session.id,
                actor: 'stripe_webhook',
                note: 'Paid via Stripe checkout.session.completed',
              });
            }
          }

          // Record payment audit trail
          await DataStore.recordPayment({
            userId: user.id,
            userEmail: user.email || session.customer_details?.email,
            amount,
            currency,
            provider: 'stripe',
            providerPaymentId: session.id,
            planId,
            billingCycle: planId === 'pro' ? billingCycle : 'none',
            status: 'succeeded',
            metadata: {
              stripeEventId: eventId,
              eventType,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
            },
          });

          // Dispatch payment receipt email (non-blocking)
          const recipientEmail = user.email || session.customer_details?.email;
          if (recipientEmail) {
            sendEmail({
              to: recipientEmail,
              subject: 'JobMatch AI - Payment Receipt & Confirmation 🧾',
              html: getPaymentReceiptEmailHtml({
                name: user.name || 'Valued Customer',
                amount,
                currency,
                planId,
                transactionId: session.id,
              }),
              isDemo: Boolean(user.isDemo),
            }).catch((err) => {
              console.error('[Stripe Webhook] Failed to send receipt email:', err);
            });
          }
        }
      } else if (eventType === 'invoice.paid') {
        const invoice = event.data?.object || {};
        const customerId =
          typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer?.id || '';
        const subscriptionId =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id || '';
        const lineItem = invoice.lines?.data?.[0] || {};
        const metadata = {
          ...(lineItem.metadata || {}),
          ...(invoice.subscription_details?.metadata || {}),
          ...(invoice.metadata || {}),
        };
        const userId = metadata.userId;

        const user = await resolveStripeUser({ userId, subscriptionId, customerId });
        if (user) {
          const recurringInterval = lineItem.price?.recurring?.interval;
          const billingCycle = (
            metadata.billingCycle === 'annual' || recurringInterval === 'year'
              ? 'annual'
              : (user as any).billingCycle === 'annual'
              ? 'annual'
              : 'monthly'
          ) as 'monthly' | 'annual';

          const periodEndSec = lineItem.period?.end;
          let proExpiresAt: Date;
          if (typeof periodEndSec === 'number' && periodEndSec * 1000 > Date.now()) {
            proExpiresAt = new Date(periodEndSec * 1000);
          } else {
            const now = Date.now();
            const existingRaw = (user as any).proExpiresAt || (user as any).planExpiresAt;
            const existingExpiry = existingRaw ? new Date(existingRaw).getTime() : 0;
            const baseTime = existingExpiry > now ? existingExpiry : now;
            const extensionDays = billingCycle === 'annual' ? 365 : 30;
            proExpiresAt = new Date(baseTime + extensionDays * 24 * 60 * 60 * 1000);
          }

          await DataStore.upgradeUserPlan(user.id, {
            plan: 'pro',
            billingCycle,
            planExpiresAt: proExpiresAt,
            proExpiresAt,
            paymentProvider: 'stripe',
            providerCustomerId: customerId || (user as any).stripeCustomerId || '',
            providerSubscriptionId: subscriptionId || (user as any).stripeSubscriptionId || '',
            stripeCustomerId: customerId || (user as any).stripeCustomerId || '',
            stripeSubscriptionId: subscriptionId || (user as any).stripeSubscriptionId || '',
            subscriptionStatus: 'active',
            paymentFailedAt: null,
          });

          const amount = (invoice.amount_paid ?? invoice.total ?? 0) / 100;
          const currency = (invoice.currency || 'USD').toUpperCase();

          await DataStore.recordPayment({
            userId: user.id,
            userEmail: user.email || invoice.customer_email,
            amount,
            currency,
            provider: 'stripe',
            providerPaymentId: invoice.id || eventId,
            planId: 'pro',
            billingCycle,
            status: 'succeeded',
            metadata: {
              stripeEventId: eventId,
              eventType,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
            },
          });

          const recipientEmail = user.email || invoice.customer_email;
          if (recipientEmail && amount > 0) {
            sendEmail({
              to: recipientEmail,
              subject: 'JobMatch AI - Subscription Renewal Receipt 🧾',
              html: getPaymentReceiptEmailHtml({
                name: user.name || 'Valued Customer',
                amount,
                currency,
                planId: 'pro',
                transactionId: invoice.id || eventId,
              }),
              isDemo: Boolean(user.isDemo),
            }).catch((err) => {
              console.error('[Stripe Webhook] Failed to send renewal receipt email:', err);
            });
          }
        }
      } else if (eventType === 'customer.subscription.deleted') {
        const subscription = event.data?.object || {};
        const subscriptionId = subscription.id || '';
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id || '';
        const userId = subscription.metadata?.userId;

        const user = await resolveStripeUser({ userId, subscriptionId, customerId });
        if (user) {
          await DataStore.upgradeUserPlan(user.id, {
            plan: 'free',
            billingCycle: 'none',
            planExpiresAt: null,
            proExpiresAt: null,
            stripeCustomerId: customerId || (user as any).stripeCustomerId || '',
            stripeSubscriptionId: '',
            providerSubscriptionId: '',
            subscriptionStatus: 'canceled',
          });

          if (user.email) {
            sendEmail({
              to: user.email,
              subject: 'JobMatch AI - Your Pro Subscription Has Ended',
              html: getSubscriptionAlertEmailHtml({
                name: user.name || 'Valued Customer',
                type: 'subscription_ended',
              }),
              isDemo: Boolean(user.isDemo),
            }).catch((err) => {
              console.error('[Stripe Webhook] Failed to send subscription ended email:', err);
            });
          }
        }
      } else if (eventType === 'invoice.payment_failed') {
        const invoice = event.data?.object || {};
        const customerId =
          typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer?.id || '';
        const subscriptionId =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id || '';
        const userId =
          invoice.subscription_details?.metadata?.userId ||
          invoice.metadata?.userId ||
          invoice.lines?.data?.[0]?.metadata?.userId;

        const user = await resolveStripeUser({ userId, subscriptionId, customerId });
        if (user) {
          const existingRaw = (user as any).proExpiresAt || (user as any).planExpiresAt;
          const isAlreadyExpired =
            !existingRaw || new Date(existingRaw).getTime() <= Date.now();

          await DataStore.upgradeUserPlan(user.id, {
            plan: isAlreadyExpired ? 'free' : 'pro',
            billingCycle: isAlreadyExpired ? 'none' : ((user as any).billingCycle || 'monthly'),
            planExpiresAt: isAlreadyExpired ? null : existingRaw,
            proExpiresAt: isAlreadyExpired ? null : existingRaw,
            paymentProvider: 'stripe',
            stripeCustomerId: customerId || (user as any).stripeCustomerId || '',
            stripeSubscriptionId: subscriptionId || (user as any).stripeSubscriptionId || '',
            subscriptionStatus: 'past_due',
            paymentFailedAt: new Date(),
          });

          const recipientEmail = user.email || invoice.customer_email;
          if (recipientEmail) {
            sendEmail({
              to: recipientEmail,
              subject: 'Action Required: JobMatch Pro Payment Failed ⚠️',
              html: getSubscriptionAlertEmailHtml({
                name: user.name || 'Valued Customer',
                type: 'payment_failed',
              }),
              isDemo: Boolean(user.isDemo),
            }).catch((err) => {
              console.error('[Stripe Webhook] Failed to send payment failed email:', err);
            });
          }
        }
      }

      // Mark event as processed for idempotency
      await DataStore.recordPaymentEvent({
        eventId,
        provider: 'stripe',
        eventType,
        status: 'processed',
        payload: { id: event.id, type: event.type },
      });

      return NextResponse.json({ received: true }, { status: 200 });
    }

    let parsedBody: any = {};
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      parsedBody = {};
    }

    // ==========================================
    // 2. TEST WEBHOOK DISPATCHER (Non-production only)
    // ==========================================
    if (testHeader === 'true' || parsedBody.provider === 'test') {
      if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_TEST_WEBHOOKS) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Test webhooks are strictly disabled in production.' },
          { status: 403 }
        );
      }

      const {
        eventId = `test_evt_${Date.now()}`,
        userId,
        planId = 'pro',
        billingCycle = 'monthly',
        amount = getPlanPrice('pro', 'USD', 'monthly'),
        currency = 'USD',
      } = parsedBody;

      if (await DataStore.isEventProcessed(eventId)) {
        return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
      }

      if (userId) {
        const user = await DataStore.findUserById(userId);
        if (user) {
          if (planId === 'pro') {
            const now = Date.now();
            const existingRaw = (user as any).proExpiresAt || (user as any).planExpiresAt;
            const existingExpiry = existingRaw ? new Date(existingRaw).getTime() : 0;
            const baseTime = existingExpiry > now ? existingExpiry : now;
            const extensionDays = billingCycle === 'annual' ? 365 : 30;
            const proExpiresAt = new Date(baseTime + extensionDays * 24 * 60 * 60 * 1000);

            await DataStore.upgradeUserPlan(userId, {
              plan: 'pro',
              billingCycle,
              planExpiresAt: proExpiresAt,
              proExpiresAt,
              paymentProvider: 'stripe',
              providerCustomerId: 'cus_test',
              providerSubscriptionId: 'sub_test',
              stripeCustomerId: 'cus_test',
              stripeSubscriptionId: 'sub_test',
              subscriptionStatus: 'active',
              paymentFailedAt: null,
            });
          } else {
            const creditsToGrant = getPlanCredits(planId);
            if (typeof creditsToGrant === 'number' && creditsToGrant > 0) {
              await DataStore.incrementUserCredits(userId, creditsToGrant);
            }
          }

          await DataStore.recordPayment({
            userId,
            userEmail: user.email,
            amount,
            currency,
            provider: 'test',
            providerPaymentId: eventId,
            planId,
            billingCycle: planId === 'pro' ? billingCycle : 'none',
            status: 'succeeded',
          });

          if (user.email) {
            sendEmail({
              to: user.email,
              subject: 'JobMatch AI - Payment Receipt & Confirmation 🧾',
              html: getPaymentReceiptEmailHtml({
                name: user.name,
                amount,
                currency,
                planId,
                transactionId: eventId,
              }),
              isDemo: Boolean(user.isDemo),
            }).catch((err) => {
              console.error('[Test Webhook] Failed to send receipt email:', err);
            });
          }
        }
      }

      await DataStore.recordPaymentEvent({
        eventId,
        provider: 'test',
        eventType: 'test.payment.succeeded',
        status: 'processed',
        payload: parsedBody,
      });

      return NextResponse.json({ received: true, success: true }, { status: 200 });
    }

    // ==========================================
    // 3. PAYMOB WEBHOOK HANDLER
    // ==========================================
    const obj = parsedBody.obj || parsedBody;
    const hmacSecret = (process.env.PAYMOB_HMAC_SECRET || '').trim();

    // Requirement 1: If PAYMOB_HMAC_SECRET is not configured in production -> log error & return 500.
    // Even outside production, never allow unverified webhooks if secret is missing.
    if (!hmacSecret || isUnconfiguredEnvValue(hmacSecret)) {
      console.error('CRITICAL: PAYMOB_HMAC_SECRET is not configured in environment.');
      return NextResponse.json(
        {
          error: 'CONFIGURATION_ERROR',
          message: 'PAYMOB_HMAC_SECRET is not configured.',
        },
        { status: 500 }
      );
    }

    // Requirement 1 & 2: If HMAC is missing or invalid -> return 401 immediately before any processing.
    if (!paymobHmac || !verifyPaymobHmac(obj, paymobHmac, hmacSecret)) {
      return NextResponse.json(
        {
          error: 'INVALID_HMAC',
          message: 'Missing or invalid Paymob HMAC signature.',
        },
        { status: 401 }
      );
    }

    // Requirement 3: Never read userId or planId from query or body.
    // Look up stored Order by merchant_order_id (or reference).
    const merchantOrderId = String(
      obj.order?.merchant_order_id || obj.merchant_order_id || obj.reference || ''
    ).trim();

    if (!merchantOrderId) {
      return NextResponse.json(
        {
          error: 'MISSING_ORDER_REFERENCE',
          message: 'Paymob transaction is missing merchant_order_id.',
        },
        { status: 400 }
      );
    }

    const order = await DataStore.findOrderByReference(merchantOrderId);
    if (!order) {
      return NextResponse.json(
        {
          error: 'ORDER_NOT_FOUND',
          message: `Order not found for merchant_order_id: ${merchantOrderId}`,
        },
        { status: 404 }
      );
    }

    // Requirement 6: Idempotency - if Order is already 'paid', return 200 without activating again.
    if (order.status === 'paid') {
      return NextResponse.json(
        { received: true, duplicate: true, status: 'paid' },
        { status: 200 }
      );
    }

    const eventId = `paymob_tx_${obj.id || merchantOrderId}`;
    if (await DataStore.isEventProcessed(eventId)) {
      return NextResponse.json(
        { received: true, duplicate: true, status: order.status },
        { status: 200 }
      );
    }

    // Ensure Order is in awaiting_payment (or created) state
    if (order.status !== 'awaiting_payment' && order.status !== 'created') {
      return NextResponse.json(
        {
          error: 'INVALID_ORDER_STATUS',
          message: `Order ${order.reference} cannot be processed from status "${order.status}".`,
        },
        { status: 400 }
      );
    }

    // Requirement 4: Verify amount_cents and currency in payload match the stored Order.
    const expectedAmountCents = Math.round(Number(order.amount) * 100);
    const actualAmountCents = Number(obj.amount_cents);
    const expectedCurrency = String(order.currency || 'EGP').toUpperCase();
    const actualCurrency = String(obj.currency || '').toUpperCase();

    if (
      !Number.isFinite(actualAmountCents) ||
      actualAmountCents !== expectedAmountCents ||
      actualCurrency !== expectedCurrency
    ) {
      await DataStore.recordPaymentEvent({
        eventId,
        provider: 'paymob',
        eventType: 'TRANSACTION',
        status: 'rejected',
        payload: {
          id: obj.id,
          merchantOrderId,
          expectedAmountCents,
          actualAmountCents,
          expectedCurrency,
          actualCurrency,
          reason: 'AMOUNT_OR_CURRENCY_MISMATCH',
        },
      });

      return NextResponse.json(
        {
          error: 'AMOUNT_OR_CURRENCY_MISMATCH',
          message: 'Transaction amount_cents or currency does not match the stored order.',
        },
        { status: 400 }
      );
    }

    // Check Paymob transaction success flag (not voided / not refunded / not pending)
    const isSuccessful =
      (obj.success === true || obj.success === 'true') &&
      obj.is_voided !== true &&
      obj.is_refunded !== true &&
      obj.pending !== true &&
      obj.error_occured !== true;

    if (!isSuccessful) {
      await DataStore.recordPaymentEvent({
        eventId,
        provider: 'paymob',
        eventType: 'TRANSACTION',
        status: 'rejected',
        payload: {
          id: obj.id,
          merchantOrderId,
          success: obj.success,
          reason: 'TRANSACTION_NOT_SUCCESSFUL',
        },
      });
      return NextResponse.json({ received: true, status: 'failed' }, { status: 200 });
    }

    // Requirement 5: Activate via DataStore.completeOrder (idempotent, uses lib/plans.ts credits/plan)
    const completion = await DataStore.completeOrder(order.id, {
      txid: String(obj.id || ''),
      actor: 'paymob_webhook',
      note: 'Activated via verified Paymob HMAC webhook',
    });

    if (completion.alreadyPaid) {
      return NextResponse.json(
        { received: true, duplicate: true, status: 'paid' },
        { status: 200 }
      );
    }

    await DataStore.recordPaymentEvent({
      eventId,
      provider: 'paymob',
      eventType: 'TRANSACTION',
      status: 'processed',
      payload: {
        id: obj.id,
        merchantOrderId,
        orderId: order.id,
        planId: order.planId,
        amount: order.amount,
        currency: order.currency,
      },
    });

    // Dispatch payment receipt email (non-blocking)
    const user = await DataStore.findUserById(order.userId);
    if (user?.email) {
      sendEmail({
        to: user.email,
        subject: 'إيصال دفع اشتراك JobMatch AI 🧾',
        html: getPaymentReceiptEmailHtml({
          name: user.name || 'عميلنا العزيز',
          amount: order.amount,
          currency: order.currency || 'EGP',
          planId: order.planId,
          transactionId: String(obj.id || order.reference),
          language: 'ar',
        }),
        isDemo: Boolean(user.isDemo),
      }).catch((err) => {
        console.error('[Paymob Webhook] Failed to send receipt email:', err);
      });
    }

    return NextResponse.json(
      {
        received: true,
        status: 'paid',
        orderId: order.id,
        reference: order.reference,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Webhook processing exception:', error);
    return NextResponse.json(
      { error: 'WEBHOOK_ERROR', message: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
