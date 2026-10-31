import { NextRequest, NextResponse } from 'next/server';
import DataStore from '@/app/lib/datastore';
import { verifyBinancePayWebhook } from '@/lib/payments/binance-pay';
import { sendEmail, getPaymentReceiptEmailHtml } from '@/lib/email';
import { applyRateLimit } from '@/lib/rate-limit';

/**
 * POST /api/webhooks/binance-pay
 * Official signed webhook receiver for Binance Pay Merchant notifications.
 *
 * Security:
 * - Reconstructs payload: timestamp + \n + nonce + \n + rawBody + \n
 * - Cryptographically verifies RSA-SHA256 signature using Binance certificate public key
 * - Idempotent order completion
 * - Protects against replay attacks and verifies amount/currency
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimit = await applyRateLimit(req, {
      limit: 120,
      ipLimit: 120,
      windowMs: 60 * 1000,
      keyPrefix: 'webhook_binance_pay',
    });
    if (!rateLimit.allowed && rateLimit.errorResponse) {
      return rateLimit.errorResponse;
    }

    const rawBody = await req.text();

    const headers = {
      timestamp: req.headers.get('binancepay-timestamp'),
      nonce: req.headers.get('binancepay-nonce'),
      certificateSn: req.headers.get('binancepay-certificate-sn'),
      signature: req.headers.get('binancepay-signature'),
    };

    // Verify cryptographic signature
    const isValid = await verifyBinancePayWebhook(headers, rawBody);
    if (!isValid) {
      console.warn('[Binance Pay Webhook] Rejected: Invalid cryptographic signature');
      return NextResponse.json(
        { returnCode: 'FAIL', returnMessage: 'INVALID_SIGNATURE' },
        { status: 400 }
      );
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json(
        { returnCode: 'FAIL', returnMessage: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    const { bizStatus, data: rawData } = payload;

    // Process only successful payments
    if (bizStatus !== 'PAY_SUCCESS') {
      return NextResponse.json({ returnCode: 'SUCCESS', returnMessage: null });
    }

    // Binance Pay data can be either a nested JSON object or a stringified JSON
    let paymentData: any = {};
    if (typeof rawData === 'string') {
      try {
        paymentData = JSON.parse(rawData);
      } catch (err) {
        paymentData = {};
      }
    } else if (typeof rawData === 'object' && rawData !== null) {
      paymentData = rawData;
    }

    const merchantTradeNo =
      paymentData.merchantTradeNo || payload.merchantTradeNo || '';

    if (!merchantTradeNo) {
      console.warn('[Binance Pay Webhook] Missing merchantTradeNo in payload');
      return NextResponse.json(
        { returnCode: 'FAIL', returnMessage: 'MISSING_TRADE_NO' },
        { status: 400 }
      );
    }

    // Lookup order in database
    const order = await DataStore.findOrderByReference(merchantTradeNo);
    if (!order) {
      console.warn(`[Binance Pay Webhook] Order not found for reference: ${merchantTradeNo}`);
      return NextResponse.json(
        { returnCode: 'FAIL', returnMessage: 'ORDER_NOT_FOUND', error: 'ORDER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Idempotency: if order is already paid, acknowledge immediately
    if (order.status === 'paid') {
      return NextResponse.json({ returnCode: 'SUCCESS', returnMessage: null });
    }

    // Requirement 1: Strict currency & amount verification
    const expectedCurrency = (order.currency || 'USDT').toUpperCase();
    const rawCurrency = paymentData.currency ?? payload.currency;
    const paidCurrency =
      typeof rawCurrency === 'string' ? rawCurrency.trim().toUpperCase() : '';

    const rawAmount =
      paymentData.totalFee ??
      paymentData.orderAmount ??
      payload.totalFee ??
      payload.orderAmount;
    const paidAmount =
      rawAmount !== undefined && rawAmount !== null && rawAmount !== ''
        ? Number(rawAmount)
        : NaN;

    const expectedAmount =
      typeof order.amount === 'number' && order.amount > 0
        ? order.amount
        : order.baseAmount;

    const isCurrencyMismatch = !paidCurrency || paidCurrency !== expectedCurrency;
    // Small positive difference from cents-suffix is acceptable only if paidAmount >= expectedAmount
    const isUnderpaid =
      !Number.isFinite(paidAmount) || paidAmount < expectedAmount - 1e-6;

    if (isCurrencyMismatch || isUnderpaid) {
      const rejectReason = isCurrencyMismatch ? 'CURRENCY_MISMATCH' : 'AMOUNT_UNDERPAID';
      console.warn(
        `[Binance Pay Webhook] Rejected (${rejectReason}) for order ${order.id}: received ${paidAmount} ${paidCurrency}, expected >= ${expectedAmount} ${expectedCurrency}`
      );

      const rejectEventId = `binance_pay_reject_${order.reference}_${paymentData.transactionId || paymentData.prepayId || headers.nonce || Date.now()}`;
      await DataStore.recordPaymentEvent({
        eventId: rejectEventId,
        provider: 'binance_pay',
        eventType: bizStatus || 'PAY_SUCCESS',
        status: 'rejected',
        payload: {
          reason: rejectReason,
          orderId: order.id,
          reference: order.reference,
          expectedAmount,
          paidAmount: Number.isFinite(paidAmount) ? paidAmount : null,
          expectedCurrency,
          paidCurrency,
          raw: payload,
        },
      });

      return NextResponse.json(
        {
          returnCode: 'FAIL',
          returnMessage: rejectReason,
          error: rejectReason,
        },
        { status: 400 }
      );
    }

    const txidCandidate = paymentData.transactionId || paymentData.prepayId || undefined;

    // Complete order and activate user subscription / credits atomically
    const completeResult = await DataStore.completeOrder(order.id, {
      actor: 'binance_webhook',
      note: `Binance Pay Webhook confirmed payment (prepayId: ${paymentData.prepayId || 'N/A'}, amount: ${paidAmount} ${paidCurrency})`,
      txid: txidCandidate,
    });

    if (!completeResult.success) {
      const errCode = completeResult.error || 'ORDER_COMPLETION_FAILED';
      const rejectEventId = `binance_pay_err_${order.reference}_${txidCandidate || Date.now()}`;
      await DataStore.recordPaymentEvent({
        eventId: rejectEventId,
        provider: 'binance_pay',
        eventType: bizStatus || 'PAY_SUCCESS',
        status: 'rejected',
        payload: {
          reason: errCode,
          orderId: order.id,
          reference: order.reference,
          txid: txidCandidate,
        },
      });

      return NextResponse.json(
        {
          returnCode: 'FAIL',
          returnMessage: errCode,
          error: errCode,
        },
        { status: 400 }
      );
    }

    const processedEventId = `binance_pay_${order.reference}_${txidCandidate || headers.nonce || Date.now()}`;
    await DataStore.recordPaymentEvent({
      eventId: processedEventId,
      provider: 'binance_pay',
      eventType: bizStatus || 'PAY_SUCCESS',
      status: 'processed',
      payload: {
        orderId: order.id,
        reference: order.reference,
        paidAmount,
        paidCurrency,
        txid: txidCandidate,
      },
    });

    if (completeResult.success && !completeResult.alreadyPaid) {
      // Send confirmation receipt email
      const user = await DataStore.findUserById(order.userId);
      const emailHtml = getPaymentReceiptEmailHtml({
        name: user?.name || 'Valued Member',
        amount: order.amount,
        currency: 'USDT',
        planId: order.planId,
        transactionId: txidCandidate || order.reference,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
      });

      sendEmail({
        to: order.userEmail,
        subject: `Payment Receipt: JobMatch ${order.planId.toUpperCase()} Subscription Confirmation`,
        html: emailHtml,
        isDemo: user?.isDemo,
      }).catch((emailErr) => {
        console.error('[Binance Pay Webhook] Failed to send receipt email:', emailErr);
      });
    }

    return NextResponse.json({ returnCode: 'SUCCESS', returnMessage: null });
  } catch (error: any) {
    console.error('[Binance Pay Webhook] Exception:', error);
    return NextResponse.json(
      { returnCode: 'FAIL', returnMessage: error?.message || 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
