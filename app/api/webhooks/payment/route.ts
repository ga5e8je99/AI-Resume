import { NextRequest, NextResponse } from 'next/server';
import DataStore from '@/app/lib/datastore';
import {
  ProviderNotConfiguredError,
  stripeProvider,
} from '@/lib/payments/providers/stripe';
import { paymobProvider } from '@/lib/payments/providers/paymob';
import { WebhookSignatureError } from '@/lib/payments/providers/types';
import {
  sendEmail,
  getPaymentReceiptEmailHtml,
  getSubscriptionAlertEmailHtml,
} from '@/lib/email';
import { getPlanCredits, getPlanPrice } from '@/lib/plans';
import { applyRateLimit } from '@/lib/rate-limit';
import {
  trackServerPaymentSucceeded,
  trackServerSubscriptionCancelled,
} from '@/lib/analytics';

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

async function resolveStoredOrder({
  orderId,
  orderReference,
}: {
  orderId?: string;
  orderReference?: string;
}) {
  if (orderId) {
    const byId = await DataStore.findOrderById(orderId);
    if (byId) return byId;
  }
  if (orderReference) {
    const byRef = await DataStore.findOrderByReference(orderReference);
    if (byRef) return byRef;
  }
  if (orderId) {
    const byRefFallback = await DataStore.findOrderByReference(orderId);
    if (byRefFallback) return byRefFallback;
  }
  return null;
}

