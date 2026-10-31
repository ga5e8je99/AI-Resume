import { StoredOrder } from '@/app/lib/datastore';
import DataStore from '@/app/lib/datastore';
import {
  BEP20_USDT_CONTRACT,
  TRC20_USDT_CONTRACT,
  getReceivingWalletAddress,
} from './crypto-utils';

export interface VerificationResult {
  verified: boolean;
  status: 'paid' | 'pending_review' | 'rejected';
  error?: 'INVALID_TXID_FORMAT' | 'TXID_ALREADY_USED' | string;
  reason?: string;
  txDetails?: {
    txid: string;
    network: string;
    from?: string;
    to?: string;
    amount?: number;
    confirmations?: number;
    timestamp?: Date;
  };
}

export type FetchFunction = (
  url: string,
  options?: RequestInit
) => Promise<{ ok: boolean; status: number; json: () => Promise<any> }>;

/**
 * Normalizes a transaction hash (trim + lowercase)
 */
export function normalizeTxid(txid: string): string {
  if (!txid || typeof txid !== 'string') return '';
  return txid.trim().toLowerCase();
}

/**
 * Validates the syntax of a transaction hash per network:
 * - BEP20: 0x + 64 lowercase/uppercase hex characters
 * - TRC20: 64 lowercase/uppercase hex characters
 */
export function isValidTxidFormat(txid: string, network: 'BEP20' | 'TRC20'): boolean {
  const clean = normalizeTxid(txid);
  if (!clean) return false;
  if (network === 'BEP20') {
    // 0x followed by 64 hex characters
    return /^0x[0-9a-f]{64}$/.test(clean);
  }
  if (network === 'TRC20') {
    // 64 hex characters
    return /^[0-9a-f]{64}$/.test(clean);
  }
  return false;
}

/**
 * On-chain transaction verifier for BEP20 (BscScan API)
 */
