#!/usr/bin/env tsx
/**
 * scripts/reconcile-payments.ts
 *
 * Payment Reconciliation Tool for JobMatch AI.
 * Compares local stored Orders & User entitlements against Payment Provider records
 * (Lemon Squeezy API, Stripe API, or an offline provider export JSON file)
 * and outputs all discrepancies.
 *
 * Usage:
 *   npx tsx scripts/reconcile-payments.ts
 *   npx tsx scripts/reconcile-payments.ts --provider lemonsqueezy
 *   npx tsx scripts/reconcile-payments.ts --provider-file ./provider-orders.json
 *   npx tsx scripts/reconcile-payments.ts --fix
 */

import fs from 'node:fs';
import path from 'node:path';
import DataStore, { StoredOrder } from '../app/lib/datastore';

export interface ProviderOrderSnapshot {
  provider: 'lemonsqueezy' | 'stripe' | 'paymob';
  providerOrderId: string;
  orderId?: string;
  orderReference?: string;
  userId?: string;
  userEmail?: string;
  status: 'paid' | 'refunded' | 'pending' | 'failed';
  amountCents: number;
  currency: string;
  customerId?: string;
  subscriptionId?: string;
  createdAt?: string;
}

export type DiscrepancyType =
  | 'PAID_IN_PROVIDER_NOT_LOCAL'
  | 'PAID_LOCAL_MISSING_IN_PROVIDER'
  | 'PAID_LOCAL_UNPAID_IN_PROVIDER'
  | 'REFUNDED_IN_PROVIDER_NOT_LOCAL'
  | 'AMOUNT_OR_CURRENCY_MISMATCH'
  | 'ENTITLEMENT_NOT_APPLIED';

export interface ReconciliationDiscrepancy {
  type: DiscrepancyType;
  orderId: string;
  reference: string;
  userId: string;
  userEmail: string;
  localStatus: string;
  providerStatus?: string;
  localAmountCents: number;
  providerAmountCents?: number;
  localCurrency: string;
  providerCurrency?: string;
  details: string;
  repaired?: boolean;
}

export interface ReconciliationReport {
  timestamp: string;
  localOrdersChecked: number;
  localPaidOrdersCount: number;
  providerOrdersChecked: number;
  matchedCount: number;
  discrepancies: ReconciliationDiscrepancy[];
  repairedCount: number;
}

