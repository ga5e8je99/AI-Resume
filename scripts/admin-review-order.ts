#!/usr/bin/env tsx
/**
 * scripts/admin-review-order.ts
 *
 * Admin CLI utility to inspect, manually activate (completeOrder), or refund
 * a stored Order when a customer paid at the provider but the webhook was missed.
 *
 * Usage:
 *   npx tsx scripts/admin-review-order.ts --order <orderId_or_reference>
 *   npx tsx scripts/admin-review-order.ts --order <orderId_or_reference> --action approve --note "Verified Lemon Squeezy receipt #12345"
 *   npx tsx scripts/admin-review-order.ts --order <orderId_or_reference> --action refund --note "Customer requested 14-day refund"
 */

import path from 'node:path';
import DataStore from '../app/lib/datastore';

async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const orderKey = getArg('--order');
  const action = (getArg('--action') || 'inspect').toLowerCase();
  const note = getArg('--note') || `Manual admin ${action} via scripts/admin-review-order.ts`;

  if (!orderKey) {
    console.error('Usage: npx tsx scripts/admin-review-order.ts --order <orderId|reference> [--action inspect|approve|refund] [--note "..."]');
    process.exit(1);
  }

  const order =
    (await DataStore.findOrderById(orderKey)) ||
    (await DataStore.findOrderByReference(orderKey));

  if (!order) {
    console.error(`❌ Order not found for ID/reference: ${orderKey}`);
    process.exit(1);
  }

  const user = await DataStore.findUserById(order.userId);

  console.log('==========================================================');
  console.log('🧾 Order Inspection Summary');
  console.log('==========================================================');
  console.log(`Order ID       : ${order.id}`);
  console.log(`Reference      : ${order.reference}`);
  console.log(`Status         : ${order.status}`);
  console.log(`Plan / Cycle   : ${order.planId} (${order.billingCycle})`);
  console.log(`Amount         : ${order.amount} ${order.currency}`);
  console.log(`Method         : ${order.method}`);
  console.log(`User           : ${order.userEmail} (${order.userId})`);
  console.log(`Current Plan   : ${user ? `${user.plan} (credits=${user.aiCredits})` : 'User not found'}`);
  console.log(`Created At     : ${order.createdAt}`);
  console.log(`Paid At        : ${order.paidAt || 'N/A'}`);
  console.log('----------------------------------------------------------');

  if (action === 'inspect') {
    console.log('ℹ️  Inspect mode complete. Pass --action approve or --action refund to modify.');
    return;
  }

  if (action === 'approve') {
    const result = await DataStore.completeOrder(order.id, {
      actor: 'admin_cli',
      note,
      provider: order.method,
    });
    console.log(
      result.alreadyPaid
        ? 'ℹ️  Order was already marked as paid (idempotent no-op).'
        : `✅ Order ${order.reference} successfully activated! User plan/credits updated.`
    );
    return;
  }

  if (action === 'refund') {
    const result = await DataStore.refundOrder(order.id, {
      actor: 'admin_cli',
      note,
    });
    console.log(
      result.alreadyRefunded
        ? 'ℹ️  Order was already marked as refunded.'
        : `✅ Order ${order.reference} marked as refunded and entitlements revoked.`
    );
    return;
  }

  console.error(`❌ Unknown --action "${action}". Supported: inspect | approve | refund`);
  process.exit(1);
}

const isDirectExecution =
  process.argv[1] &&
  path.resolve(process.argv[1]).toLowerCase().includes('admin-review-order');

if (isDirectExecution) {
  main().catch((err) => {
    console.error('❌ Admin order review error:', err);
    process.exit(1);
  });
}

