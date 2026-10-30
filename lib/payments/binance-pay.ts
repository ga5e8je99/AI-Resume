import crypto from 'crypto';
import { getPlanById } from '../plans';

export interface BinancePayConfig {
  apiKey: string; // Certificate SN / API Key
  secretKey: string;
  merchantId?: string;
  baseUrl: string;
}

export function getBinancePayConfig(): BinancePayConfig | null {
  const apiKey = (process.env.BINANCE_PAY_API_KEY || '').trim();
  const secretKey = (process.env.BINANCE_PAY_SECRET || '').trim();
  const merchantId = (process.env.BINANCE_PAY_MERCHANT_ID || '').trim();
  const baseUrl = (process.env.BINANCE_PAY_BASE_URL || 'https://bpay.binanceapi.com').trim();

  if (!apiKey || !secretKey) {
    return null;
  }

  return {
    apiKey,
    secretKey,
    merchantId,
    baseUrl,
  };
}

export function isBinancePayConfigured(): boolean {
  return getBinancePayConfig() !== null;
}

/**
 * Generates a random 32-character alphanumeric nonce string
 */
export function generateBinanceNonce(length = 32): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let nonce = '';
  for (let i = 0; i < length; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

/**
 * Official Binance Pay HMAC-SHA512 Request Signature Calculation
 * Format: timestamp + "\n" + nonce + "\n" + bodyString + "\n"
 * Converted to UPPERCASE hexadecimal.
 */
export function signBinancePayRequest(
  timestamp: string | number,
  nonce: string,
  bodyString: string,
  secretKey: string
): string {
  const payload = `${timestamp}\n${nonce}\n${bodyString}\n`;
  return crypto
    .createHmac('sha512', secretKey)
    .update(payload)
    .digest('hex')
    .toUpperCase();
}

export interface CreateBinancePayOrderParams {
  merchantTradeNo: string;
  orderAmount: number;
  planId: 'pro' | 'payg';
  planName?: string;
  returnUrl: string;
  cancelUrl: string;
  webhookUrl?: string;
}

export interface BinancePayOrderResult {
  success: boolean;
  prepayId?: string;
  checkoutUrl?: string;
  universalUrl?: string;
  qrContent?: string;
  errorMessage?: string;
  rawData?: any;
}

/**
 * Creates an order via Binance Pay Merchant API (v2)
 */
export async function createBinancePayOrder(
  params: CreateBinancePayOrderParams
): Promise<BinancePayOrderResult> {
  const config = getBinancePayConfig();
  if (!config) {
    return {
      success: false,
      errorMessage:
        'Binance Pay Merchant credentials (BINANCE_PAY_API_KEY / BINANCE_PAY_SECRET) are not configured.',
    };
  }

  const endpoint = '/binancepay/openapi/v2/order';
  const url = `${config.baseUrl}${endpoint}`;

  const timestamp = Date.now().toString();
  const nonce = generateBinanceNonce(32);

  const requestBody = {
    env: {
      terminalType: 'WEB',
    },
    merchantTradeNo: params.merchantTradeNo,
    orderAmount: Number(params.orderAmount.toFixed(2)),
    currency: 'USDT',
    goods: {
      goodsType: '02', // Virtual goods
      goodsCategory: 'Z000',
      referenceGoodsId: params.planId,
      goodsName: params.planName || `JobMatch AI Plan (${params.planId})`,
      goodsDetail: `Access to JobMatch AI ${params.planId} plan`,
    },
    returnUrl: params.returnUrl,
    cancelUrl: params.cancelUrl,
    webhookUrl: params.webhookUrl,
  };

  const bodyString = JSON.stringify(requestBody);
  const signature = signBinancePayRequest(timestamp, nonce, bodyString, config.secretKey);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'BinancePay-Timestamp': timestamp,
    'BinancePay-Nonce': nonce,
    'BinancePay-Certificate-SN': config.apiKey,
    'BinancePay-Signature': signature,
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: bodyString,
    });

    const data = await res.json().catch(() => ({}));

    if (data.status === 'SUCCESS' && data.data) {
      return {
        success: true,
        prepayId: data.data.prepayId,
        checkoutUrl: data.data.checkoutUrl,
        universalUrl: data.data.universalUrl,
        qrContent: data.data.qrContent,
        rawData: data.data,
      };
    }

    return {
      success: false,
      errorMessage: data.errorMessage || data.code || 'Binance Pay order creation rejected',
      rawData: data,
    };
  } catch (err: any) {
    return {
      success: false,
      errorMessage: err?.message || 'Network error connecting to Binance Pay API',
    };
  }
}