export async function verifyBep20Tx(
  order: StoredOrder,
  txid: string,
  customFetch?: FetchFunction
): Promise<VerificationResult> {
  const cleanTxid = normalizeTxid(txid);
  const apiKey = (process.env.BSCSCAN_API_KEY || '').trim();
  const expectedWallet = getReceivingWalletAddress('BEP20').toLowerCase();

  if (!expectedWallet) {
    return {
      verified: false,
      status: 'pending_review',
      reason: 'Server PAYMENT_WALLET_BEP20 is not configured. Marked for manual review.',
    };
  }

  const doFetch = customFetch || (fetch as any);
  const url = `https://api.bscscan.com/api?module=account&action=tokentx&txhash=${cleanTxid}&apikey=${apiKey}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const res = await doFetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        verified: false,
        status: 'pending_review',
        reason: `BscScan returned HTTP ${res.status}. Transaction queued for manual review.`,
      };
    }

    const data = await res.json();
    if (data.status !== '1' || !Array.isArray(data.result) || data.result.length === 0) {
      // Transaction might still be pending in mempool or not yet indexed
      return {
        verified: false,
        status: 'pending_review',
        reason: data.message || 'Transaction not yet confirmed on BSC. Please retry in 1 minute.',
      };
    }

    // Find the token transfer matching USDT contract and our recipient wallet
    const transfer = data.result.find((t: any) => {
      const contractMatch =
        (t.contractAddress || '').toLowerCase() === BEP20_USDT_CONTRACT.toLowerCase();
      const toMatch = (t.to || '').toLowerCase() === expectedWallet;
      return contractMatch && toMatch;
    });

    if (!transfer) {
      return {
        verified: false,
        status: 'rejected',
        reason:
          'Transaction was found on BSC, but it is not a transfer of USDT to our designated receiving address.',
      };
    }

    // Check token decimals & amount: BSC-USD has 18 decimals
    const decimals = parseInt(transfer.tokenDecimal || '18', 10);
    const rawValue = BigInt(transfer.value || '0');
    // Convert expected amount to BigInt wei
    const expectedCents = Math.round(order.amount * 100);
    const expectedWei = BigInt(expectedCents) * BigInt(10 ** (decimals - 2));

    if (rawValue < expectedWei) {
      const actualAmount = Number(rawValue) / 10 ** decimals;
      return {
        verified: false,
        status: 'rejected',
        reason: `Underpaid: received ${actualAmount} USDT, but expected ${order.amount} USDT.`,
      };
    }

    // Check transaction timestamp within order window (-5 min to +20 min)
    const txTimestampSec = parseInt(transfer.timeStamp || '0', 10);
    const txDate = new Date(txTimestampSec * 1000);
    const orderCreated = new Date(order.createdAt).getTime() - 5 * 60 * 1000;
    const orderExpiry = new Date(order.expiresAt).getTime() + 20 * 60 * 1000;

    if (txDate.getTime() < orderCreated) {
      return {
        verified: false,
        status: 'rejected',
        reason: 'This transaction was executed before this order was created. Old TXIDs cannot be reused.',
      };
    }

    if (txDate.getTime() > orderExpiry) {
      return {
        verified: false,
        status: 'rejected',
        reason: 'This transaction was completed after the order expired.',
      };
    }

    const confirmations = parseInt(transfer.confirmations || '1', 10);

    return {
      verified: true,
      status: 'paid',
      txDetails: {
        txid: cleanTxid,
        network: 'BEP20',
        from: transfer.from,
        to: transfer.to,
        amount: Number(rawValue) / 10 ** decimals,
        confirmations,
        timestamp: txDate,
      },
    };
  } catch (err: any) {
    return {
      verified: false,
      status: 'pending_review',
      reason: `Explorer request timed out or failed (${err?.message || 'Network'}). Marked for review.`,
    };
  }
}

/**
 * On-chain transaction verifier for TRC20 (TronGrid API)
 */
export async function verifyTrc20Tx(
  order: StoredOrder,
  txid: string,
  customFetch?: FetchFunction
): Promise<VerificationResult> {
  const cleanTxid = normalizeTxid(txid);

  const apiKey = (process.env.TRONGRID_API_KEY || '').trim();
  const expectedWallet = getReceivingWalletAddress('TRC20').trim();

  if (!expectedWallet) {
    return {
      verified: false,
      status: 'pending_review',
      reason: 'Server PAYMENT_WALLET_TRC20 is not configured. Marked for manual review.',
    };
  }

  const doFetch = customFetch || (fetch as any);
  const url = `https://api.trongrid.io/v1/transactions/${cleanTxid}/events`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (apiKey) {
      headers['TRON-PRO-API-KEY'] = apiKey;
    }

    const res = await doFetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        verified: false,
        status: 'pending_review',
        reason: `TronGrid returned HTTP ${res.status}. Transaction queued for manual review.`,
      };
    }

    const data = await res.json();
    if (!data.success || !Array.isArray(data.data) || data.data.length === 0) {
      return {
        verified: false,
        status: 'pending_review',
        reason: 'Transaction not found or not yet confirmed on Tron. Please retry in 1 minute.',
      };
    }

    // Find the Transfer event
    const transferEvent = data.data.find((e: any) => {
      const isTransfer = e.event_name === 'Transfer';
      const contractMatch =
        (e.contract_address || '').toLowerCase() === TRC20_USDT_CONTRACT.toLowerCase();
      // Match recipient address
      const recipient = e.result?.to || e.result?.[1] || '';
      const toMatch = recipient.toLowerCase() === expectedWallet.toLowerCase();
      return isTransfer && contractMatch && toMatch;
    });

    if (!transferEvent) {
      return {
        verified: false,
        status: 'rejected',
        reason:
          'Transaction was found on TRON, but it is not a USDT transfer to our designated deposit address.',
      };
    }

    // Check TRC20 USDT Decimals: 6 decimals (1 USDT = 10^6 sun)
    const rawValStr = transferEvent.result?.value || transferEvent.result?.[2] || '0';
    const rawValue = BigInt(rawValStr);
    const expectedCents = Math.round(order.amount * 100);
    const expectedSun = BigInt(expectedCents) * BigInt(10 ** 4); // 6 - 2 = 4

    if (rawValue < expectedSun) {
      const actualAmount = Number(rawValue) / 10 ** 6;
      return {
        verified: false,
        status: 'rejected',
        reason: `Underpaid: received ${actualAmount} USDT, but expected ${order.amount} USDT.`,
      };
    }

    // Timestamp check
    const blockTimestamp = transferEvent.block_timestamp;
    const txDate = new Date(blockTimestamp);
    const orderCreated = new Date(order.createdAt).getTime() - 5 * 60 * 1000;
    const orderExpiry = new Date(order.expiresAt).getTime() + 20 * 60 * 1000;

    if (txDate.getTime() < orderCreated) {
      return {
        verified: false,
        status: 'rejected',
        reason: 'This transaction was executed before this order was created. Old TXIDs cannot be reused.',
      };
    }

    if (txDate.getTime() > orderExpiry) {
      return {
        verified: false,
        status: 'rejected',
        reason: 'This transaction was completed after the order expired.',
      };
    }

    return {
      verified: true,
      status: 'paid',
      txDetails: {
        txid: cleanTxid,
        network: 'TRC20',
        from: transferEvent.result?.from || transferEvent.result?.[0],
        to: transferEvent.result?.to || transferEvent.result?.[1],
        amount: Number(rawValue) / 10 ** 6,
        confirmations: 19, // TronGrid confirmed events have passed consensus
        timestamp: txDate,
      },
    };
  } catch (err: any) {
    return {
      verified: false,
      status: 'pending_review',
      reason: `Explorer request timed out or failed (${err?.message || 'Network'}). Marked for review.`,
    };
  }
}

