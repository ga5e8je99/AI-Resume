import assert from 'assert';
import DataStore from '../app/lib/datastore';
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
  const validBep20Txid = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const invalidBep20Txid = '0x12345short';
  const validTrc20Txid = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
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
    txid: '0x9999999999999999999999999999999999999999999999999999999999999999',
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
  assert.ok(duplicateCheck.reason?.includes('already been claimed'), 'Must reject reused TXID');
  console.log('  ✓ Duplicate TXID successfully blocked by idempotency guard');

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

  console.log('\n================================================================');
  console.log('🎉 ALL 10 TESTS PASSED: Task B9 Binance Payment System Verified!');
  console.log('================================================================\n');
}

runTaskB9Tests().catch((err) => {
  console.error('❌ Task B9 verification failed:', err);
  process.exit(1);
});