// In-memory cache for Binance Certificate Public Keys
const certificateCache: Map<string, { certPublic: string; cachedAt: number }> = new Map();

/**
 * Fetches public certificate from Binance Pay to verify webhooks
 */
export async function getBinanceCertificate(certSerial: string): Promise<string | null> {
  // 1. Check in-memory cache (valid for 12 hours)
  const cached = certificateCache.get(certSerial);
  if (cached && Date.now() - cached.cachedAt < 12 * 3600 * 1000) {
    return cached.certPublic;
  }

  // 2. Check if static public key is provided via env var
  const envPublicKey = process.env.BINANCE_PAY_PUBLIC_KEY;
  if (envPublicKey) {
    return envPublicKey;
  }

  // 3. Query Binance Certificates API
  const config = getBinancePayConfig();
  if (!config) return null;

  try {
    const endpoint = '/binancepay/openapi/certificates';
    const timestamp = Date.now().toString();
    const nonce = generateBinanceNonce(32);
    const bodyString = JSON.stringify({});
    const signature = signBinancePayRequest(timestamp, nonce, bodyString, config.secretKey);

    const res = await fetch(`${config.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'BinancePay-Timestamp': timestamp,
        'BinancePay-Nonce': nonce,
        'BinancePay-Certificate-SN': config.apiKey,
        'BinancePay-Signature': signature,
      },
      body: bodyString,
    });

    const data = await res.json().catch(() => ({}));
    if (data.status === 'SUCCESS' && Array.isArray(data.data)) {
      for (const cert of data.data) {
        if (cert.certSerial && cert.certPublic) {
          certificateCache.set(cert.certSerial, {
            certPublic: cert.certPublic,
            cachedAt: Date.now(),
          });
        }
      }
      const match = certificateCache.get(certSerial);
      return match ? match.certPublic : null;
    }
  } catch (err) {
    console.error('Failed to fetch Binance Pay certificates:', err);
  }

  return null;
}

/**
 * Verifies the incoming Binance Pay webhook notification signature
 * Payload = Timestamp + "\n" + Nonce + "\n" + rawBody + "\n"
 * Algorithm: RSA-SHA256 against Binance Public Certificate
 */
export async function verifyBinancePayWebhook(
  headers: {
    timestamp?: string | null;
    nonce?: string | null;
    certificateSn?: string | null;
    signature?: string | null;
  },
  rawBody: string
): Promise<boolean> {
  const { timestamp, nonce, certificateSn, signature } = headers;

  if (!timestamp || !nonce || !certificateSn || !signature) {
    return false;
  }

  // Retrieve public key for the certificate serial number
  const publicKey = await getBinanceCertificate(certificateSn);
  if (!publicKey) {
    console.warn(`Binance Pay certificate ${certificateSn} could not be resolved.`);
    // Fallback: If in non-production development with mock webhook, verify via HMAC secret
    if (process.env.NODE_ENV !== 'production' && process.env.BINANCE_PAY_SECRET) {
      const expectedHmac = signBinancePayRequest(
        timestamp,
        nonce,
        rawBody,
        process.env.BINANCE_PAY_SECRET
      );
      if (signature.toUpperCase() === expectedHmac) {
        return true;
      }
    }
    return false;
  }

  try {
    const payload = `${timestamp}\n${nonce}\n${rawBody}\n`;
    const decodedSignature = Buffer.from(signature, 'base64');

    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(payload);
    verify.end();

    return verify.verify(publicKey, decodedSignature);
  } catch (err) {
    console.error('Binance Pay webhook RSA verification error:', err);
    return false;
  }
}