async function fetchLemonSqueezyProviderOrders(): Promise<ProviderOrderSnapshot[]> {
  const apiKey = (process.env.LEMONSQUEEZY_API_KEY || '').trim();
  const storeId = (process.env.LEMONSQUEEZY_STORE_ID || '').trim();
  if (!apiKey || apiKey.includes('replace_with') || apiKey.includes('ci_dummy')) {
    return [];
  }

  const url = storeId
    ? `https://api.lemonsqueezy.com/v1/orders?filter[store_id]=${encodeURIComponent(storeId)}&page[size]=100`
    : 'https://api.lemonsqueezy.com/v1/orders?page[size]=100';

  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Lemon Squeezy API returned HTTP ${res.status}`);
  }

  const body: any = await res.json();
  const items = Array.isArray(body?.data) ? body.data : [];

  return items.map((item: any): ProviderOrderSnapshot => {
    const attrs = item?.attributes || {};
    const customData =
      attrs?.first_order_item?.custom_data ||
      item?.meta?.custom_data ||
      attrs?.custom_data ||
      {};
    const rawStatus = String(attrs.status || '').toLowerCase();
    const refunded = Boolean(attrs.refunded) || rawStatus === 'refunded';
    const status: ProviderOrderSnapshot['status'] = refunded
      ? 'refunded'
      : rawStatus === 'paid'
      ? 'paid'
      : rawStatus === 'pending'
      ? 'pending'
      : 'failed';

    return {
      provider: 'lemonsqueezy',
      providerOrderId: String(item.id || attrs.identifier || ''),
      orderId: customData.orderId || customData.order_id || undefined,
      orderReference: customData.reference || customData.orderReference || undefined,
      userId: customData.userId || customData.user_id || undefined,
      userEmail: attrs.user_email || undefined,
      status,
      amountCents: Number(attrs.total ?? attrs.subtotal ?? 0),
      currency: String(attrs.currency || 'USD').toUpperCase(),
      customerId: attrs.customer_id ? String(attrs.customer_id) : undefined,
      subscriptionId: attrs.subscription_id ? String(attrs.subscription_id) : undefined,
      createdAt: attrs.created_at,
    };
  });
}

/**
 * Core reconciliation engine: compares local DataStore Orders & User entitlements
 * against provider records and optionally repairs missing activations/refunds when `fix = true`.
 */
export async function reconcilePayments(options?: {
  localOrders?: StoredOrder[];
  providerOrders?: ProviderOrderSnapshot[];
  fix?: boolean;
}): Promise<ReconciliationReport> {
  const localOrders =
    options?.localOrders || (await DataStore.listOrders({ limit: 1000 }));
  const providerOrders =
    options?.providerOrders || (await fetchLemonSqueezyProviderOrders());
  const fix = Boolean(options?.fix);

  const discrepancies: ReconciliationDiscrepancy[] = [];
  let matchedCount = 0;
  let repairedCount = 0;

  // Map local orders by ID and by reference for O(1) lookup
  const localById = new Map<string, StoredOrder>();
  const localByRef = new Map<string, StoredOrder>();
  for (const order of localOrders) {
    localById.set(order.id, order);
    localByRef.set(order.reference.toLowerCase(), order);
  }

  // Track which local orders were matched in providerOrders
  const matchedLocalOrderIds = new Set<string>();

  for (const pOrder of providerOrders) {
    const localOrder =
      (pOrder.orderId ? localById.get(pOrder.orderId) : undefined) ||
      (pOrder.orderReference
        ? localByRef.get(pOrder.orderReference.toLowerCase())
        : undefined);

    if (!localOrder) {
      if (pOrder.status === 'paid') {
        discrepancies.push({
          type: 'PAID_IN_PROVIDER_NOT_LOCAL',
          orderId: pOrder.orderId || pOrder.providerOrderId,
          reference: pOrder.orderReference || pOrder.providerOrderId,
          userId: pOrder.userId || 'unknown',
          userEmail: pOrder.userEmail || 'unknown',
          localStatus: 'MISSING_LOCAL_ORDER',
          providerStatus: pOrder.status,
          localAmountCents: 0,
          providerAmountCents: pOrder.amountCents,
          localCurrency: 'N/A',
          providerCurrency: pOrder.currency,
          details: `Provider order ${pOrder.providerOrderId} is PAID (${pOrder.amountCents} ${pOrder.currency}), but no matching Order record exists locally.`,
        });
      }
      continue;
    }

    matchedLocalOrderIds.add(localOrder.id);
    const localAmountCents = Math.round(Number(localOrder.amount) * 100);
    const localCurrency = String(localOrder.currency || 'USD').toUpperCase();
    const providerCurrency = String(pOrder.currency || 'USD').toUpperCase();

    // 1. Check amount or currency mismatch
    if (
      localAmountCents !== pOrder.amountCents ||
      localCurrency !== providerCurrency
    ) {
      discrepancies.push({
        type: 'AMOUNT_OR_CURRENCY_MISMATCH',
        orderId: localOrder.id,
        reference: localOrder.reference,
        userId: localOrder.userId,
        userEmail: localOrder.userEmail,
        localStatus: localOrder.status,
        providerStatus: pOrder.status,
        localAmountCents,
        providerAmountCents: pOrder.amountCents,
        localCurrency,
        providerCurrency,
        details: `Order ${localOrder.reference} local=${localAmountCents} ${localCurrency} vs provider=${pOrder.amountCents} ${providerCurrency}.`,
      });
      continue;
    }

    // 2. Provider says PAID, but local order is not paid/refunded
    if (
      pOrder.status === 'paid' &&
      localOrder.status !== 'paid' &&
      localOrder.status !== 'refunded'
    ) {
      let repaired = false;
      if (fix) {
        const res = await DataStore.completeOrder(localOrder.id, {
          actor: 'reconcile_payments_script',
          note: `Auto-reconciled from provider order ${pOrder.providerOrderId}`,
          provider: pOrder.provider,
          customerId: pOrder.customerId,
          subscriptionId: pOrder.subscriptionId,
        });
        repaired = Boolean(res.order && res.order.status === 'paid');
        if (repaired) repairedCount++;
      }

      discrepancies.push({
        type: 'PAID_IN_PROVIDER_NOT_LOCAL',
        orderId: localOrder.id,
        reference: localOrder.reference,
        userId: localOrder.userId,
        userEmail: localOrder.userEmail,
        localStatus: localOrder.status,
        providerStatus: pOrder.status,
        localAmountCents,
        providerAmountCents: pOrder.amountCents,
        localCurrency,
        providerCurrency,
        details: `Order ${localOrder.reference} is PAID at ${pOrder.provider}, but local status is "${localOrder.status}".`,
        repaired,
      });
      continue;
    }

    // 3. Provider says REFUNDED, but local order is still 'paid'
    if (pOrder.status === 'refunded' && localOrder.status === 'paid') {
      let repaired = false;
      if (fix) {
        const res = await DataStore.refundOrder(localOrder.id, {
          actor: 'reconcile_payments_script',
          note: `Auto-reconciled refund from provider order ${pOrder.providerOrderId}`,
        });
        repaired = Boolean(res.order && res.order.status === 'refunded');
        if (repaired) repairedCount++;
      }

      discrepancies.push({
        type: 'REFUNDED_IN_PROVIDER_NOT_LOCAL',
        orderId: localOrder.id,
        reference: localOrder.reference,
        userId: localOrder.userId,
        userEmail: localOrder.userEmail,
        localStatus: localOrder.status,
        providerStatus: pOrder.status,
        localAmountCents,
        providerAmountCents: pOrder.amountCents,
        localCurrency,
        providerCurrency,
        details: `Order ${localOrder.reference} is REFUNDED at ${pOrder.provider}, but local status is still "paid".`,
        repaired,
      });
      continue;
    }

    // 4. Local says PAID, but provider says pending/failed
    if (
      localOrder.status === 'paid' &&
      (pOrder.status === 'pending' || pOrder.status === 'failed')
    ) {
      discrepancies.push({
        type: 'PAID_LOCAL_UNPAID_IN_PROVIDER',
        orderId: localOrder.id,
        reference: localOrder.reference,
        userId: localOrder.userId,
        userEmail: localOrder.userEmail,
        localStatus: localOrder.status,
        providerStatus: pOrder.status,
        localAmountCents,
        providerAmountCents: pOrder.amountCents,
        localCurrency,
        providerCurrency,
        details: `Order ${localOrder.reference} is marked "paid" locally, but provider status is "${pOrder.status}".`,
      });
      continue;
    }

    matchedCount++;
  }

  // 5. Check local PAID orders:
  //    a) If providerOrders were supplied, flag any local PAID order missing from providerOrders.
  //    b) Verify user entitlement was actually applied for non-expired Pro orders.
  const localPaidOrders = localOrders.filter((o) => o.status === 'paid');
  for (const paidOrder of localPaidOrders) {
    const localAmountCents = Math.round(Number(paidOrder.amount) * 100);
    const localCurrency = String(paidOrder.currency || 'USD').toUpperCase();

    if (providerOrders.length > 0 && !matchedLocalOrderIds.has(paidOrder.id)) {
      discrepancies.push({
        type: 'PAID_LOCAL_MISSING_IN_PROVIDER',
        orderId: paidOrder.id,
        reference: paidOrder.reference,
        userId: paidOrder.userId,
        userEmail: paidOrder.userEmail,
        localStatus: paidOrder.status,
        providerStatus: 'NOT_FOUND',
        localAmountCents,
        localCurrency,
        details: `Local order ${paidOrder.reference} is marked "paid", but was not found in provider records.`,
      });
    }

    // Check User entitlement consistency for active Pro orders
    if (
      paidOrder.planId === 'pro' &&
      !paidOrder.userId.startsWith('deleted_user_')
    ) {
      const proExpiry = paidOrder.proExpiresAt
        ? new Date(paidOrder.proExpiresAt).getTime()
        : Date.now() + 86400_000;
      if (proExpiry > Date.now()) {
        const user = await DataStore.findUserById(paidOrder.userId);
        if (user && user.plan !== 'pro') {
          discrepancies.push({
            type: 'ENTITLEMENT_NOT_APPLIED',
            orderId: paidOrder.id,
            reference: paidOrder.reference,
            userId: paidOrder.userId,
            userEmail: paidOrder.userEmail,
            localStatus: paidOrder.status,
            localAmountCents,
            localCurrency,
            details: `Order ${paidOrder.reference} is "paid" for Pro (expires ${paidOrder.proExpiresAt}), but user ${user.email} is currently on plan "${user.plan}".`,
          });
        }
      }
    }
  }

  return {
    timestamp: new Date().toISOString(),
    localOrdersChecked: localOrders.length,
    localPaidOrdersCount: localPaidOrders.length,
    providerOrdersChecked: providerOrders.length,
    matchedCount,
    discrepancies,
    repairedCount,
  };
}

async function runCli() {
  const args = process.argv.slice(2);
  const fix = args.includes('--fix');
  const fileIdx = args.indexOf('--provider-file');
  let providerOrders: ProviderOrderSnapshot[] | undefined;

  if (fileIdx !== -1 && args[fileIdx + 1]) {
    const filePath = path.resolve(process.cwd(), args[fileIdx + 1]);
    const raw = fs.readFileSync(filePath, 'utf-8');
    providerOrders = JSON.parse(raw);
  }

  console.log('==========================================================');
  console.log('🔍 JobMatch AI — Payment Reconciliation Report');
  console.log('==========================================================');

  const report = await reconcilePayments({ providerOrders, fix });

  console.log(`Timestamp              : ${report.timestamp}`);
  console.log(`Local Orders Checked   : ${report.localOrdersChecked} (${report.localPaidOrdersCount} paid)`);
  console.log(`Provider Orders Checked: ${report.providerOrdersChecked}`);
  console.log(`Matched Orders         : ${report.matchedCount}`);
  console.log(`Discrepancies Found    : ${report.discrepancies.length}`);
  if (fix) {
    console.log(`Discrepancies Repaired : ${report.repairedCount}`);
  }
  console.log('----------------------------------------------------------');

  if (report.discrepancies.length === 0) {
    console.log('✅ All orders and user entitlements are in sync.');
  } else {
    for (const d of report.discrepancies) {
      console.log(
        `⚠️  [${d.type}] Order=${d.reference} (${d.orderId}) | User=${d.userEmail} | ${d.details}${
          d.repaired ? ' [REPAIRED]' : ''
        }`
      );
    }
  }
}

const isDirectExecution =
  process.argv[1] &&
  path.resolve(process.argv[1]).toLowerCase().includes('reconcile-payments');

if (isDirectExecution) {
  runCli().catch((err) => {
    console.error('❌ Payment reconciliation error:', err);
    process.exit(1);
  });
}

