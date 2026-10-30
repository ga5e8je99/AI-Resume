import { createCheckout } from '../lib/payments';
import { verifyPaymobHmac } from '../lib/payments/paymob';
import { getPlanById } from '../lib/plans';
import DataStore from '../app/lib/datastore';
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

  // Test 1: Plan catalog server-side price protection
  console.log('▶ [Test 1] Server-side price enforcement');
  const proPlan = getPlanById('pro');
  assert(!!proPlan, 'Pro plan exists in server catalog');
  assert(proPlan!.pricing.USD.monthly === 9, 'Server verifies Pro is $9, not user-submitted price');
  assert(proPlan!.pricing.EGP.monthly === 350, 'Server verifies Pro is 350 EGP');

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

  // Test 2: Provider Dispatcher (Paymob for EGP, Stripe for USD)
  console.log('\n▶ [Test 2] Universal payment provider selection');
  const usdCheckout = await createCheckout({
    user: { id: 'usr_test', email: 'test@example.com' },
    planId: 'pro',
    currency: 'USD',
    billingCycle: 'monthly',
  });
  assert(usdCheckout.provider === 'stripe', 'USD routes to Stripe Checkout');
  assert(!!usdCheckout.url, 'Stripe checkout returns valid URL');

  const egpCheckout = await createCheckout({
    user: { id: 'usr_test', email: 'test@example.com' },
    planId: 'pro',
    currency: 'EGP',
    billingCycle: 'monthly',
  });
  assert(egpCheckout.provider === 'paymob', 'EGP routes to Paymob');
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

  console.log('\n============================================================');
  console.log('>>> ALL 7 PAYMENT & WEBHOOK UNIT TESTS PASSED! <<<');
  console.log('============================================================');
}

runPaymentTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