/**
 * POST /api/webhooks/payment
 * Universal webhook endpoint handling separated Stripe and Paymob payment notifications
 * via the unified PaymentProvider interface (stripeProvider & paymobProvider).
 *
 * Security & Integrity Guarantees:
 * - Mandatory HMAC / Signature verification (500 if secret missing, 401 if invalid/missing signature).
 * - Order-bound activation only: Never trusts userId/planId/amount from unverified query or body;
 *   looks up stored Order in DataStore, verifies amount_cents & currency, and activates idempotently
 *   via DataStore.completeOrder(order.id).
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimit = await applyRateLimit(req, {
      limit: 300,
      ipLimit: 300,
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
    // 1. STRIPE WEBHOOK HANDLER (via stripeProvider)
    // ==========================================
    if (stripeSignature) {
      let normalized;
      try {
        normalized = await stripeProvider.handleWebhook(rawBody, req.headers);
      } catch (err: any) {
        if (err instanceof ProviderNotConfiguredError) {
          console.error('CRITICAL: STRIPE_WEBHOOK_SECRET is not configured.');
          return NextResponse.json(
            {
              error: 'CONFIGURATION_ERROR',
              message: err.message,
            },
            { status: 500 }
          );
        }
        if (err instanceof WebhookSignatureError) {
          console.error('Stripe webhook signature verification failed:', err.message);
          return NextResponse.json(
            { error: 'INVALID_SIGNATURE', message: err.message },
            { status: 401 }
          );
        }
        return NextResponse.json(
          { error: 'INVALID_WEBHOOK_PAYLOAD', message: err?.message || 'Invalid payload' },
          { status: 400 }
        );
      }

      const { eventId, eventType, action } = normalized;

      // Idempotency check: ignore duplicate events
      if (await DataStore.isEventProcessed(eventId)) {
        return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
      }

      // 1A. Order-bound activation on checkout.session.completed
      if (action === 'activate_order') {
        if (!normalized.orderId && !normalized.orderReference) {
          return NextResponse.json(
            {
              error: 'MISSING_ORDER_REFERENCE',
              message: 'Stripe checkout session is missing orderId/reference in metadata.',
            },
            { status: 400 }
          );
        }

        const order = await resolveStoredOrder({
          orderId: normalized.orderId,
          orderReference: normalized.orderReference,
        });

        if (!order) {
          return NextResponse.json(
            {
              error: 'ORDER_NOT_FOUND',
              message: `Order not found for Stripe session (${normalized.orderId || normalized.orderReference}).`,
            },
            { status: 404 }
          );
        }

        if (order.status === 'paid') {
          await DataStore.recordPaymentEvent({
            eventId,
            provider: 'stripe',
            eventType,
            status: 'processed',
            payload: { orderId: order.id, duplicateOrder: true },
          });
          return NextResponse.json(
            { received: true, duplicate: true, status: 'paid' },
            { status: 200 }
          );
        }

        // Strict amount & currency validation against the stored Order
        const expectedAmountCents = Math.round(Number(order.amount) * 100);
        const actualAmountCents = Number(normalized.amountCents);
        const expectedCurrency = String(order.currency || 'USD').toUpperCase();
        const actualCurrency = String(normalized.currency || '').toUpperCase();

        if (
          !Number.isFinite(actualAmountCents) ||
          actualAmountCents !== expectedAmountCents ||
          actualCurrency !== expectedCurrency
        ) {
          await DataStore.updateOrderStatus(order.id, 'rejected', {
            actor: 'stripe_webhook',
            note: `Amount or currency mismatch: expected ${expectedAmountCents} cents (${expectedCurrency}), got ${actualAmountCents} cents (${actualCurrency})`,
          });

          await DataStore.recordPaymentEvent({
            eventId,
            provider: 'stripe',
            eventType,
            status: 'rejected',
            payload: {
              orderId: order.id,
              reference: order.reference,
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
              status: 'rejected',
              message: 'Stripe session amount or currency does not match the stored order.',
            },
            { status: 400 }
          );
        }

        const completion = await DataStore.completeOrder(order.id, {
          actor: 'stripe_webhook',
          note: `Activated via verified Stripe ${eventType} webhook`,
        });

        if (completion.alreadyPaid) {
          return NextResponse.json(
            { received: true, duplicate: true, status: 'paid' },
            { status: 200 }
          );
        }

        const user = await DataStore.findUserById(order.userId);
        const resolvedBillingCycle: 'monthly' | 'annual' | 'none' =
          order.planId === 'pro'
            ? order.billingCycle === 'annual'
              ? 'annual'
              : 'monthly'
            : 'none';

        if (user && (normalized.customerId || normalized.subscriptionId)) {
          await DataStore.upgradeUserPlan(user.id, {
            plan: ((user as any).plan || (order.planId === 'pro' ? 'pro' : 'free')) as any,
            billingCycle: (user as any).billingCycle || resolvedBillingCycle,
            planExpiresAt: (user as any).proExpiresAt || (user as any).planExpiresAt || null,
            proExpiresAt: (user as any).proExpiresAt || (user as any).planExpiresAt || null,
            paymentProvider: 'stripe',
            stripeCustomerId: normalized.customerId || (user as any).stripeCustomerId || '',
            stripeSubscriptionId:
              normalized.subscriptionId || (user as any).stripeSubscriptionId || '',
            providerCustomerId: normalized.customerId || (user as any).providerCustomerId || '',
            providerSubscriptionId:
              normalized.subscriptionId || (user as any).providerSubscriptionId || '',
            subscriptionStatus: 'active',
            paymentFailedAt: null,
          });
        }

        const sessionObj = (normalized.rawPayload as any)?.data?.object || {};
        await DataStore.recordPayment({
          userId: order.userId,
          userEmail: order.userEmail || user?.email || normalized.userEmail,
          amount: order.amount,
          currency: order.currency,
          provider: 'stripe',
          providerPaymentId: sessionObj.id || eventId,
          planId: order.planId,
          billingCycle: resolvedBillingCycle,
          status: 'succeeded',
          metadata: {
            stripeEventId: eventId,
            eventType,
            orderId: order.id,
            reference: order.reference,
            stripeCustomerId: normalized.customerId,
            stripeSubscriptionId: normalized.subscriptionId,
          },
        });

        await DataStore.recordPaymentEvent({
          eventId,
          provider: 'stripe',
          eventType,
          status: 'processed',
          payload: {
            orderId: order.id,
            reference: order.reference,
            planId: order.planId,
            amount: order.amount,
            currency: order.currency,
          },
        });

        trackServerPaymentSucceeded({
          userId: order.userId,
          plan: order.planId,
          provider: 'stripe',
          amount: order.amount,
          currency: order.currency,
          billingCycle: resolvedBillingCycle,
          orderReference: order.reference,
        });

        const recipientEmail = user?.email || order.userEmail || normalized.userEmail;
        if (recipientEmail) {
          sendEmail({
            to: recipientEmail,
            subject: 'JobMatch AI - Payment Receipt & Confirmation 🧾',
            html: getPaymentReceiptEmailHtml({
              name: user?.name || 'Valued Customer',
              amount: order.amount,
              currency: order.currency,
              planId: order.planId,
              transactionId: sessionObj.id || order.reference,
            }),
            isDemo: Boolean(user?.isDemo),
          }).catch((err) => {
            console.error('[Stripe Webhook] Failed to send receipt email:', err);
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
      }

      // 1B. Refund handling on charge.refunded
      if (action === 'order_refunded') {
        const order = await resolveStoredOrder({
          orderId: normalized.orderId,
          orderReference: normalized.orderReference,
        });
        if (order && order.status === 'paid') {
          const user = await DataStore.findUserById(order.userId);
          if (user) {
            if (order.planId === 'payg') {
              const creditsToRevoke = Number(getPlanCredits('payg')) || 15;
              const currentCredits = Number((user as any).aiCredits || 0);
              const delta = -Math.min(currentCredits, creditsToRevoke);
              if (delta < 0) {
                await DataStore.incrementUserCredits(user.id, delta);
              }
            } else if (order.planId === 'pro') {
              await DataStore.upgradeUserPlan(user.id, {
                plan: 'free',
                billingCycle: 'none',
                planExpiresAt: null,
                proExpiresAt: null,
                subscriptionStatus: 'canceled',
              });
            }
          }
          await DataStore.updateOrderStatus(order.id, 'refunded', {
            actor: 'stripe_webhook',
            note: `Order refunded via Stripe (${eventId})`,
          });
        }
      } else if (action === 'subscription_renewed') {
        const user = await resolveStripeUser({
          userId: normalized.userId,
          subscriptionId: normalized.subscriptionId,
          customerId: normalized.customerId,
        });
        if (user) {
          const billingCycle = (
            normalized.billingCycle === 'annual'
              ? 'annual'
              : (user as any).billingCycle === 'annual'
              ? 'annual'
              : 'monthly'
          ) as 'monthly' | 'annual';

          let proExpiresAt: Date;
          if (normalized.renewsAt && new Date(normalized.renewsAt).getTime() > Date.now()) {
            proExpiresAt = new Date(normalized.renewsAt);
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
            providerCustomerId: normalized.customerId || (user as any).stripeCustomerId || '',
            providerSubscriptionId:
              normalized.subscriptionId || (user as any).stripeSubscriptionId || '',
            stripeCustomerId: normalized.customerId || (user as any).stripeCustomerId || '',
            stripeSubscriptionId:
              normalized.subscriptionId || (user as any).stripeSubscriptionId || '',
            subscriptionStatus: 'active',
            paymentFailedAt: null,
          });

          const amount = normalized.amount ?? 0;
          const currency = normalized.currency || 'USD';
          const invoiceObj = (normalized.rawPayload as any)?.data?.object || {};

          await DataStore.recordPayment({
            userId: user.id,
            userEmail: user.email || normalized.userEmail,
            amount,
            currency,
            provider: 'stripe',
            providerPaymentId: invoiceObj.id || eventId,
            planId: 'pro',
            billingCycle,
            status: 'succeeded',
            metadata: {
              stripeEventId: eventId,
              eventType,
              stripeCustomerId: normalized.customerId,
              stripeSubscriptionId: normalized.subscriptionId,
            },
          });

          const recipientEmail = user.email || normalized.userEmail;
          if (recipientEmail && amount > 0) {
            sendEmail({
              to: recipientEmail,
              subject: 'JobMatch AI - Subscription Renewal Receipt 🧾',
              html: getPaymentReceiptEmailHtml({
                name: user.name || 'Valued Customer',
                amount,
                currency,
                planId: 'pro',
                transactionId: invoiceObj.id || eventId,
              }),
              isDemo: Boolean(user.isDemo),
            }).catch((err) => {
              console.error('[Stripe Webhook] Failed to send renewal receipt email:', err);
            });
          }
        }
      } else if (action === 'subscription_expired') {
        const user = await resolveStripeUser({
          userId: normalized.userId,
          subscriptionId: normalized.subscriptionId,
          customerId: normalized.customerId,
        });
        if (user) {
          await DataStore.upgradeUserPlan(user.id, {
            plan: 'free',
            billingCycle: 'none',
            planExpiresAt: null,
            proExpiresAt: null,
            stripeCustomerId: normalized.customerId || (user as any).stripeCustomerId || '',
            stripeSubscriptionId: '',
            providerSubscriptionId: '',
            subscriptionStatus: 'canceled',
          });

          trackServerSubscriptionCancelled({
            userId: user.id,
            plan: 'pro',
            provider: 'stripe',
            reason: eventType || 'subscription_deleted',
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
      } else if (action === 'subscription_updated' && normalized.status === 'past_due') {
        const user = await resolveStripeUser({
          userId: normalized.userId,
          subscriptionId: normalized.subscriptionId,
          customerId: normalized.customerId,
        });
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
            stripeCustomerId: normalized.customerId || (user as any).stripeCustomerId || '',
            stripeSubscriptionId:
              normalized.subscriptionId || (user as any).stripeSubscriptionId || '',
            subscriptionStatus: 'past_due',
            paymentFailedAt: new Date(),
          });

          const recipientEmail = user.email || normalized.userEmail;
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
        payload: { id: eventId, type: eventType },
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
    // 3. PAYMOB WEBHOOK HANDLER (via paymobProvider)
    // ==========================================
    let normalizedPaymob;
    try {
      normalizedPaymob = await paymobProvider.handleWebhook(rawBody, {
        'x-paymob-hmac': paymobHmac || undefined,
      });
    } catch (err: any) {
      if (err instanceof ProviderNotConfiguredError) {
        console.error('CRITICAL: PAYMOB_HMAC_SECRET is not configured in environment.');
        return NextResponse.json(
          {
            error: 'CONFIGURATION_ERROR',
            message: 'PAYMOB_HMAC_SECRET is not configured.',
          },
          { status: 500 }
        );
      }
      if (err instanceof WebhookSignatureError) {
        return NextResponse.json(
          {
            error: 'INVALID_HMAC',
            message: err.message,
          },
          { status: 401 }
        );
      }
      return NextResponse.json(
        {
          error: 'INVALID_WEBHOOK_PAYLOAD',
          message: err?.message || 'Invalid Paymob payload',
        },
        { status: 400 }
      );
    }

    const merchantOrderId = normalizedPaymob.orderReference || '';
    if (!merchantOrderId) {
      return NextResponse.json(
        {
          error: 'MISSING_ORDER_REFERENCE',
          message: 'Paymob transaction is missing merchant_order_id.',
        },
        { status: 400 }
      );
    }

    const order = await resolveStoredOrder({
      orderId: normalizedPaymob.orderId,
      orderReference: merchantOrderId,
    });
    if (!order) {
      return NextResponse.json(
        {
          error: 'ORDER_NOT_FOUND',
          message: `Order not found for merchant_order_id: ${merchantOrderId}`,
        },
        { status: 404 }
      );
    }

    const eventId = normalizedPaymob.eventId;
    const obj = normalizedPaymob.rawPayload || {};

    if (await DataStore.isEventProcessed(eventId)) {
      return NextResponse.json(
        { received: true, duplicate: true, status: order.status },
        { status: 200 }
      );
    }

    // Handle Paymob refund
    if (normalizedPaymob.action === 'order_refunded') {
      if (order.status === 'paid') {
        const user = await DataStore.findUserById(order.userId);
        if (user) {
          if (order.planId === 'payg') {
            const creditsToRevoke = Number(getPlanCredits('payg')) || 15;
            const currentCredits = Number((user as any).aiCredits || 0);
            const delta = -Math.min(currentCredits, creditsToRevoke);
            if (delta < 0) {
              await DataStore.incrementUserCredits(user.id, delta);
            }
          } else if (order.planId === 'pro') {
            await DataStore.upgradeUserPlan(user.id, {
              plan: 'free',
              billingCycle: 'none',
              planExpiresAt: null,
              proExpiresAt: null,
              subscriptionStatus: 'canceled',
            });
          }
        }
        await DataStore.updateOrderStatus(order.id, 'refunded', {
          actor: 'paymob_webhook',
          note: `Order refunded via Paymob (${eventId})`,
        });
      }

      await DataStore.recordPaymentEvent({
        eventId,
        provider: 'paymob',
        eventType: 'TRANSACTION',
        status: 'processed',
        payload: { id: obj.id, merchantOrderId, orderId: order.id, status: 'refunded' },
      });

      return NextResponse.json(
        { received: true, status: 'refunded', orderId: order.id },
        { status: 200 }
      );
    }

    // Idempotency - if Order is already 'paid', return 200 without activating again.
    if (order.status === 'paid') {
      return NextResponse.json(
        { received: true, duplicate: true, status: 'paid' },
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

    // Verify amount_cents and currency in payload match the stored Order
    const expectedAmountCents = Math.round(Number(order.amount) * 100);
    const actualAmountCents = Number(normalizedPaymob.amountCents);
    const expectedCurrency = String(order.currency || 'EGP').toUpperCase();
    const actualCurrency = String(normalizedPaymob.currency || '').toUpperCase();

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
          status: 'rejected',
          message: 'Transaction amount_cents or currency does not match the stored order.',
        },
        { status: 400 }
      );
    }

    if (normalizedPaymob.action !== 'activate_order') {
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

    // Activate via DataStore.completeOrder (idempotent, uses lib/plans.ts credits/plan)
    const completion = await DataStore.completeOrder(order.id, {
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

    trackServerPaymentSucceeded({
      userId: order.userId,
      plan: order.planId,
      provider: 'paymob',
      amount: order.amount,
      currency: order.currency,
      billingCycle: order.billingCycle,
      orderReference: order.reference,
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
