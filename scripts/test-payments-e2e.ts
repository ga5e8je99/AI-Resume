import { createCheckout, ProviderNotConfiguredError } from '../lib/payments';
import { verifyPaymobHmac } from '../lib/payments/paymob';
import { getPlanById, getPlanPrice, getPaygCredits } from '../lib/plans';
import DataStore from '../app/lib/datastore';
import { signToken } from '../app/lib/auth';
import { POST as checkoutPOST } from '../app/api/checkout/route';
import { GET as orderStatusGET } from '../app/api/orders/status/route';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✔ ${msg}`);
}

async function runPaymentTests() {
  console.log('============================================================');
  console.log('>>> RUNNING UNIFIED PAYMENT & WEBHOOK TEST SUITE <<<');
  console.log('============================================================\n');

  // Test 1: Plan catalog server-side price & credit single source of truth
  console.log('▶ [Test 1] Server-side price & credit enforcement from lib/plans.ts');
  const proPlan = getPlanById('pro');
  const paygPlan = getPlanById('payg');
  assert(!!proPlan && !!paygPlan, 'Pro and PAYG plans exist in server catalog');
  assert(getPlanPrice('pro', 'USD', 'monthly') === 9, 'Pro Monthly is $9');
  assert(getPlanPrice('pro', 'USD', 'annual') === 84, 'Pro Annual is $84');
  assert(getPlanPrice('pro', 'EGP', 'monthly') === 350, 'Pro Monthly is 350 EGP');
  assert(getPlanPrice('payg', 'USD') === 5, 'PAYG is $5 (no hardcoded $3 fallback)');
  assert(getPlanPrice('payg', 'EGP') === 199, 'PAYG is 199 EGP');
  assert(getPaygCredits() === 15, 'PAYG grants 15 credits');

  // Free plan checkout rejection
  try {
    await createCheckout({
      user: { id: 'usr_test', email: 'test@example.com' },
      planId: 'free',
      currency: 'USD',
    });
    assert(false, 'Should have rejected free plan checkout');
  } catch (err: any) {
    assert(err.message.includes('Free plan'), 'Free plan correctly rejected from checkout');
  }

  // Test 2: ProviderNotConfiguredError & HTTP 503 when keys are missing
  console.log('\n▶ [Test 2] ProviderNotConfiguredError & /api/checkout 503 enforcement');
  delete process.env.ALLOW_MOCK_PAYMENTS;
  try {
    await createCheckout({
      user: { id: 'usr_test', email: 'test@example.com' },
      planId: 'pro',
      currency: 'USD',
      billingCycle: 'monthly',
    });
    assert(false, 'Should throw ProviderNotConfiguredError when ALLOW_MOCK_PAYMENTS is not true');
  } catch (err: any) {
    assert(
      err instanceof ProviderNotConfiguredError && err.code === 'PROVIDER_NOT_CONFIGURED',
      'Throws ProviderNotConfiguredError when Stripe keys are missing and mock is disabled'
    );
  }

  // Even if ALLOW_MOCK_PAYMENTS='true', NODE_ENV === 'production' MUST forbid mock and return 503
  const prevNodeEnv = process.env.NODE_ENV;
  process.env.ALLOW_MOCK_PAYMENTS = 'true';
  (process.env as any).NODE_ENV = 'production';

  try {
    await createCheckout({
      user: { id: 'usr_test', email: 'test@example.com' },
      planId: 'payg',
      currency: 'EGP',
    });
    assert(false, 'Should throw ProviderNotConfiguredError in production even if ALLOW_MOCK_PAYMENTS=true');
  } catch (err: any) {
    assert(
      err instanceof ProviderNotConfiguredError && err.code === 'PROVIDER_NOT_CONFIGURED',
      'Production strictly blocks mock payments and throws ProviderNotConfiguredError'
    );
  }

  // Verify /api/checkout route returns HTTP 503 with { error: 'PROVIDER_NOT_CONFIGURED' }
  const checkoutUser = await DataStore.createUserAccount({
    name: 'Checkout 503 Tester',
    email: `checkout503_${Date.now()}@example.com`,
    password: 'password123',
    role: 'user',
  });
  const token = signToken({
    userId: checkoutUser.id,
    email: checkoutUser.email,
    name: checkoutUser.name,
    role: 'user',
  });
  const checkoutReq = new NextRequest('http://localhost:3000/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ planId: 'payg', currency: 'USD' }),
  });
  const checkoutRes = await checkoutPOST(checkoutReq);
  const checkoutBody = await checkoutRes.json();
  assert(checkoutRes.status === 503, `/api/checkout returns HTTP 503 when provider is unconfigured (got ${checkoutRes.status})`);
  assert(
    checkoutBody.error === 'PROVIDER_NOT_CONFIGURED',
    `/api/checkout returns { error: 'PROVIDER_NOT_CONFIGURED' } (got ${checkoutBody.error})`
  );

  (process.env as any).NODE_ENV = prevNodeEnv || 'development';
  process.env.ALLOW_MOCK_PAYMENTS = 'true';

  const usdCheckout = await createCheckout({
    user: { id: checkoutUser.id, email: checkoutUser.email },
    planId: 'pro',
    currency: 'USD',
    billingCycle: 'monthly',
  });
  assert(usdCheckout.provider === 'stripe', 'USD routes to Stripe Checkout when mock is explicitly enabled in non-prod');
  assert(!!usdCheckout.url, 'Stripe checkout returns valid URL');

  const egpCheckout = await createCheckout({
    user: { id: checkoutUser.id, email: checkoutUser.email },
    planId: 'pro',
    currency: 'EGP',
    billingCycle: 'monthly',
  });
  assert(egpCheckout.provider === 'paymob', 'EGP routes to Paymob when mock is explicitly enabled in non-prod');
  assert(!!egpCheckout.url, 'Paymob checkout returns valid URL');

  // Test 3: Paymob HMAC SHA512 Calculation & Verification
  console.log('\n▶ [Test 3] Paymob HMAC SHA512 signature verification');
  const secretKey = 'test_paymob_hmac_secret_key_12345';
  const samplePaymobData = {
    amount_cents: 15000,
    created_at: '2026-10-26T12:00:00.000Z',
    currency: 'EGP',
    error_occured: false,
    has_parent_transaction: false,
    id: 99887766,
    integration_id: 123456,
    is_3d_secure: true,
    is_auth: false,
    is_capture: false,
    is_refunded: false,
    is_standalone_payment: true,
    is_voided: false,
    order: { id: 554433 },
    owner: 100,
    pending: false,
    source_data: { pan: '2346', sub_type: 'MasterCard', type: 'card' },
    success: true,
  };

  // Generate valid HMAC using exact Paymob concatenation logic
  const fields = [
    samplePaymobData.amount_cents,
    samplePaymobData.created_at,
    samplePaymobData.currency,
    samplePaymobData.error_occured,
    samplePaymobData.has_parent_transaction,
    samplePaymobData.id,
    samplePaymobData.integration_id,
    samplePaymobData.is_3d_secure,
    samplePaymobData.is_auth,
    samplePaymobData.is_capture,
    samplePaymobData.is_refunded,
    samplePaymobData.is_standalone_payment,
    samplePaymobData.is_voided,
    samplePaymobData.order.id,
    samplePaymobData.owner,
    samplePaymobData.pending,
    samplePaymobData.source_data.pan,
    samplePaymobData.source_data.sub_type,
    samplePaymobData.source_data.type,
    samplePaymobData.success,
  ];
  const concatenated = fields.map((v) => (typeof v === 'boolean' ? (v ? 'true' : 'false') : String(v))).join('');
  const validHmac = crypto.createHmac('sha512', secretKey).update(concatenated).digest('hex');

  const isValid = verifyPaymobHmac(samplePaymobData, validHmac, secretKey);
  assert(isValid === true, 'Valid Paymob HMAC is verified successfully');

  const isInvalid = verifyPaymobHmac(samplePaymobData, 'tampered_invalid_hmac', secretKey);
  assert(isInvalid === false, 'Tampered Paymob HMAC is rejected');

  // Test 4: Webhook Processing & User Pro Upgrade Lifecycle
  console.log('\n▶ [Test 4] Webhook Pro upgrade and expiration calculation');
  const uniqueTag = Date.now();
  const createdUser = await DataStore.createUserAccount({
    name: 'Payment Tester',
    email: `pay_test_${uniqueTag}@example.com`,
    password: 'password123',
    role: 'user',
  });
  const testUserId = createdUser.id;

  // Simulate Pro Upgrade Webhook Event
  const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const upgradeSuccess = await DataStore.upgradeUserPlan(testUserId, {
    plan: 'pro',
    billingCycle: 'monthly',
    planExpiresAt: expiryDate,
    paymentProvider: 'stripe',
    providerCustomerId: 'cus_test_123',
    providerSubscriptionId: 'sub_test_123',
  });
  assert(upgradeSuccess === true, 'User plan upgraded to Pro in DataStore');

  const updatedUser = await DataStore.findUserById(testUserId);
  assert(updatedUser?.plan === 'pro', 'User plan is now "pro"');
  assert(updatedUser?.billingCycle === 'monthly', 'Billing cycle recorded as monthly');
  assert(!!updatedUser?.planExpiresAt, 'planExpiresAt recorded');

  // Test 5: Pay-As-You-Go Credit Increment ($inc: 15)
  console.log('\n▶ [Test 5] Pay-As-You-Go credit increment (3 -> 18)');
  const newCredits = await DataStore.incrementUserCredits(testUserId, 15);
  assert(newCredits === 18, `Credits correctly incremented from 3 to 18 (got: ${newCredits})`);

  const userAfterCredits = await DataStore.findUserById(testUserId);
  assert(userAfterCredits?.aiCredits === 18, 'User aiCredits is exactly 18 in datastore');

  // Test 6: Webhook Idempotency Check
  console.log('\n▶ [Test 6] Webhook Idempotency & Deduplication');
  const eventId = `evt_idempotent_test_${Date.now()}`;
  const firstProcessedCheck = await DataStore.isEventProcessed(eventId);
  assert(firstProcessedCheck === false, 'New event is not yet processed');

  await DataStore.recordPaymentEvent({
    eventId,
    provider: 'stripe',
    eventType: 'checkout.session.completed',
    payload: { id: eventId },
  });

  const secondProcessedCheck = await DataStore.isEventProcessed(eventId);
  assert(secondProcessedCheck === true, 'Event marked as processed');

  // Test 7: Payment Audit Log Recording
  console.log('\n▶ [Test 7] Payment Audit Log Recording');
  const paymentRecord = await DataStore.recordPayment({
    userId: testUserId,
    userEmail: 'test@example.com',
    amount: 9,
    currency: 'USD',
    provider: 'stripe',
    providerPaymentId: 'ch_test_123',
    planId: 'pro',
    billingCycle: 'monthly',
    status: 'succeeded',
  });
  assert(!!paymentRecord, 'Payment record saved');
  assert(paymentRecord.amount === 9, 'Payment amount logged accurately ($9)');
  assert(paymentRecord.status === 'succeeded', 'Payment status is "succeeded"');

  // Test 8: GET /api/orders/status auth, ownership, and strict non-sensitive shape
  console.log('\n▶ [Test 8] GET /api/orders/status auth & ownership enforcement');
  const orderRef = egpCheckout.reference!;
  assert(!!orderRef, 'Paymob checkout returned order reference');

  // 8a: Unauthenticated request -> 401
  const unauthStatusReq = new NextRequest(
    `http://localhost:3000/api/orders/status?reference=${encodeURIComponent(orderRef)}`,
    { method: 'GET' }
  );
  const unauthStatusRes = await orderStatusGET(unauthStatusReq);
  assert(unauthStatusRes.status === 401, 'Unauthenticated /api/orders/status returns 401');

  // 8b: Different user -> 403
  const otherToken = signToken({
    userId: testUserId,
    email: createdUser.email,
    name: createdUser.name,
    role: 'user',
  });
  const forbiddenStatusReq = new NextRequest(
    `http://localhost:3000/api/orders/status?reference=${encodeURIComponent(orderRef)}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${otherToken}` },
    }
  );
  const forbiddenStatusRes = await orderStatusGET(forbiddenStatusReq);
  assert(
    forbiddenStatusRes.status === 403,
    'Request by non-owner to /api/orders/status returns 403'
  );

  // 8c: Owner request -> 200 with strictly { status, planId, provider, amount, currency }
  const ownerStatusReq = new NextRequest(
    `http://localhost:3000/api/orders/status?reference=${encodeURIComponent(orderRef)}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const ownerStatusRes = await orderStatusGET(ownerStatusReq);
  const ownerStatusBody = await ownerStatusRes.json();
  assert(ownerStatusRes.status === 200, 'Owner /api/orders/status returns 200');
  const returnedKeys = Object.keys(ownerStatusBody).sort().join(',');
  assert(
    returnedKeys === 'amount,currency,planId,provider,status',
    `Response contains strictly { status, planId, provider, amount, currency } (got: ${returnedKeys})`
  );
  assert(ownerStatusBody.status === 'awaiting_payment', 'Initial order status is awaiting_payment');
  assert(ownerStatusBody.planId === 'pro', 'Order planId is pro');
  assert(ownerStatusBody.provider === 'paymob', 'Order provider is paymob');
  assert(ownerStatusBody.amount === 350, 'Order amount is 350');
  assert(ownerStatusBody.currency === 'EGP', 'Order currency is EGP');

  console.log('\n============================================================');
  console.log('>>> ALL 8 PAYMENT & WEBHOOK UNIT TESTS PASSED! <<<');
  console.log('============================================================');
}

runPaymentTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
