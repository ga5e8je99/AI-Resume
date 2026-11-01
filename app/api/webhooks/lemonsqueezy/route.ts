import { NextRequest, NextResponse } from 'next/server';
import DataStore from '@/app/lib/datastore';
import {
  lemonSqueezyProvider,
  WebhookSignatureError,
  NormalizedEvent,
} from '@/lib/payments';
import { applyRateLimit } from '@/lib/rate-limit';
import { reportOperationalAlert, recordServer5xxAndAlert } from '@/lib/sentry';
import {
  trackServerPaymentSucceeded,
  trackServerSubscriptionCancelled,
} from '@/lib/analytics';
import {
  sendEmail,
  getPaymentReceiptEmailHtml,
  getPaymentReceiptEmailSubject,
  getSubscriptionRenewedEmailHtml,
  getSubscriptionCancelledEmailHtml,
  getSubscriptionFailedEmailHtml,
  getSubscriptionAlertEmailHtml,
  getSubscriptionEmailSubject,
} from '@/lib/email';

async function resolveLemonUser(event: NormalizedEvent, orderUserId?: string) {
  const targetUserId = orderUserId || event.userId;
  if (targetUserId) {
    const byId = await DataStore.findUserById(targetUserId);
    if (byId) return byId;
  }
  if (event.subscriptionId) {
    const bySub = await DataStore.findUserByLemonSubscriptionId(event.subscriptionId);
    if (bySub) return bySub;
  }
  if (event.customerId) {
    const byCust = await DataStore.findUserByLemonCustomerId(event.customerId);
    if (byCust) return byCust;
  }
  if (event.userEmail) {
    const byEmail = await DataStore.findUserByEmail(event.userEmail);
    if (byEmail) return byEmail;
  }
  return null;
}

