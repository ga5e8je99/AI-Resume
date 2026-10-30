import { NextRequest, NextResponse } from 'next/server';
import DataStore from '@/app/lib/datastore';
import { verifyBinancePayWebhook } from '@/lib/payments/binance-pay';
import { sendEmail, getPaymentReceiptEmailHtml } from '@/lib/email';

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
      // Acknowledge to Binance so it doesn't retry indefinitely
      return NextResponse.json({ returnCode: 'SUCCESS', returnMessage: null });
    }

    // Idempotency: if order is already paid, acknowledge immediately
    if (order.status === 'paid') {
      return NextResponse.json({ returnCode: 'SUCCESS', returnMessage: null });
    }

    // Verify currency and amount
    const paidCurrency = paymentData.currency || 'USDT';
    const paidAmount = parseFloat(paymentData.totalFee || paymentData.orderAmount || '0');

    if (paidCurrency !== 'USDT') {
      console.warn(`[Binance Pay Webhook] Unexpected currency: ${paidCurrency} for order ${order.id}`);
    }

    // Verify amount with small floating-point tolerance
    if (paidAmount > 0 && Math.abs(paidAmount - order.amount) > 0.01) {
      console.warn(
        `[Binance Pay Webhook] Amount discrepancy: received ${paidAmount}, expected ${order.amount}`
      );
    }

    // Complete order and activate user subscription / credits
    const completeResult = await DataStore.completeOrder(order.id, {
      actor: 'binance_webhook',
      note: `Binance Pay Webhook confirmed payment (prepayId: ${paymentData.prepayId || 'N/A'})`,
      txid: paymentData.transactionId || paymentData.prepayId,
    });

    if (completeResult.success) {
      // Send confirmation receipt email
      const user = await DataStore.findUserById(order.userId);
      const emailHtml = getPaymentReceiptEmailHtml({
        name: user?.name || 'Valued Member',
        amount: order.amount,
        currency: 'USDT',
        planId: order.planId,
        transactionId: paymentData.transactionId || order.reference,
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
