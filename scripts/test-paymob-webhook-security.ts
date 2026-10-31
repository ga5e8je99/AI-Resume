import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { POST as paymentWebhookPOST } from '../app/api/webhooks/payment/route';
import DataStore from '../app/lib/datastore';
import { getPlanCredits, getPlanPrice } from '../lib/plans';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✔ ${message}`);
}

function computePaymobHmac(obj: Record<string, any>, secret: string): string {
  const fields = [
    obj.amount_cents,
    obj.created_at,
    obj.currency,
    obj.error_occured,
    obj.has_parent_transaction,
    obj.id,
    obj.integration_id,
    obj.is_3d_secure,
    obj.is_auth,
    obj.is_capture,
    obj.is_refunded,
    obj.is_standalone_payment,
    obj.is_voided,
    obj.order?.id ?? obj.order,
    obj.owner,
    obj.pending,
    obj.source_data?.pan ?? '',
    obj.source_data?.sub_type ?? '',
    obj.source_data?.type ?? '',
    obj.success,
  ];

  const concatenated = fields
    .map((val) => {
      if (val === undefined || val === null) return '';
      if (typeof val === 'boolean') return val ? 'true' : 'false';
      return String(val);
    })
    .join('');

  return crypto.createHmac('sha512', secret).update(concatenated).digest('hex');
}

function buildPaymobTransactionPayload({
  txId,
  merchantOrderId,
  amountCents,
  currency = 'EGP',
  extraBody = {},
}: {
  txId: number;
  merchantOrderId: string;
  amountCents: number;
  currency?: string;
  extraBody?: Record<string, any>;
}) {
  const obj = {
    id: txId,
    amount_cents: amountCents,
    created_at: '2026-10-31T01:00:00.000Z',
    currency,
    error_occured: false,
    has_parent_transaction: false,
    integration_id: 445566,
    is_3d_secure: true,
    is_auth: false,
    is_capture: false,
    is_refunded: false,
    is_standalone_payment: true,
    is_voided: false,
    order: {
      id: 778899,
      merchant_order_id: merchantOrderId,
    },
    owner: 101,
    pending: false,
    source_data: {
      pan: '2346',
      sub_type: 'MasterCard',
      type: 'card',
    },
    success: true,
  };

  return {
    type: 'TRANSACTION',
    obj,
    ...extraBody,
  };
}

async function runPaymobWebhookSecurityTests() {
  console.log('==================================================================');
  console.log('>>> RUNNING PAYMOB WEBHOOK SECURITY & IDEMPOTENCY TEST SUITE <<<');
  console.log('==================================================================\n');

  const hmacSecret = 'test_paymob_hmac_secret_production_grade_998877';
  process.env.PAYMOB_HMAC_SECRET = hmacSecret;

  // Create test user (starts with 3 free AI credits)
  const tag = Date.now();
  const user = await DataStore.createUserAccount({
    name: 'Paymob Security Tester',
    email: `paymob_sec_${tag}@example.com`,
    password: 'Password123!',
    role: 'user',
  });
  const initialCredits = user.aiCredits ?? 3;
  assert(initialCredits === 3, `Test user initialized with ${initialCredits} credits`);

  // Create a second "attacker" user to verify query/body userId injection is ignored
  const attackerUser = await DataStore.createUserAccount({
    name: 'Attacker User',
    email: `attacker_${tag}@example.com`,
    password: 'Password123!',
    role: 'user',
  });

  // Create a stored Order in awaiting_payment status for PAYG (199 EGP / 15 credits)
  const paygPriceEgp = getPlanPrice('payg', 'EGP');
  const expectedAmountCents = Math.round(paygPriceEgp * 100);
  const rawPlanCredits = getPlanCredits('payg');
  const expectedCreditsToGrant = typeof rawPlanCredits === 'number' ? rawPlanCredits : 0;
  const merchantOrderId = `jm_${user.id}_${tag}`;

  const order = await DataStore.createOrder({
    userId: user.id,
    userEmail: user.email,
    planId: 'payg',
    billingCycle: 'once',
    baseAmount: paygPriceEgp,
    amount: paygPriceEgp,
    currency: 'EGP',
    method: 'paymob',
    network: 'paymob',
    reference: merchantOrderId,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });

  assert(order.status === 'awaiting_payment', 'Order created with status "awaiting_payment"');
  assert(order.amount === 199, `Order amount is 199 EGP from lib/plans.ts (got ${order.amount})`);

  // ------------------------------------------------------------------
  // Test 0: Missing PAYMOB_HMAC_SECRET in production -> 500
  // ------------------------------------------------------------------
  console.log('\n▶ [Test 0] Missing PAYMOB_HMAC_SECRET in production returns 500');
  const prevSecret = process.env.PAYMOB_HMAC_SECRET;
  const prevNodeEnv = process.env.NODE_ENV;
  delete process.env.PAYMOB_HMAC_SECRET;
  (process.env as any).NODE_ENV = 'production';

  const tx0Payload = buildPaymobTransactionPayload({
    txId: 100001,
    merchantOrderId,
    amountCents: expectedAmountCents,
  });
  const req0 = new NextRequest('http://localhost:3000/api/webhooks/payment', {
    method: 'POST',
    body: JSON.stringify(tx0Payload),
  });
  const res0 = await paymentWebhookPOST(req0);
  assert(res0.status === 500, `Missing PAYMOB_HMAC_SECRET returns HTTP 500 (got ${res0.status})`);

  process.env.PAYMOB_HMAC_SECRET = prevSecret;
  (process.env as any).NODE_ENV = prevNodeEnv;

  // ------------------------------------------------------------------
  // Test 1: Request WITHOUT hmac -> 401
  // ------------------------------------------------------------------
  console.log('\n▶ [Test 1] Webhook without hmac returns 401');
  const tx1Payload = buildPaymobTransactionPayload({
    txId: 100002,
    merchantOrderId,
    amountCents: expectedAmountCents,
  });
  const reqNoHmac = new NextRequest('http://localhost:3000/api/webhooks/payment', {
    method: 'POST',
    body: JSON.stringify(tx1Payload),
  });
  const resNoHmac = await paymentWebhookPOST(reqNoHmac);
  assert(resNoHmac.status === 401, `Webhook without hmac returns HTTP 401 (got ${resNoHmac.status})`);

  // ------------------------------------------------------------------
  // Test 2: Request with INVALID hmac -> 401
  // ------------------------------------------------------------------
  console.log('\n▶ [Test 2] Webhook with invalid hmac returns 401');
  const badHmac = 'a'.repeat(128);
  const reqBadHmac = new NextRequest(
    `http://localhost:3000/api/webhooks/payment?hmac=${badHmac}`,
    {
      method: 'POST',
      body: JSON.stringify(tx1Payload),
    }
  );
  const resBadHmac = await paymentWebhookPOST(reqBadHmac);
  assert(resBadHmac.status === 401, `Webhook with invalid hmac returns HTTP 401 (got ${resBadHmac.status})`);

  // ------------------------------------------------------------------
  // Test 3: Valid hmac + WRONG amount_cents -> 400 & PaymentEvent rejected
  // ------------------------------------------------------------------
  console.log('\n▶ [Test 3] Valid hmac + wrong amount_cents returns 400 and records rejected PaymentEvent');
  const wrongAmountTxId = Number(`20${tag.toString().slice(-6)}`);
  const wrongAmountPayload = buildPaymobTransactionPayload({
    txId: wrongAmountTxId,
    merchantOrderId,
    amountCents: 100, // 1 EGP instead of 199 EGP (19900 cents)
  });
  const validHmacForWrongAmount = computePaymobHmac(wrongAmountPayload.obj, hmacSecret);
  const reqWrongAmount = new NextRequest(
    `http://localhost:3000/api/webhooks/payment?hmac=${validHmacForWrongAmount}`,
    {
      method: 'POST',
      body: JSON.stringify(wrongAmountPayload),
    }
  );
  const resWrongAmount = await paymentWebhookPOST(reqWrongAmount);
  assert(
    resWrongAmount.status === 400,
    `Valid hmac with wrong amount_cents returns HTTP 400 (got ${resWrongAmount.status})`
  );

  const rejectedEvent = await DataStore.findPaymentEvent(`paymob_tx_${wrongAmountTxId}`);
  assert(!!rejectedEvent, 'PaymentEvent was recorded for mismatched amount');
  assert(
    rejectedEvent.status === 'rejected',
    `PaymentEvent status is "rejected" (got "${rejectedEvent?.status}")`
  );

  const userAfterWrongAmount = await DataStore.findUserById(user.id);
  assert(
    userAfterWrongAmount?.aiCredits === initialCredits,
    `User credits unchanged after rejected amount (${userAfterWrongAmount?.aiCredits})`
  );

  // ------------------------------------------------------------------
  // Test 4: Valid hmac + matching amount_cents & currency -> 200 & Order paid
  // (Also includes attacker userId/planId in query/body to verify they are ignored)
  // ------------------------------------------------------------------
  console.log('\n▶ [Test 4] Valid hmac + matching amount_cents & currency activates Order -> paid');
  const validTxId = Number(`30${tag.toString().slice(-6)}`);
  const validPayload = buildPaymobTransactionPayload({
    txId: validTxId,
    merchantOrderId,
    amountCents: expectedAmountCents,
    currency: 'EGP',
    extraBody: {
      // Attacker tries to hijack userId and planId via body
      userId: attackerUser.id,
      planId: 'pro',
    },
  });
  const validHmac = computePaymobHmac(validPayload.obj, hmacSecret);
  const reqValid = new NextRequest(
    `http://localhost:3000/api/webhooks/payment?hmac=${validHmac}&userId=${attackerUser.id}&planId=pro`,
    {
      method: 'POST',
      body: JSON.stringify(validPayload),
    }
  );
  const resValid = await paymentWebhookPOST(reqValid);
  const resValidBody = await resValid.json();

  assert(resValid.status === 200, `Valid webhook returns HTTP 200 (got ${resValid.status})`);
  assert(resValidBody.status === 'paid', `Response status is "paid" (got "${resValidBody.status}")`);

  const updatedOrder = await DataStore.findOrderByReference(merchantOrderId);
  assert(updatedOrder?.status === 'paid', `Stored Order status is now "paid" (got "${updatedOrder?.status}")`);

  const userAfterPaid = await DataStore.findUserById(user.id);
  const expectedCreditsAfterPaid = initialCredits + expectedCreditsToGrant;
  assert(
    userAfterPaid?.aiCredits === expectedCreditsAfterPaid,
    `Order owner credits incremented by ${expectedCreditsToGrant} from lib/plans.ts: ${initialCredits} -> ${userAfterPaid?.aiCredits}`
  );
  assert(
    userAfterPaid?.plan === 'free',
    `Order planId ("payg") respected over query/body ("pro"): user plan is "${userAfterPaid?.plan}"`
  );

  const attackerAfterPaid = await DataStore.findUserById(attackerUser.id);
  assert(
    attackerAfterPaid?.plan === 'free' && (attackerAfterPaid?.aiCredits ?? 3) === 3,
    'Attacker userId in query/body was completely ignored'
  );

  // ------------------------------------------------------------------
  // Test 5: Duplicate request (same request sent twice) -> 200 & NO second activation
  // ------------------------------------------------------------------
  console.log('\n▶ [Test 5] Duplicate request returns 200 without re-activating or adding extra credits');
  const reqDuplicate = new NextRequest(
    `http://localhost:3000/api/webhooks/payment?hmac=${validHmac}`,
    {
      method: 'POST',
      body: JSON.stringify(validPayload),
    }
  );
  const resDuplicate = await paymentWebhookPOST(reqDuplicate);
  const resDuplicateBody = await resDuplicate.json();

  assert(resDuplicate.status === 200, `Duplicate webhook returns HTTP 200 (got ${resDuplicate.status})`);
  assert(resDuplicateBody.duplicate === true, 'Duplicate webhook response has duplicate: true');

  const userAfterDuplicate = await DataStore.findUserById(user.id);
  assert(
    userAfterDuplicate?.aiCredits === expectedCreditsAfterPaid,
    `Credits NOT incremented a second time (remained ${userAfterDuplicate?.aiCredits})`
  );

  console.log('\n==================================================================');
  console.log('>>> ALL PAYMOB WEBHOOK SECURITY & IDEMPOTENCY TESTS PASSED! <<<');
  console.log('==================================================================');
}

runPaymobWebhookSecurityTests().catch((err) => {
  console.error(err);
  process.exit(1);
});

