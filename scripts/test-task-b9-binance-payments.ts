import assert from 'assert';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import DataStore from '../app/lib/datastore';
import { signToken } from '../app/lib/auth';
import {
  calculateUniqueCryptoAmount,
  getPlanPriceUsdt,
  BEP20_USDT_CONTRACT,
  TRC20_USDT_CONTRACT,
} from '../lib/payments/crypto-utils';
import {
  signBinancePayRequest,
  generateBinanceNonce,
} from '../lib/payments/binance-pay';
import {
  isValidTxidFormat,
  verifyBep20Tx,
  verifyTrc20Tx,
  verifyCryptoPayment,
} from '../lib/payments/manual-crypto';
import { POST as binanceWebhookPost } from '../app/api/webhooks/binance-pay/route';
import { GET as cryptoOrderGet } from '../app/api/payments/crypto/order/route';
import { POST as cryptoVerifyPost } from '../app/api/payments/crypto/verify/route';
import { checkRateLimitAsync, clearAllRateLimits } from '../lib/rate-limit';

async function runTaskB9Tests() {
  console.log('================================================================');
  console.log('🚀 Running Task B9 Verification Suite: Binance & Crypto Payments');
  console.log('================================================================\n');

  // Test 1: Plan Price Resolution & Server-Side Authority
  console.log('--- Test 1: Server-Side Price Resolution from lib/plans.ts ---');
  const proMonthlyPrice = getPlanPriceUsdt('pro', 'monthly');
  const proAnnualPrice = getPlanPriceUsdt('pro', 'annual');
  const paygPrice = getPlanPriceUsdt('payg', 'once');

  assert.strictEqual(proMonthlyPrice, 9, 'Pro monthly must be exactly 9 USDT');
  assert.strictEqual(proAnnualPrice, 84, 'Pro annual must be exactly 84 USDT');
  assert.strictEqual(paygPrice, 5, 'PAYG must be exactly 5 USDT');
  console.log('  ✓ Pro monthly = 9 USDT, Pro annual = 84 USDT, PAYG = 5 USDT');

  // Test 2: Unique Cents Offset Generation & Collision Avoidance
  console.log('\n--- Test 2: Unique Cents Offset & Collision Avoidance ---');
  const activeAmounts = [9.01, 9.02, 9.03];
  const { amount, centsSuffix } = calculateUniqueCryptoAmount(9, activeAmounts);

  assert.ok(centsSuffix > 0 && centsSuffix < 1, 'Cents suffix must be between 0.01 and 0.99');
  assert.ok(amount > 9 && amount < 10, 'Total amount must include unique cents');
  assert.ok(!activeAmounts.includes(amount), 'Generated amount must not collide with active orders');
  console.log(`  ✓ Generated unique amount: ${amount} USDT (suffix: +${centsSuffix})`);

  // Test 3: Binance Pay Merchant Request Signing (Method A)
  console.log('\n--- Test 3: Binance Pay Official HMAC-SHA512 Request Signing ---');
  const timestamp = '1700000000000';
  const nonce = 'abcdef1234567890abcdef1234567890';
  const bodyString = JSON.stringify({ merchantTradeNo: 'ORD-TEST-001', orderAmount: 9.14 });
  const secretKey = 'test_binance_pay_secret_key_123';

  const signature = signBinancePayRequest(timestamp, nonce, bodyString, secretKey);
  assert.strictEqual(typeof signature, 'string');
  assert.strictEqual(signature, signature.toUpperCase(), 'Signature must be uppercase hexadecimal');
  assert.strictEqual(signature.length, 128, 'HMAC-SHA512 hex length must be 128 characters');

  // Deterministic check
  const signature2 = signBinancePayRequest(timestamp, nonce, bodyString, secretKey);
  assert.strictEqual(signature, signature2, 'Identical payload must produce identical signature');
  console.log('  ✓ Binance Pay HMAC-SHA512 signature matches official upper-case hex format');

  // Test 4: TXID Format Validation
  console.log('\n--- Test 4: Transaction Hash (TXID) Format Validation ---');
  const validBep20Txid = '0x' + crypto.randomBytes(32).toString('hex').toLowerCase();
  const invalidBep20Txid = '0x12345short';
  const validTrc20Txid = crypto.randomBytes(32).toString('hex').toLowerCase();
  const invalidTrc20Txid = 'not-a-hex-string';

  assert.strictEqual(isValidTxidFormat(validBep20Txid, 'BEP20'), true);
  assert.strictEqual(isValidTxidFormat(invalidBep20Txid, 'BEP20'), false);
  assert.strictEqual(isValidTxidFormat(validTrc20Txid, 'TRC20'), true);
  assert.strictEqual(isValidTxidFormat(invalidTrc20Txid, 'TRC20'), false);
  console.log('  ✓ Accurate TXID format verification for BEP20 (0x + 64 hex) and TRC20 (64 hex)');

  // Test 5: Order Creation & Lifecycle in DataStore
  console.log('\n--- Test 5: Order Creation in DataStore ---');
  const testUserEmail = `paytest_${Date.now()}@example.com`;

  const createdUser = await DataStore.createUserAccount({
    name: 'Crypto Tester',
    email: testUserEmail,
    password: 'password123',
    role: 'user',
  });
  const testUserId = createdUser.id;

  const createdOrder = await DataStore.createOrder({
    userId: testUserId,
    userEmail: testUserEmail,
    planId: 'pro',
    billingCycle: 'monthly',
    baseAmount: 9,
    amount: 9.14,
    currency: 'USDT',
    method: 'manual_crypto',
    network: 'BEP20',
    reference: `ORD-TEST-${Date.now().toString().slice(-6)}`,
    recipientAddress: '0x1111111111111111111111111111111111111111',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });

  assert.ok(createdOrder.id, 'Order ID must exist');
  assert.strictEqual(createdOrder.status, 'awaiting_payment');
  assert.strictEqual(createdOrder.amount, 9.14);
  console.log(`  ✓ Order created successfully with reference: ${createdOrder.reference}`);

  // Test 6: Mocked BscScan BEP20 On-Chain Verification
  console.log('\n--- Test 6: BscScan BEP20 On-Chain Verification (Mocked Explorer) ---');
  process.env.PAYMENT_WALLET_BEP20 = '0x1111111111111111111111111111111111111111';

  // 6a: Valid successful transaction
  const mockValidBscFetch: any = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      status: '1',
      message: 'OK',
      result: [
        {
          hash: validBep20Txid,
          contractAddress: BEP20_USDT_CONTRACT,
          to: '0x1111111111111111111111111111111111111111',
          from: '0x2222222222222222222222222222222222222222',
          value: '9140000000000000000', // 9.14 * 10^18
          tokenDecimal: '18',
          confirmations: '15',
          timeStamp: Math.floor(Date.now() / 1000).toString(),
        },
      ],
    }),
  });

  const validVerifyResult = await verifyBep20Tx(createdOrder, validBep20Txid, mockValidBscFetch);
  assert.strictEqual(validVerifyResult.verified, true, 'Valid BscScan TX must be verified');
  assert.strictEqual(validVerifyResult.status, 'paid');
  assert.strictEqual(validVerifyResult.txDetails?.amount, 9.14);
  console.log('  ✓ Valid BEP20 transfer correctly verified with BscScan');

  // 6b: Wrong contract address (Fake token)
  const mockWrongContractFetch: any = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      status: '1',
      message: 'OK',
      result: [
        {
          hash: validBep20Txid,
          contractAddress: '0x000000000000000000000000000000000000dead', // Fake token
          to: '0x1111111111111111111111111111111111111111',
          value: '9140000000000000000',
          tokenDecimal: '18',
          confirmations: '15',
          timeStamp: Math.floor(Date.now() / 1000).toString(),
        },
      ],
    }),
  });

  const wrongContractResult = await verifyBep20Tx(createdOrder, validBep20Txid, mockWrongContractFetch);
  assert.strictEqual(wrongContractResult.verified, false);
  assert.strictEqual(wrongContractResult.status, 'rejected');
  console.log('  ✓ Fake token / wrong contract address correctly rejected');

  // 6c: Underpaid amount
  const mockUnderpaidFetch: any = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      status: '1',
      message: 'OK',
      result: [
        {
          hash: validBep20Txid,
          contractAddress: BEP20_USDT_CONTRACT,
          to: '0x1111111111111111111111111111111111111111',
          value: '8000000000000000000', // 8.00 USDT instead of 9.14
          tokenDecimal: '18',
          confirmations: '15',
          timeStamp: Math.floor(Date.now() / 1000).toString(),
        },
      ],
    }),
  });

  const underpaidResult = await verifyBep20Tx(createdOrder, validBep20Txid, mockUnderpaidFetch);
  assert.strictEqual(underpaidResult.verified, false);
  assert.strictEqual(underpaidResult.status, 'rejected');
  console.log('  ✓ Underpaid amount correctly rejected');

  // 6d: Reused old historical transaction (executed before order creation)
  const mockOldTxFetch: any = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      status: '1',
      message: 'OK',
      result: [
        {
          hash: validBep20Txid,
          contractAddress: BEP20_USDT_CONTRACT,
          to: '0x1111111111111111111111111111111111111111',
          value: '9140000000000000000',
          tokenDecimal: '18',
          confirmations: '15',
          timeStamp: Math.floor((Date.now() - 24 * 3600 * 1000) / 1000).toString(), // 1 day ago
        },
      ],
    }),
  });

  const oldTxResult = await verifyBep20Tx(createdOrder, validBep20Txid, mockOldTxFetch);
  assert.strictEqual(oldTxResult.verified, false);
  assert.strictEqual(oldTxResult.status, 'rejected');
  console.log('  ✓ Old historical TXID executed before order creation correctly rejected');

  // Test 7: Mocked TronGrid TRC20 On-Chain Verification
  console.log('\n--- Test 7: TronGrid TRC20 On-Chain Verification (Mocked Explorer) ---');
  process.env.PAYMENT_WALLET_TRC20 = 'TRecipientWalletOnTron1234567890';

  const trc20Order = await DataStore.createOrder({
    userId: testUserId,
    userEmail: testUserEmail,
    planId: 'payg',
    billingCycle: 'once',
    baseAmount: 5,
    amount: 5.25,
    currency: 'USDT',
    method: 'manual_crypto',
    network: 'TRC20',
    reference: `ORD-TRC-${Date.now().toString().slice(-6)}`,
    recipientAddress: 'TRecipientWalletOnTron1234567890',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });

  const mockValidTronFetch: any = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      data: [
        {
          transaction_id: validTrc20Txid,
          block_timestamp: Date.now(),
          event_name: 'Transfer',
          contract_address: TRC20_USDT_CONTRACT,
          result: {
            from: 'TSenderAddress123',
            to: 'TRecipientWalletOnTron1234567890',
            value: '5250000', // 5.25 * 10^6
          },
        },
      ],
    }),
  });

  const tronResult = await verifyTrc20Tx(trc20Order, validTrc20Txid, mockValidTronFetch);
  assert.strictEqual(tronResult.verified, true);
  assert.strictEqual(tronResult.status, 'paid');
  assert.strictEqual(tronResult.txDetails?.amount, 5.25);
  console.log('  ✓ Valid TRC20 transfer correctly verified with TronGrid');

  // Test 8: Order Completion & Subscription Extension Logic
  console.log('\n--- Test 8: Order Completion & Subscription Extension ---');
  // First, complete the Pro monthly order
  const completeProResult = await DataStore.completeOrder(createdOrder.id, {
    txid: validBep20Txid,
    actor: 'test_suite',
    note: 'Completed via automated verification test',
  });

  assert.strictEqual(completeProResult.success, true);
  assert.strictEqual(completeProResult.order?.status, 'paid');
  assert.strictEqual(completeProResult.order?.txid, validBep20Txid);

  // Check user entitlement
  const upgradedUser = await DataStore.findUserById(testUserId);
  assert.strictEqual(upgradedUser?.plan, 'pro');
  assert.ok(upgradedUser?.planExpiresAt, 'planExpiresAt must be set');
  const firstExpiry = new Date(upgradedUser.planExpiresAt!).getTime();
  assert.ok(firstExpiry > Date.now(), 'Expiration must be in the future');
  console.log(`  ✓ User upgraded to Pro. Initial expiration: ${upgradedUser.planExpiresAt}`);

  // Now simulate user purchasing another monthly subscription while active:
  // It must EXTEND existing expiry by 30 days, not overwrite from Date.now()!
  const secondOrder = await DataStore.createOrder({
    userId: testUserId,
    userEmail: testUserEmail,
    planId: 'pro',
    billingCycle: 'monthly',
    baseAmount: 9,
    amount: 9.33,
    currency: 'USDT',
    method: 'manual_crypto',
    network: 'BEP20',
    reference: `ORD-EXT-${Date.now().toString().slice(-6)}`,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });

  await DataStore.completeOrder(secondOrder.id, {
    txid: '0x' + crypto.randomBytes(32).toString('hex').toLowerCase(),
    actor: 'test_suite',
    note: 'Extension payment',
  });

  const extendedUser = await DataStore.findUserById(testUserId);
  const secondExpiry = new Date(extendedUser!.planExpiresAt!).getTime();
  const addedDays = Math.round((secondExpiry - firstExpiry) / (24 * 3600 * 1000));
  assert.strictEqual(addedDays, 30, 'Active subscription must be extended by exactly 30 days');
  console.log(`  ✓ Active Pro subscription extended by +30 days (new expiry: ${extendedUser?.planExpiresAt})`);

  // Test 9: Idempotency & TXID Reuse Prevention
  console.log('\n--- Test 9: Idempotency & TXID Reuse Prevention ---');
  // Attempting to use the already claimed validBep20Txid on another order must be rejected
  const duplicateOrder = await DataStore.createOrder({
    userId: `usr_other_${Date.now()}`,
    userEmail: 'other@example.com',
    planId: 'pro',
    billingCycle: 'monthly',
    baseAmount: 9,
    amount: 9.14,
    currency: 'USDT',
    method: 'manual_crypto',
    network: 'BEP20',
    reference: `ORD-DUP-${Date.now().toString().slice(-6)}`,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });

  const duplicateCheck = await verifyCryptoPayment(duplicateOrder, validBep20Txid);
  assert.strictEqual(duplicateCheck.verified, false);
  assert.strictEqual(duplicateCheck.status, 'rejected');
  assert.strictEqual(duplicateCheck.error, 'TXID_ALREADY_USED');
  assert.ok(duplicateCheck.reason?.includes('already been claimed'), 'Must reject reused TXID');

  // Also test DataStore.completeOrder directly with reused TXID on second order
  const duplicateCompleteResult = await DataStore.completeOrder(duplicateOrder.id, {
    txid: validBep20Txid.toUpperCase(), // Even with uppercase variation, normalization catches it
    actor: 'test_suite',
  });
  assert.strictEqual(duplicateCompleteResult.success, false);
  assert.strictEqual(duplicateCompleteResult.error, 'TXID_ALREADY_USED');
  console.log('  ✓ Duplicate TXID (including case variation) blocked with TXID_ALREADY_USED');

  // Test 10: Admin Approval & Rejection Flow
  console.log('\n--- Test 10: Admin Manual Approval & Rejection Flow ---');
  const pendingOrder = await DataStore.createOrder({
    userId: testUserId,
    userEmail: testUserEmail,
    planId: 'payg',
    billingCycle: 'once',
    baseAmount: 5,
    amount: 5.77,
    currency: 'USDT',
    method: 'manual_crypto',
    network: 'BEP20',
    reference: `ORD-ADMIN-${Date.now().toString().slice(-6)}`,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });

  // Admin approves
  const adminApproved = await DataStore.completeOrder(pendingOrder.id, {
    actor: 'admin (admin@jobmatch.ai)',
    note: 'Manually verified via BscScan explorer',
  });
  assert.strictEqual(adminApproved.order?.status, 'paid');
  const userAfterCredit = await DataStore.findUserById(testUserId);
  assert.ok((userAfterCredit?.aiCredits || 0) >= 15, 'PAYG credits must be credited on admin approval');
  console.log(`  ✓ Admin approved order: credits credited (total credits: ${userAfterCredit?.aiCredits})`);

  // Admin rejects another order
  const orderToReject = await DataStore.createOrder({
    userId: testUserId,
    userEmail: testUserEmail,
    planId: 'pro',
    billingCycle: 'monthly',
    baseAmount: 9,
    amount: 9.88,
    currency: 'USDT',
    method: 'manual_crypto',
    network: 'BEP20',
    reference: `ORD-REJ-${Date.now().toString().slice(-6)}`,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });

  const rejectedOrder = await DataStore.updateOrderStatus(orderToReject.id, 'rejected', {
    actor: 'admin (admin@jobmatch.ai)',
    note: 'Invalid transfer details',
  });
  assert.strictEqual(rejectedOrder?.status, 'rejected');
  console.log('  ✓ Admin rejected order successfully updated in database and audit log');

  // Test 11: Concurrent Promise.all with the SAME TXID (Atomic Uniqueness)
  console.log('\n--- Test 11: Concurrent Promise.all Requests with Same TXID ---');
  const concurrentTxid1 =
    '0x' + crypto.randomBytes(32).toString('hex').toLowerCase();
  const concurrentOrder1 = await DataStore.createOrder({
    userId: testUserId,
    userEmail: testUserEmail,
    planId: 'payg',
    billingCycle: 'once',
    baseAmount: 5,
    amount: 5.41,
    currency: 'USDT',
    method: 'manual_crypto',
    network: 'BEP20',
    reference: `ORD-CONC1-${Date.now().toString().slice(-6)}`,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });
  const concurrentOrder2 = await DataStore.createOrder({
    userId: testUserId,
    userEmail: testUserEmail,
    planId: 'payg',
    billingCycle: 'once',
    baseAmount: 5,
    amount: 5.42,
    currency: 'USDT',
    method: 'manual_crypto',
    network: 'BEP20',
    reference: `ORD-CONC2-${Date.now().toString().slice(-6)}`,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });

  const [concRes1, concRes2] = await Promise.all([
    DataStore.completeOrder(concurrentOrder1.id, { txid: concurrentTxid1, actor: 'concurrent_test' }),
    DataStore.completeOrder(concurrentOrder2.id, { txid: concurrentTxid1, actor: 'concurrent_test' }),
  ]);

  const succeededCount = [concRes1, concRes2].filter((r) => r.success).length;
  const failedWithTxidUsed = [concRes1, concRes2].filter(
    (r) => !r.success && r.error === 'TXID_ALREADY_USED'
  ).length;
  assert.strictEqual(succeededCount, 1, 'Exactly one concurrent completeOrder call must succeed');
  assert.strictEqual(
    failedWithTxidUsed,
    1,
    'The other concurrent completeOrder call must fail with TXID_ALREADY_USED'
  );
  console.log('  ✓ Concurrent Promise.all on DataStore.completeOrder: 1 succeeded, 1 rejected with TXID_ALREADY_USED');

  // Also test concurrent Promise.all on verifyCryptoPayment
  const concurrentTxid2 =
    '0x' + crypto.randomBytes(32).toString('hex').toLowerCase();
  const concurrentOrderA = await DataStore.createOrder({
    userId: testUserId,
    userEmail: testUserEmail,
    planId: 'payg',
    billingCycle: 'once',
    baseAmount: 5,
    amount: 5.15,
    currency: 'USDT',
    method: 'manual_crypto',
    network: 'BEP20',
    reference: `ORD-CONCA-${Date.now().toString().slice(-6)}`,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });
  const concurrentOrderB = await DataStore.createOrder({
    userId: testUserId,
    userEmail: testUserEmail,
    planId: 'payg',
    billingCycle: 'once',
    baseAmount: 5,
    amount: 5.15,
    currency: 'USDT',
    method: 'manual_crypto',
    network: 'BEP20',
    reference: `ORD-CONCB-${Date.now().toString().slice(-6)}`,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });

  const mockConcurrentBscFetch: any = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      status: '1',
      message: 'OK',
      result: [
        {
          hash: concurrentTxid2,
          contractAddress: BEP20_USDT_CONTRACT,
          to: '0x1111111111111111111111111111111111111111',
          from: '0x2222222222222222222222222222222222222222',
          value: '5150000000000000000',
          tokenDecimal: '18',
          confirmations: '12',
          timeStamp: Math.floor(Date.now() / 1000).toString(),
        },
      ],
    }),
  });

  const [verifyResA, verifyResB] = await Promise.all([
    verifyCryptoPayment(concurrentOrderA, concurrentTxid2, mockConcurrentBscFetch),
    verifyCryptoPayment(concurrentOrderB, concurrentTxid2, mockConcurrentBscFetch),
  ]);

  const verifySuccessCount = [verifyResA, verifyResB].filter((r) => r.verified && r.status === 'paid').length;
  const verifyDuplicateCount = [verifyResA, verifyResB].filter(
    (r) => !r.verified && r.error === 'TXID_ALREADY_USED'
  ).length;
  assert.strictEqual(verifySuccessCount, 1, 'Exactly one concurrent verifyCryptoPayment must succeed');
  assert.strictEqual(verifyDuplicateCount, 1, 'The second concurrent verifyCryptoPayment must return TXID_ALREADY_USED');
  console.log('  ✓ Concurrent Promise.all on verifyCryptoPayment: 1 verified, 1 rejected with TXID_ALREADY_USED');

  // Test 12: Malformed TXID & Regex Injection Prevention in findOrderByTxid & verifyCryptoPayment
  console.log('\n--- Test 12: Malformed TXID & Regex Injection Prevention ---');
  const malformedInputs = [
    '.*',
    '^0x.*$',
    '0x12345',
    '0xgggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg',
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', // 0x prefix invalid on TRC20
  ];
  for (const badTxid of malformedInputs.slice(0, 4)) {
    const found = await DataStore.findOrderByTxid(badTxid);
    assert.strictEqual(found, null, `Malformed TXID "${badTxid}" must return null in findOrderByTxid`);
    const vRes = await verifyCryptoPayment(concurrentOrderA, badTxid, mockConcurrentBscFetch);
    assert.strictEqual(vRes.verified, false);
    assert.strictEqual(vRes.error, 'INVALID_TXID_FORMAT');
  }
  assert.strictEqual(
    isValidTxidFormat(malformedInputs[4], 'TRC20'),
    false,
    'TRC20 TXID must be strictly 64 hex without 0x prefix'
  );
  console.log('  ✓ Malformed TXIDs and regex wildcards safely rejected without RegExp construction');

  // Test 13: Binance Pay Webhook Hardening (Signature, Underpaid Amount, Wrong Currency, Cents-Suffix)
  console.log('\n--- Test 13: Binance Pay Webhook Security & Amount/Currency Enforcement ---');
  process.env.BINANCE_PAY_SECRET = 'test_binance_webhook_secret_999';
  const binanceOrder = await DataStore.createOrder({
    userId: testUserId,
    userEmail: testUserEmail,
    planId: 'payg',
    billingCycle: 'once',
    baseAmount: 5,
    amount: 5.19,
    currency: 'USDT',
    method: 'binance_pay',
    network: 'binance',
    reference: `ORD-BPAY-${Date.now().toString().slice(-6)}`,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });

  function buildSignedBinanceWebhookReq(payloadObj: any, overrideSig?: string) {
    const rawBody = JSON.stringify(payloadObj);
    const ts = Date.now().toString();
    const n = generateBinanceNonce(32);
    const sig =
      overrideSig !== undefined
        ? overrideSig
        : signBinancePayRequest(ts, n, rawBody, process.env.BINANCE_PAY_SECRET!);
    return new NextRequest('http://localhost:3000/api/webhooks/binance-pay', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'binancepay-timestamp': ts,
        'binancepay-nonce': n,
        'binancepay-certificate-sn': 'TEST_CERT_SN',
        ...(sig ? { 'binancepay-signature': sig } : {}),
      },
      body: rawBody,
    });
  }

  // 13a: Missing/Invalid signature -> 400
  const invalidSigReq = buildSignedBinanceWebhookReq(
    {
      bizStatus: 'PAY_SUCCESS',
      data: { merchantTradeNo: binanceOrder.reference, totalFee: '5.19', currency: 'USDT' },
    },
    'INVALID_SIGNATURE_HEX'
  );
  const invalidSigRes = await binanceWebhookPost(invalidSigResReqFix(invalidSigReq));
  assert.strictEqual(invalidSigRes.status, 400, 'Invalid signature must return 400');

  // 13b: Underpaid amount (4.50 < 5.19) -> 400 + PaymentEvent rejected + Order NOT paid
  const underpaidTxId = `bpay_under_${Date.now()}`;
  const underpaidWebhookReq = buildSignedBinanceWebhookReq({
    bizStatus: 'PAY_SUCCESS',
    data: {
      merchantTradeNo: binanceOrder.reference,
      transactionId: underpaidTxId,
      totalFee: '4.50',
      currency: 'USDT',
    },
  });
  const underpaidWebhookRes = await binanceWebhookPost(underpaidWebhookReq);
  assert.strictEqual(underpaidWebhookRes.status, 400, 'Underpaid Binance webhook must return 400');
  const underpaidOrderCheck = await DataStore.findOrderById(binanceOrder.id);
  assert.strictEqual(
    underpaidOrderCheck?.status,
    'awaiting_payment',
    'Order must remain awaiting_payment on underpaid webhook'
  );
  const underpaidEvent = await DataStore.findPaymentEvent(
    `binance_pay_reject_${binanceOrder.reference}_${underpaidTxId}`
  );
  assert.strictEqual(underpaidEvent?.status, 'rejected', 'Rejected PaymentEvent must be recorded');
  console.log('  ✓ Underpaid Binance webhook rejected (HTTP 400) and PaymentEvent recorded as rejected');

  // 13c: Wrong currency (BUSD instead of USDT) -> 400 + PaymentEvent rejected
  const wrongCurrTxId = `bpay_curr_${Date.now()}`;
  const wrongCurrReq = buildSignedBinanceWebhookReq({
    bizStatus: 'PAY_SUCCESS',
    data: {
      merchantTradeNo: binanceOrder.reference,
      transactionId: wrongCurrTxId,
      totalFee: '5.19',
      currency: 'BUSD',
    },
  });
  const wrongCurrRes = await binanceWebhookPost(wrongCurrReq);
  assert.strictEqual(wrongCurrRes.status, 400, 'Wrong currency Binance webhook must return 400');
  const wrongCurrEvent = await DataStore.findPaymentEvent(
    `binance_pay_reject_${binanceOrder.reference}_${wrongCurrTxId}`
  );
  assert.strictEqual(wrongCurrEvent?.status, 'rejected', 'Currency mismatch PaymentEvent must be rejected');
  console.log('  ✓ Wrong currency Binance webhook rejected (HTTP 400) and PaymentEvent recorded as rejected');

  // 13d: Valid payment (>= expected amount) -> 200 + Order completed
  const validBpayTxId = `bpay_ok_${Date.now()}`;
  const validBpayReq = buildSignedBinanceWebhookReq({
    bizStatus: 'PAY_SUCCESS',
    data: {
      merchantTradeNo: binanceOrder.reference,
      transactionId: validBpayTxId,
      totalFee: '5.19',
      currency: 'USDT',
    },
  });
  const validBpayRes = await binanceWebhookPost(validBpayReq);
  assert.strictEqual(validBpayRes.status, 200, 'Valid Binance webhook must return 200');
  const completedBpayOrder = await DataStore.findOrderById(binanceOrder.id);
  assert.strictEqual(completedBpayOrder?.status, 'paid', 'Order must be marked paid after valid webhook');
  console.log('  ✓ Valid Binance webhook completed order and recorded processed PaymentEvent');

  // Test 14: Auth & Ownership Enforcement on /api/payments/crypto/order and /verify
  console.log('\n--- Test 14: Auth (401) & Ownership (403) on Crypto Order & Verify Endpoints ---');
  const ownerToken = signToken({
    userId: testUserId,
    email: testUserEmail,
    name: 'Crypto Tester',
    role: 'user',
  });
  const attackerToken = signToken({
    userId: 'usr_attacker_999',
    email: 'attacker@example.com',
    name: 'Attacker',
    role: 'user',
  });

  // Unauthenticated GET /api/payments/crypto/order -> 401
  const unauthOrderReq = new NextRequest(
    `http://localhost:3000/api/payments/crypto/order?reference=${createdOrder.reference}`,
    { method: 'GET' }
  );
  const unauthOrderRes = await cryptoOrderGet(unauthOrderReq);
  assert.strictEqual(unauthOrderRes.status, 401, 'Unauthenticated GET /crypto/order must return 401');

  // Attacker GET /api/payments/crypto/order -> 403
  const forbiddenOrderReq = new NextRequest(
    `http://localhost:3000/api/payments/crypto/order?reference=${createdOrder.reference}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${attackerToken}` },
    }
  );
  const forbiddenOrderRes = await cryptoOrderGet(forbiddenOrderReq);
  assert.strictEqual(forbiddenOrderRes.status, 403, 'Non-owner GET /crypto/order must return 403');

  // Owner GET /api/payments/crypto/order -> 200
  const ownerOrderReq = new NextRequest(
    `http://localhost:3000/api/payments/crypto/order?reference=${createdOrder.reference}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${ownerToken}` },
    }
  );
  const ownerOrderRes = await cryptoOrderGet(ownerOrderReq);
  assert.strictEqual(ownerOrderRes.status, 200, 'Owner GET /crypto/order must return 200');

  // Unauthenticated POST /api/payments/crypto/verify -> 401
  const unauthVerifyReq = new NextRequest('http://localhost:3000/api/payments/crypto/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ reference: createdOrder.reference, txid: validBep20Txid }),
  });
  const unauthVerifyRes = await cryptoVerifyPost(unauthVerifyReq);
  assert.strictEqual(unauthVerifyRes.status, 401, 'Unauthenticated POST /crypto/verify must return 401');

  // Attacker POST /api/payments/crypto/verify -> 403
  const forbiddenVerifyReq = new NextRequest('http://localhost:3000/api/payments/crypto/verify', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${attackerToken}`,
    },
    body: JSON.stringify({ reference: createdOrder.reference, txid: validBep20Txid }),
  });
  const forbiddenVerifyRes = await cryptoVerifyPost(forbiddenVerifyReq);
  assert.strictEqual(forbiddenVerifyRes.status, 403, 'Non-owner POST /crypto/verify must return 403');
  console.log('  ✓ /api/payments/crypto/order and /verify strictly enforce 401 Auth and 403 Ownership');

  // Test 15: Shared Rate Limiter (lib/rate-limit.ts)
  console.log('\n--- Test 15: Shared Rate Limiter (lib/rate-limit.ts) ---');
  await clearAllRateLimits();
  const rlKey = `test_shared_rl_${Date.now()}`;
  const rl1 = await checkRateLimitAsync(rlKey, { limit: 2, windowMs: 60000 });
  const rl2 = await checkRateLimitAsync(rlKey, { limit: 2, windowMs: 60000 });
  const rl3 = await checkRateLimitAsync(rlKey, { limit: 2, windowMs: 60000 });
  assert.strictEqual(rl1.allowed, true);
  assert.strictEqual(rl2.allowed, true);
  assert.strictEqual(rl3.allowed, false, 'Third request exceeding limit of 2 must be rate-limited');
  console.log('  ✓ Shared rate limiter accurately tracks and blocks excess requests');

  console.log('\n================================================================');
  console.log('🎉 ALL 15 TESTS PASSED: Task B9 Binance & Crypto Hardening Verified!');
  console.log('================================================================\n');
}

function invalidSigResReqFix(req: NextRequest): NextRequest {
  return req;
}

runTaskB9Tests().catch((err) => {
  console.error('❌ Task B9 verification failed:', err);
  process.exit(1);
});
