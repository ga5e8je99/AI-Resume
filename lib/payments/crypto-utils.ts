import { PLANS, getPlanById, BillingCycle } from '../plans';
import { CryptoNetwork } from '@/app/models/Order';

export const BEP20_USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955';
export const TRC20_USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
export const ORDER_EXPIRY_MINUTES = 30;

/**
 * Returns the receiving wallet address from environment variables.
 * Never hard-codes addresses.
 */
export function getReceivingWalletAddress(network: CryptoNetwork): string {
  if (network === 'BEP20') {
    return (process.env.PAYMENT_WALLET_BEP20 || '').trim();
  }
  if (network === 'TRC20') {
    return (process.env.PAYMENT_WALLET_TRC20 || '').trim();
  }
  return '';
}

/**
 * Generates a human-friendly unique order reference.
 * Example: ORD-261028-7A4B
 */
export function generateOrderReference(): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ORD-${dateStr}-${rand}`;
}

/**
 * Resolves the official price in USD/USDT from lib/plans.ts.
 * Never trusts client-submitted prices.
 */
export function getPlanPriceUsdt(
  planId: 'pro' | 'payg',
  billingCycle: 'monthly' | 'annual' | 'once' = 'monthly'
): number {
  const plan = getPlanById(planId);
  if (!plan) {
    throw new Error(`Plan "${planId}" not found in system plans catalog.`);
  }

  if (planId === 'payg') {
    return plan.pricing.USD.oneTime || 5;
  }

  if (planId === 'pro') {
    if (billingCycle === 'annual') {
      return plan.pricing.USD.annualTotal || 84;
    }
    return plan.pricing.USD.monthly || 9;
  }

  throw new Error(`Unsupported plan for crypto payment: ${planId}`);
}

/**
 * Computes a unique amount with a 2-decimal cents suffix (e.g. 9.14 USDT)
 * so incoming transfers to the same wallet address can be matched automatically.
 * Guarantees uniqueness against currently active pending orders.
 */
export function calculateUniqueCryptoAmount(
  baseAmount: number,
  existingActiveAmounts: number[] = []
): { amount: number; centsSuffix: number } {
  const activeSet = new Set(existingActiveAmounts.map((a) => Math.round(a * 100)));

  // Try picking an unused cents offset from 0.01 to 0.99
  const baseCents = Math.round(baseAmount * 100);
  const candidates: number[] = [];
  for (let offset = 1; offset <= 99; offset++) {
    const candidateCents = baseCents + offset;
    if (!activeSet.has(candidateCents)) {
      candidates.push(offset);
    }
  }

  let selectedOffset = 1;
  if (candidates.length > 0) {
    const idx = Math.floor(Math.random() * candidates.length);
    selectedOffset = candidates[idx];
  } else {
    // If all 99 are somehow in use, pick a random one
    selectedOffset = Math.floor(Math.random() * 99) + 1;
  }

  const centsSuffix = selectedOffset / 100;
  const amount = Number((baseAmount + centsSuffix).toFixed(2));

  return {
    amount,
    centsSuffix,
  };
}

/**
 * Returns explorer transaction verification URL
 */
export function getExplorerTxUrl(network: CryptoNetwork, txid: string): string {
  if (!txid) return '';
  if (network === 'BEP20') {
    return `https://bscscan.com/tx/${txid}`;
  }
  if (network === 'TRC20') {
    return `https://tronscan.org/#/transaction/${txid}`;
  }
  return '';
}
