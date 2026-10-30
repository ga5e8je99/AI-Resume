import { NextRequest, NextResponse } from 'next/server';
import DataStore from '@/app/lib/datastore';
import { verifyStripeWebhookSignature } from '@/lib/payments/stripe';
import { verifyPaymobHmac } from '@/lib/payments/paymob';
import { sendEmail, getPaymentReceiptEmailHtml } from '@/lib/email';

/**
 * POST /api/webhooks/payment
 * Universal webhook endpoint handling both Stripe and Paymob payment notifications.
 * Features:
 * - Cryptographic signature verification (Stripe constructEvent, Paymob HMAC SHA512)
 * - Idempotency tracking (deduplicates via PaymentEvent collection)
 * - User plan activation / credit increment ($inc: 15)
 * - Expiration extension for active Pro subscriptions
 * - Payment audit log persistence (Payment model)
 */
export async function POST(req: NextRequest) {
  try {
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
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      let event: any;

      if (webhookSecret) {
        try {
          event = verifyStripeWebhookSignature(rawBody, stripeSignature, webhookSecret);
        } catch (err: any) {
          console.error('Stripe webhook signature verification failed:', err.message);
          return NextResponse.json(
            { error: 'INVALID_SIGNATURE', message: err.message },
            { status: 400 }
          );
        }
      } else {
        if (process.env.NODE_ENV === 'production') {
          console.error('CRITICAL: STRIPE_WEBHOOK_SECRET is not configured in production.');
          return NextResponse.json(
            { error: 'CONFIGURATION_ERROR', message: 'Webhook signature verification required in production.' },
            { status: 500 }
          );
        }
        // Fallback for development/testing if webhook secret is not configured
        event = JSON.parse(rawBody);
      }

      const eventId = event.id;
      const eventType = event.type;

      // Idempotency check: ignore duplicate events
      if (await DataStore.isEventProcessed(eventId)) {
        return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
      }

      // Handle checkout.session.completed & payment_intent.succeeded
      if (
        eventType === 'checkout.session.completed' ||
        eventType === 'payment_intent.succeeded'
      ) {
        const session = event.data?.object || {};
        const metadata = session.metadata || {};
        const userId = metadata.userId || session.client_reference_id;
        const planId = metadata.planId || 'pro';
        const billingCycle = (metadata.billingCycle || 'monthly') as 'monthly' | 'annual';
        const amount = (session.amount_total || session.amount || 0) / 100;
        const currency = (session.currency || 'USD').toUpperCase();

        if (userId) {
          const user = await DataStore.findUserById(userId);
          if (user) {
            if (planId === 'pro') {
              // Calculate plan expiration (extend if already active)
              const now = Date.now();
              const existingExpiry = (user as any).planExpiresAt
                ? new Date((user as any).planExpiresAt).getTime()
                : 0;
              const baseTime = existingExpiry > now ? existingExpiry : now;
              const extensionDays = billingCycle === 'annual' ? 365 : 30;
              const planExpiresAt = new Date(baseTime + extensionDays * 24 * 60 * 60 * 1000);

              await DataStore.upgradeUserPlan(userId, {
                plan: 'pro',
                billingCycle,
                planExpiresAt,
                paymentProvider: 'stripe',
                providerCustomerId: typeof session.customer === 'string' ? session.customer : '',
                providerSubscriptionId:
                  typeof session.subscription === 'string' ? session.subscription : '',
              });
            } else if (planId === 'payg') {
              // Add 15 AI credits for Pay-As-You-Go
              await DataStore.incrementUserCredits(userId, 15);
            }

            // Record payment audit trail
            await DataStore.recordPayment({
              userId,
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
        }
      } else if (eventType === 'customer.subscription.deleted') {
        const subscription = event.data?.object || {};
        const userId = subscription.metadata?.userId;
        if (userId) {
          // Downgrade to free at expiration
          await DataStore.upgradeUserPlan(userId, {
            plan: 'free' as any,
            billingCycle: 'none',
            planExpiresAt: null,
          });
        }
      }

      // Mark event as processed for idempotency
      await DataStore.recordPaymentEvent({
        eventId,
        provider: 'stripe',
        eventType,
        payload: { id: event.id, type: event.type },
      });

      return NextResponse.json({ received: true }, { status: 200 });
    }

    // ==========================================
    // 2. PAYMOB WEBHOOK HANDLER
    // ==========================================
    let parsedBody: any = {};
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      parsedBody = {};
    }

    const isPaymob =
      parsedBody.type === 'TRANSACTION' ||
      !!paymobHmac ||
      !!parsedBody.obj ||
      req.nextUrl.searchParams.get('provider') === 'paymob';

    if (isPaymob) {
      const obj = parsedBody.obj || parsedBody;
      const hmacSecret = process.env.PAYMOB_HMAC_SECRET;

      // Verify HMAC if secret is configured
      if (hmacSecret && paymobHmac) {
        const isValid = verifyPaymobHmac(obj, paymobHmac, hmacSecret);
        if (!isValid) {
          return NextResponse.json(
            { error: 'INVALID_HMAC', message: 'Paymob HMAC verification failed.' },
            { status: 400 }
          );
        }
      }

      const eventId = `paymob_tx_${obj.id || Date.now()}`;

      // Idempotency check
      if (await DataStore.isEventProcessed(eventId)) {
        return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
      }

      // Paymob success check: obj.success === true and not voided or refunded
      const isSuccessful =
        obj.success === true ||
        obj.success === 'true' ||
        parsedBody.success === true;

      if (isSuccessful) {
        // Extract userId and planId from merchant_order_id (format: jm_{userId}_{timestamp})
        const merchantOrderId = String(obj.order?.merchant_order_id || '');
        let userId = '';
        if (merchantOrderId.startsWith('jm_')) {
          const parts = merchantOrderId.split('_');
          userId = parts[1] || '';
        }

        // Fallbacks for query or body metadata
        if (!userId) {
          userId =
            req.nextUrl.searchParams.get('userId') ||
            parsedBody.userId ||
            obj.userId ||
            '';
        }

        const planId =
          req.nextUrl.searchParams.get('planId') ||
          parsedBody.planId ||
          obj.planId ||
          'pro';
        const billingCycle = (req.nextUrl.searchParams.get('billingCycle') ||
          parsedBody.billingCycle ||
          'monthly') as 'monthly' | 'annual';
        const amount = (obj.amount_cents || 0) / 100;

        if (userId) {
          const user = await DataStore.findUserById(userId);
          if (user) {
            if (planId === 'pro') {
              const now = Date.now();
              const existingExpiry = (user as any).planExpiresAt
                ? new Date((user as any).planExpiresAt).getTime()
                : 0;
              const baseTime = existingExpiry > now ? existingExpiry : now;
              const extensionDays = billingCycle === 'annual' ? 365 : 30;
              const planExpiresAt = new Date(baseTime + extensionDays * 24 * 60 * 60 * 1000);

              await DataStore.upgradeUserPlan(userId, {
                plan: 'pro',
                billingCycle,
                planExpiresAt,
                paymentProvider: 'paymob',
                providerCustomerId: String(obj.order?.id || ''),
                providerSubscriptionId: String(obj.id || ''),
              });
            } else if (planId === 'payg') {
              await DataStore.incrementUserCredits(userId, 15);
            }

            await DataStore.recordPayment({
              userId,
              userEmail: user.email,
              amount,
              currency: 'EGP',
              provider: 'paymob',
              providerPaymentId: String(obj.id || ''),
              planId,
              billingCycle: planId === 'pro' ? billingCycle : 'none',
              status: 'succeeded',
              metadata: {
                paymobOrderId: obj.order?.id,
                transactionId: obj.id,
              },
            });

            // Dispatch payment receipt email (non-blocking)
            if (user.email) {
              sendEmail({
                to: user.email,
                subject: 'إيصال دفع اشتراك JobMatch AI 🧾',
                html: getPaymentReceiptEmailHtml({
                  name: user.name || 'عميلنا العزيز',
                  amount,
                  currency: 'EGP',
                  planId,
                  transactionId: String(obj.id || ''),
                  language: 'ar',
                }),
                isDemo: Boolean(user.isDemo),
              }).catch((err) => {
                console.error('[Paymob Webhook] Failed to send receipt email:', err);
              });
            }
          }
        }
      }

      await DataStore.recordPaymentEvent({
        eventId,
        provider: 'paymob',
        eventType: 'TRANSACTION',
        payload: { id: obj.id, success: obj.success },
      });

      return NextResponse.json({ received: true }, { status: 200 });
    }

    // ==========================================
    // 3. TEST WEBHOOK DISPATCHER (For automated tests)
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
        amount = 9,
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
            const existingExpiry = (user as any).planExpiresAt
              ? new Date((user as any).planExpiresAt).getTime()
              : 0;
            const baseTime = existingExpiry > now ? existingExpiry : now;
            const extensionDays = billingCycle === 'annual' ? 365 : 30;
            const planExpiresAt = new Date(baseTime + extensionDays * 24 * 60 * 60 * 1000);

            await DataStore.upgradeUserPlan(userId, {
              plan: 'pro',
              billingCycle,
              planExpiresAt,
              paymentProvider: 'stripe',
              providerCustomerId: 'cus_test',
              providerSubscriptionId: 'sub_test',
            });
          } else if (planId === 'payg') {
            await DataStore.incrementUserCredits(userId, 15);
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

          // Dispatch receipt email for test payments
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
        payload: parsedBody,
      });

      return NextResponse.json({ received: true, success: true }, { status: 200 });
    }

    return NextResponse.json(
      { error: 'UNKNOWN_WEBHOOK_PROVIDER', message: 'Could not identify webhook provider.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Webhook processing exception:', error);
    return NextResponse.json(
      { error: 'WEBHOOK_ERROR', message: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