/**
 * POST /api/webhooks/lemonsqueezy
 * Processes Lemon Squeezy webhooks:
 * 1. Reads raw body and verifies X-Signature (HMAC-SHA256 with timingSafeEqual) -> 401 if invalid.
 * 2. Deduplicates events via PaymentEvent unique eventId.
 * 3. Validates stored Order amount & currency against webhook payload -> records 'rejected' on mismatch.
 * 4. Activates orders idempotently & atomically via DataStore.completeOrder (using credits/plans from lib/plans.ts).
 * 5. Handles order_created, subscription_created, subscription_updated, subscription_payment_success,
 *    subscription_cancelled, subscription_expired, and order_refunded.
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimit = await applyRateLimit(req, {
      limit: 300,
      ipLimit: 300,
      windowMs: 60 * 1000,
      keyPrefix: 'webhook_lemonsqueezy',
    });
    if (!rateLimit.allowed && rateLimit.errorResponse) {
      return rateLimit.errorResponse;
    }

    const rawBody = await req.text();

    let normalized: NormalizedEvent;
    try {
      normalized = await lemonSqueezyProvider.handleWebhook(rawBody, req.headers);
    } catch (err: any) {
      reportOperationalAlert({
        category: 'webhook_failure',
        severity: 'warning',
        title: 'Lemon Squeezy Webhook Verification/Parse Failed',
        message: err?.message || 'Webhook signature or payload rejected.',
        tags: { provider: 'lemonsqueezy', endpoint: '/api/webhooks/lemonsqueezy' },
      });
      if (
        err instanceof WebhookSignatureError ||
        err?.name === 'WebhookSignatureError' ||
        err?.code === 'INVALID_SIGNATURE' ||
        err?.statusCode === 401
      ) {
        return NextResponse.json(
          {
            error: 'INVALID_SIGNATURE',
            message: err?.message || 'Invalid Lemon Squeezy webhook signature.',
          },
          { status: 401 }
        );
      }
      return NextResponse.json(
        {
          error: 'INVALID_WEBHOOK_PAYLOAD',
          message: err?.message || 'Failed to parse webhook payload.',
        },
        { status: 400 }
      );
    }

    // Idempotency guard: if this exact eventId was already processed, do not re-process
    if (await DataStore.isEventProcessed(normalized.eventId)) {
      return NextResponse.json(
        { received: true, duplicate: true },
        { status: 200 }
      );
    }

    // Look up stored Order by orderId (or orderReference) from custom_data
    const lookupOrderKey = normalized.orderId || normalized.orderReference;
    const order = lookupOrderKey
      ? (await DataStore.findOrderById(lookupOrderKey)) ||
        (await DataStore.findOrderByReference(lookupOrderKey))
      : null;

    // Order is strictly required for activation and refund events
    if (
      (normalized.action === 'activate_order' || normalized.action === 'order_refunded') &&
      !order
    ) {
      await DataStore.recordPaymentEvent({
        eventId: normalized.eventId,
        provider: 'lemonsqueezy',
        eventType: normalized.eventType,
        status: 'rejected',
        payload: {
          orderId: normalized.orderId,
          reason: 'ORDER_NOT_FOUND',
        },
      });
      return NextResponse.json(
        {
          error: 'ORDER_NOT_FOUND',
          message: 'Stored order not found for webhook custom_data.orderId.',
        },
        { status: 404 }
      );
    }

    // Verify webhook amount and currency match the stored Order
    const requiresAmountValidation =
      normalized.action === 'activate_order' ||
      (order &&
        normalized.action === 'subscription_renewed' &&
        typeof normalized.amountCents === 'number');

    if (requiresAmountValidation && order) {
      const expectedAmountCents = Math.round(Number(order.amount) * 100);
      const actualAmountCents =
        typeof normalized.amountCents === 'number'
          ? normalized.amountCents
          : typeof normalized.amount === 'number'
          ? Math.round(normalized.amount * 100)
          : NaN;
      const expectedCurrency = String(order.currency || 'USD').toUpperCase();
      const actualCurrency = String(normalized.currency || '').toUpperCase();

      if (
        !Number.isFinite(actualAmountCents) ||
        actualAmountCents !== expectedAmountCents ||
        !actualCurrency ||
        actualCurrency !== expectedCurrency
      ) {
        await DataStore.recordPaymentEvent({
          eventId: normalized.eventId,
          provider: 'lemonsqueezy',
          eventType: normalized.eventType,
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

        if (order.status !== 'paid' && order.status !== 'refunded') {
          await DataStore.updateOrderStatus(order.id, 'rejected', {
            actor: 'lemonsqueezy_webhook',
            note: `Rejected: webhook amount/currency (${actualAmountCents} ${actualCurrency}) did not match stored order (${expectedAmountCents} ${expectedCurrency})`,
          });
        }

        reportOperationalAlert({
          category: 'webhook_failure',
          severity: 'error',
          title: 'Lemon Squeezy Webhook Amount/Currency Mismatch',
          message: `Order ${order.reference} expected ${expectedAmountCents} ${expectedCurrency}, got ${actualAmountCents} ${actualCurrency}.`,
          tags: { provider: 'lemonsqueezy', reason: 'AMOUNT_OR_CURRENCY_MISMATCH' },
          metadata: { orderId: order.id, reference: order.reference, expectedAmountCents, actualAmountCents },
        });

        return NextResponse.json(
          {
            error: 'AMOUNT_OR_CURRENCY_MISMATCH',
            status: 'rejected',
            message: 'Webhook amount or currency does not match the stored order.',
          },
          { status: 400 }
        );
      }
    }

    // =========================================================================
    // 1. ACTIVATE ORDER (order_created / subscription_created)
    // =========================================================================
    if (normalized.action === 'activate_order' && order) {
      const completion = await DataStore.completeOrder(order.id, {
        actor: 'lemonsqueezy_webhook',
        note: `Activated via Lemon Squeezy ${normalized.eventType}`,
        provider: 'lemonsqueezy',
        customerId: normalized.customerId,
        subscriptionId: normalized.subscriptionId,
      });

      // Ensure lemonCustomerId / lemonSubscriptionId are stored on User even if order was already paid
      if (normalized.customerId || normalized.subscriptionId) {
        const user = await DataStore.findUserById(order.userId);
        if (user) {
          await DataStore.upgradeUserPlan(user.id, {
            plan: ((user as any).plan || (order.planId === 'pro' ? 'pro' : 'free')) as any,
            billingCycle:
              (user as any).billingCycle && (user as any).billingCycle !== 'none'
                ? (user as any).billingCycle
                : order.planId === 'pro'
                ? order.billingCycle === 'annual'
                  ? 'annual'
                  : 'monthly'
                : 'none',
            planExpiresAt: (user as any).proExpiresAt || (user as any).planExpiresAt || null,
            proExpiresAt: (user as any).proExpiresAt || (user as any).planExpiresAt || null,
            paymentProvider: 'lemonsqueezy',
            lemonCustomerId: normalized.customerId || (user as any).lemonCustomerId || '',
            lemonSubscriptionId:
              normalized.subscriptionId || (user as any).lemonSubscriptionId || '',
          });
        }
      }

      await DataStore.recordPaymentEvent({
        eventId: normalized.eventId,
        provider: 'lemonsqueezy',
        eventType: normalized.eventType,
        status: 'processed',
        payload: {
          orderId: order.id,
          reference: order.reference,
          planId: order.planId,
          amount: order.amount,
          currency: order.currency,
          customerId: normalized.customerId,
          subscriptionId: normalized.subscriptionId,
        },
      });

      if (!completion.alreadyPaid) {
        trackServerPaymentSucceeded({
          userId: order.userId,
          plan: order.planId,
          provider: 'lemonsqueezy',
          amount: order.amount,
          currency: order.currency,
          billingCycle: order.billingCycle,
          orderReference: order.reference,
        });

        const orderUser = await DataStore.findUserById(order.userId);
        const recipientEmail = orderUser?.email || order.userEmail || normalized.userEmail;
        const userLang = (orderUser as any)?.language || (order as any)?.metadata?.lang || 'en';
        if (recipientEmail) {
          void sendEmail({
            to: recipientEmail,
            subject: getPaymentReceiptEmailSubject(userLang),
            html: getPaymentReceiptEmailHtml({
              name: orderUser?.name || 'Valued Customer',
              amount: order.amount,
              currency: order.currency,
              planId: order.planId,
              transactionId: order.reference || order.id,
              language: userLang,
            }),
            isDemo: Boolean((orderUser as any)?.isDemo),
          });
        }
      }

      return NextResponse.json(
        {
          received: true,
          status: 'paid',
          duplicate: Boolean(completion.alreadyPaid),
          orderId: order.id,
          reference: order.reference,
        },
        { status: 200 }
      );
    }

    // =========================================================================
    // 2. ORDER REFUNDED (order_refunded) -> Revoke credits or Pro plan
    // =========================================================================
    if (normalized.action === 'order_refunded' && order) {
      const refundResult = await DataStore.refundOrder(order.id, {
        actor: 'lemonsqueezy_webhook',
        note: 'Order refunded via Lemon Squeezy order_refunded webhook',
        eventId: normalized.eventId,
      });

      await DataStore.recordPaymentEvent({
        eventId: normalized.eventId,
        provider: 'lemonsqueezy',
        eventType: normalized.eventType,
        status: 'processed',
        payload: {
          orderId: order.id,
          reference: order.reference,
          planId: order.planId,
          refunded: true,
        },
      });

      return NextResponse.json(
        {
          received: true,
          status: 'refunded',
          duplicate: Boolean(refundResult.alreadyRefunded),
          orderId: order.id,
        },
        { status: 200 }
      );
    }

    // =========================================================================
    // 3. SUBSCRIPTION RENEWED (subscription_payment_success)
    // =========================================================================
    if (normalized.action === 'subscription_renewed') {
      // If linked order is still awaiting_payment, complete it via DataStore.completeOrder
      if (order && order.status !== 'paid' && order.status !== 'refunded') {
        const completion = await DataStore.completeOrder(order.id, {
          actor: 'lemonsqueezy_webhook',
          note: 'Activated via Lemon Squeezy subscription_payment_success',
          provider: 'lemonsqueezy',
          customerId: normalized.customerId,
          subscriptionId: normalized.subscriptionId,
        });

        await DataStore.recordPaymentEvent({
          eventId: normalized.eventId,
          provider: 'lemonsqueezy',
          eventType: normalized.eventType,
          status: 'processed',
          payload: {
            orderId: order.id,
            status: 'paid',
          },
        });

        return NextResponse.json(
          {
            received: true,
            status: 'paid',
            duplicate: Boolean(completion.alreadyPaid),
            orderId: order.id,
          },
          { status: 200 }
        );
      }

      const user = await resolveLemonUser(normalized, order?.userId);
      if (user) {
        const billingCycle =
          order?.billingCycle === 'annual' || (user as any).billingCycle === 'annual'
            ? 'annual'
            : 'monthly';
        const now = Date.now();
        const existingRaw = (user as any).proExpiresAt || (user as any).planExpiresAt;
        const existingExpiry = existingRaw ? new Date(existingRaw).getTime() : 0;
        const baseTime = existingExpiry > now ? existingExpiry : now;
        const extensionDays = billingCycle === 'annual' ? 365 : 30;
        const proExpiresAt =
          normalized.renewsAt && new Date(normalized.renewsAt).getTime() > now
            ? new Date(normalized.renewsAt)
            : new Date(baseTime + extensionDays * 24 * 60 * 60 * 1000);

        await DataStore.upgradeUserPlan(user.id, {
          plan: 'pro',
          billingCycle,
          planExpiresAt: proExpiresAt,
          proExpiresAt,
          paymentProvider: 'lemonsqueezy',
          providerCustomerId: normalized.customerId || (user as any).lemonCustomerId || '',
          providerSubscriptionId:
            normalized.subscriptionId || (user as any).lemonSubscriptionId || '',
          lemonCustomerId: normalized.customerId || (user as any).lemonCustomerId || '',
          lemonSubscriptionId:
            normalized.subscriptionId || (user as any).lemonSubscriptionId || '',
          subscriptionStatus: 'active',
          paymentFailedAt: null,
        });

        await DataStore.recordPayment({
          userId: user.id,
          userEmail: user.email,
          amount: normalized.amount ?? order?.amount ?? 0,
          currency: normalized.currency || order?.currency || 'USD',
          provider: 'lemonsqueezy',
          providerPaymentId: normalized.eventId,
          planId: 'pro',
          billingCycle,
          status: 'succeeded',
          metadata: {
            eventType: normalized.eventType,
            subscriptionId: normalized.subscriptionId,
            customerId: normalized.customerId,
          },
        });

        const recipientEmail = user.email || normalized.userEmail;
        const userLang = (user as any).language || 'en';
        if (recipientEmail) {
          void sendEmail({
            to: recipientEmail,
            subject: getSubscriptionEmailSubject('subscription_renewed', userLang),
            html: getSubscriptionRenewedEmailHtml({
              name: user.name || 'Valued Customer',
              amount: normalized.amount ?? order?.amount ?? 0,
              currency: normalized.currency || order?.currency || 'USD',
              renewsOrEndsAt: proExpiresAt.toISOString().split('T')[0],
              language: userLang,
            }),
            isDemo: Boolean((user as any).isDemo),
          });
        }
      }

      await DataStore.recordPaymentEvent({
        eventId: normalized.eventId,
        provider: 'lemonsqueezy',
        eventType: normalized.eventType,
        status: 'processed',
        payload: {
          userId: user?.id,
          subscriptionId: normalized.subscriptionId,
        },
      });

      return NextResponse.json({ received: true, status: 'renewed' }, { status: 200 });
    }

    // =========================================================================
    // 4. SUBSCRIPTION UPDATED (subscription_updated)
    // =========================================================================
    if (normalized.action === 'subscription_updated') {
      const user = await resolveLemonUser(normalized, order?.userId);
      if (user) {
        const rawStatus = (normalized.status || '').toLowerCase();
        const mappedStatus: 'active' | 'past_due' | 'canceled' | 'expired' =
          rawStatus === 'cancelled' || rawStatus === 'canceled'
            ? 'canceled'
            : rawStatus === 'expired'
            ? 'expired'
            : rawStatus === 'past_due' || rawStatus === 'unpaid'
            ? 'past_due'
            : 'active';

        const expiryCandidate =
          normalized.renewsAt ||
          normalized.endsAt ||
          (user as any).proExpiresAt ||
          (user as any).planExpiresAt ||
          null;

        await DataStore.upgradeUserPlan(user.id, {
          plan: mappedStatus === 'expired' ? 'free' : 'pro',
          billingCycle:
            mappedStatus === 'expired'
              ? 'none'
              : (user as any).billingCycle === 'annual'
              ? 'annual'
              : 'monthly',
          planExpiresAt: mappedStatus === 'expired' ? null : expiryCandidate,
          proExpiresAt: mappedStatus === 'expired' ? null : expiryCandidate,
          paymentProvider: 'lemonsqueezy',
          lemonCustomerId: normalized.customerId || (user as any).lemonCustomerId || '',
          lemonSubscriptionId:
            normalized.subscriptionId || (user as any).lemonSubscriptionId || '',
          subscriptionStatus: mappedStatus,
        });

        if (mappedStatus === 'past_due') {
          reportOperationalAlert({
            category: 'payment_failure',
            severity: 'warning',
            title: 'Subscription Renewal Payment Past Due',
            message: `Subscription ${normalized.subscriptionId || ''} for user ${user.id} transitioned to past_due.`,
            tags: { provider: 'lemonsqueezy', status: 'past_due' },
          });
          const recipientEmail = user.email || normalized.userEmail;
          const userLang = (user as any).language || 'en';
          if (recipientEmail) {
            void sendEmail({
              to: recipientEmail,
              subject: getSubscriptionEmailSubject('payment_failed', userLang),
              html: getSubscriptionFailedEmailHtml({
                name: user.name || 'Valued Customer',
                language: userLang,
              }),
              isDemo: Boolean((user as any).isDemo),
            });
          }
        }
      }

      await DataStore.recordPaymentEvent({
        eventId: normalized.eventId,
        provider: 'lemonsqueezy',
        eventType: normalized.eventType,
        status: 'processed',
        payload: {
          userId: user?.id,
          subscriptionId: normalized.subscriptionId,
          status: normalized.status,
        },
      });

      return NextResponse.json({ received: true, status: 'updated' }, { status: 200 });
    }

    // =========================================================================
    // 5. SUBSCRIPTION CANCELLED (subscription_cancelled)
    // =========================================================================
    if (normalized.action === 'subscription_cancelled') {
      const user = await resolveLemonUser(normalized, order?.userId);
      if (user) {
        const endsAtRaw =
          normalized.endsAt || (user as any).proExpiresAt || (user as any).planExpiresAt;
        const hasFutureAccess =
          endsAtRaw && !isNaN(new Date(endsAtRaw).getTime()) && new Date(endsAtRaw).getTime() > Date.now();

        await DataStore.upgradeUserPlan(user.id, {
          plan: hasFutureAccess ? 'pro' : 'free',
          billingCycle: hasFutureAccess
            ? (user as any).billingCycle === 'annual'
              ? 'annual'
              : 'monthly'
            : 'none',
          planExpiresAt: hasFutureAccess ? endsAtRaw : null,
          proExpiresAt: hasFutureAccess ? endsAtRaw : null,
          paymentProvider: 'lemonsqueezy',
          lemonCustomerId: normalized.customerId || (user as any).lemonCustomerId || '',
          lemonSubscriptionId:
            normalized.subscriptionId || (user as any).lemonSubscriptionId || '',
          subscriptionStatus: 'canceled',
        });

        trackServerSubscriptionCancelled({
          userId: user.id,
          plan: 'pro',
          provider: 'lemonsqueezy',
          reason: normalized.eventType || 'subscription_cancelled',
        });

        const recipientEmail = user.email || normalized.userEmail;
        const userLang = (user as any).language || 'en';
        if (recipientEmail) {
          void sendEmail({
            to: recipientEmail,
            subject: getSubscriptionEmailSubject('subscription_cancelled', userLang),
            html: getSubscriptionCancelledEmailHtml({
              name: user.name || 'Valued Customer',
              renewsOrEndsAt: endsAtRaw ? new Date(endsAtRaw).toISOString().split('T')[0] : undefined,
              language: userLang,
            }),
            isDemo: Boolean((user as any).isDemo),
          });
        }
      }

      await DataStore.recordPaymentEvent({
        eventId: normalized.eventId,
        provider: 'lemonsqueezy',
        eventType: normalized.eventType,
        status: 'processed',
        payload: {
          userId: user?.id,
          subscriptionId: normalized.subscriptionId,
        },
      });

      return NextResponse.json({ received: true, status: 'cancelled' }, { status: 200 });
    }

    // =========================================================================
    // 6. SUBSCRIPTION EXPIRED (subscription_expired)
    // =========================================================================
    if (normalized.action === 'subscription_expired') {
      const user = await resolveLemonUser(normalized, order?.userId);
      if (user) {
        await DataStore.upgradeUserPlan(user.id, {
          plan: 'free',
          billingCycle: 'none',
          planExpiresAt: null,
          proExpiresAt: null,
          paymentProvider: 'lemonsqueezy',
          lemonCustomerId: normalized.customerId || (user as any).lemonCustomerId || '',
          lemonSubscriptionId: '',
          providerSubscriptionId: '',
          subscriptionStatus: 'expired',
        });

        const recipientEmail = user.email || normalized.userEmail;
        const userLang = (user as any).language || 'en';
        if (recipientEmail) {
          void sendEmail({
            to: recipientEmail,
            subject: getSubscriptionEmailSubject('subscription_ended', userLang),
            html: getSubscriptionAlertEmailHtml({
              name: user.name || 'Valued Customer',
              type: 'subscription_ended',
              language: userLang,
            }),
            isDemo: Boolean((user as any).isDemo),
          });
        }
      }

      await DataStore.recordPaymentEvent({
        eventId: normalized.eventId,
        provider: 'lemonsqueezy',
        eventType: normalized.eventType,
        status: 'processed',
        payload: {
          userId: user?.id,
          subscriptionId: normalized.subscriptionId,
        },
      });

      return NextResponse.json({ received: true, status: 'expired' }, { status: 200 });
    }

    // Fallback for unrecognized events
    await DataStore.recordPaymentEvent({
      eventId: normalized.eventId,
      provider: 'lemonsqueezy',
      eventType: normalized.eventType || 'unknown',
      status: 'processed',
    });

    return NextResponse.json({ received: true, ignored: true }, { status: 200 });
  } catch (error: any) {
    console.error('Lemon Squeezy webhook error:', error);
    reportOperationalAlert({
      category: 'webhook_failure',
      severity: 'error',
      title: 'Unhandled Lemon Squeezy Webhook Exception',
      message: error?.message || 'Internal server error',
      tags: { provider: 'lemonsqueezy', endpoint: '/api/webhooks/lemonsqueezy' },
    });
    recordServer5xxAndAlert({
      endpoint: '/api/webhooks/lemonsqueezy',
      statusCode: 500,
      error,
      userAgent: req.headers.get('user-agent'),
    });
    return NextResponse.json(
      { error: 'WEBHOOK_ERROR', message: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