let verifyLockQueue: Promise<any> = Promise.resolve();

async function withVerifyLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = verifyLockQueue;
  let release!: () => void;
  verifyLockQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await prev;
  try {
    return await fn();
  } finally {
    release();
  }
}

/**
 * Universal Crypto Verification Dispatcher
 * Verifies idempotency, format, and on-chain status atomically
 */
export async function verifyCryptoPayment(
  order: StoredOrder,
  txid: string,
  customFetch?: FetchFunction
): Promise<VerificationResult> {
  return withVerifyLock(async () => {
    const cleanTxid = normalizeTxid(txid);

    // 1. Format validation
    if (!isValidTxidFormat(cleanTxid, order.network as any)) {
      return {
        verified: false,
        status: 'rejected',
        error: 'INVALID_TXID_FORMAT',
        reason: `Invalid transaction hash format for ${order.network}. Please check and re-enter.`,
      };
    }

    // 2. Idempotency check: Make sure this TXID is not already linked to another order
    const existingWithTxid = await DataStore.findOrderByTxid(cleanTxid, order.network);
    if (existingWithTxid && existingWithTxid.id !== order.id) {
      return {
        verified: false,
        status: 'rejected',
        error: 'TXID_ALREADY_USED',
        reason: 'TXID_ALREADY_USED: This transaction hash has already been claimed for another order.',
      };
    }

    // 3. Dispatch to network-specific explorer
    let result: VerificationResult;
    if (order.network === 'BEP20') {
      result = await verifyBep20Tx(order, cleanTxid, customFetch);
    } else if (order.network === 'TRC20') {
      result = await verifyTrc20Tx(order, cleanTxid, customFetch);
    } else {
      return {
        verified: false,
        status: 'rejected',
        reason: `Unsupported crypto network: ${order.network}`,
      };
    }

    // 4. Atomically claim TXID on the order if verification succeeded so concurrent calls see it immediately
    if (result.verified && result.status === 'paid') {
      const claim = await DataStore.claimOrderTxid(order.id, cleanTxid);
      if (!claim.success && claim.error === 'TXID_ALREADY_USED') {
        return {
          verified: false,
          status: 'rejected',
          error: 'TXID_ALREADY_USED',
          reason: 'TXID_ALREADY_USED: This transaction hash has already been claimed for another order.',
        };
      }
    }

    return result;
  });
}
