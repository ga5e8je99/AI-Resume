/**
 * Test Suite: Credit Guard & Atomic Deduction Logic
 * 
 * Verifies:
 * 1. requireCredits entitlement checks (Free, Pro, Expired Pro, Demo)
 * 2. HTTP 402 rejection with upgradeUrl: "/pricing" when credits exhausted
 * 3. Atomic credit deduction via consumeCredit
 * 4. Protection against negative credits
 * 5. Pro & Demo immunity to deductions
 * 6. Live end-to-end 3-credit exhaustion leading to HTTP 402 on 4th call
 */

import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { requireCredits, consumeCredit } from '../lib/credit-guard';
import { getUserEntitlements } from '../lib/credits';
import DataStore from '../app/lib/datastore';

console.log('============================================================');
console.log('>>> RUNNING CREDIT GUARD & ATOMIC DEDUCTION TEST SUITE <<<');
console.log('============================================================\n');

async function runTests() {
  const localDbPath = path.join(process.cwd(), '.data', 'db.json');

  // --- UNIT TESTS: REQUIRE CREDITS & CONSUME CREDITS ---
  console.log('▶ [Test 1] Testing Free user with 3 credits');
  const freeUser = await DataStore.createUserAccount({
    name: 'Credit Tester Free',
    email: `free_${Date.now()}@test.com`,
    password: 'password123',
    plan: 'free',
    aiCredits: 3,
  });

  const check1 = await requireCredits(freeUser.id);
  assert.strictEqual(check1.allowed, true, 'Free user with 3 credits should be allowed');
  assert.strictEqual(check1.unlimited, false, 'Free user should not be unlimited');
  assert.strictEqual(check1.creditsLeft, 3, 'Free user should have 3 creditsLeft');
  console.log('✔ Test 1 Passed: Free user with 3 credits approved.');

  console.log('\n▶ [Test 2] Testing Atomic Credit Deduction (3 -> 2 -> 1 -> 0)');
  const ded1 = await consumeCredit(freeUser.id);
  assert.strictEqual(ded1.success, true);
  assert.strictEqual(ded1.deducted, true);
  assert.strictEqual(ded1.remaining, 2, 'Remaining should be 2 after 1st deduction');

  const ded2 = await consumeCredit(freeUser.id);
  assert.strictEqual(ded2.remaining, 1, 'Remaining should be 1 after 2nd deduction');

  const ded3 = await consumeCredit(freeUser.id);
  assert.strictEqual(ded3.remaining, 0, 'Remaining should be 0 after 3rd deduction');
  console.log('✔ Test 2 Passed: Sequential deductions decremented properly to 0.');

  console.log('\n▶ [Test 3] Testing 4th deduction attempt when credits are 0 (Atomic Floor Guard)');
  const ded4 = await consumeCredit(freeUser.id);
  assert.strictEqual(ded4.success, false, 'Deduction should fail when credits = 0');
  assert.strictEqual(ded4.remaining, 0, 'Credits must never be decremented below 0');
  assert.strictEqual(ded4.deducted, false);
  console.log('✔ Test 3 Passed: Atomic floor guard prevented negative credits.');

  console.log('\n▶ [Test 4] Testing requireCredits when credits exhausted (HTTP 402)');
  const checkExhausted = await requireCredits(freeUser.id);
  assert.strictEqual(checkExhausted.allowed, false, 'Exhausted free user should not be allowed');
  assert(checkExhausted.errorResponse, 'Must provide errorResponse');
  assert.strictEqual(checkExhausted.errorResponse.status, 402, 'Must return HTTP 402 Payment Required');
  
  const errBody = await checkExhausted.errorResponse.json();
  assert.strictEqual(errBody.error, 'NO_CREDITS', 'Error code must be NO_CREDITS');
  assert.strictEqual(errBody.upgradeUrl, '/pricing', 'Must contain upgradeUrl: /pricing');
  console.log('✔ Test 4 Passed: Returns HTTP 402 with NO_CREDITS and upgradeUrl: /pricing.');

  console.log('\n▶ [Test 5] Testing Active Pro User (Unlimited, No Deductions)');
  const proUser = await DataStore.createUserAccount({
    name: 'Pro Subscriber',
    email: `pro_${Date.now()}@test.com`,
    password: 'password123',
    plan: 'pro',
    aiCredits: 0,
  });

  const checkPro = await requireCredits(proUser.id);
  assert.strictEqual(checkPro.allowed, true, 'Pro user must always be allowed');
  assert.strictEqual(checkPro.unlimited, true, 'Pro user must be marked unlimited');

  const proDed = await consumeCredit(proUser.id);
  assert.strictEqual(proDed.success, true);
  assert.strictEqual(proDed.deducted, false, 'Pro user credits must NOT be deducted');
  assert.strictEqual(proDed.remaining, Infinity);
  console.log('✔ Test 5 Passed: Pro user allowed with unlimited generations and zero deductions.');

  console.log('\n▶ [Test 6] Testing Expired Pro User (Treated as Free)');
  const expiredPro = await DataStore.createUserAccount({
    name: 'Expired Pro User',
    email: `expired_${Date.now()}@test.com`,
    password: 'password123',
    plan: 'pro',
    planExpiresAt: new Date(Date.now() - 3600000), // 1 hour ago
    aiCredits: 0,
  });

  const checkExpired = await requireCredits(expiredPro.id);
  assert.strictEqual(checkExpired.allowed, false, 'Expired pro with 0 credits must be blocked');
  assert.strictEqual(checkExpired.errorResponse?.status, 402, 'Must return 402 for expired pro with 0 credits');
  console.log('✔ Test 6 Passed: Expired Pro user correctly treated as free tier.');

  console.log('\n▶ [Test 7] Testing Demo User (isDemo: true -> Never Charged)');
  const demoUser = await DataStore.createUserAccount({
    name: 'Demo Visitor',
    email: `demo_${Date.now()}@test.com`,
    password: 'password123',
    isDemo: true,
  });

  const checkDemo = await requireCredits(demoUser.id);
  assert.strictEqual(checkDemo.allowed, true, 'Demo user must be allowed');
  assert.strictEqual(checkDemo.isDemo, true);

  const demoDed = await consumeCredit(demoUser.id);
  assert.strictEqual(demoDed.deducted, false, 'Demo user must never be deducted');
  console.log('✔ Test 7 Passed: Demo users are never charged.');

  // Clean up test users from local JSON DB
  try {
    const raw = fs.readFileSync(localDbPath, 'utf-8');
    const data = JSON.parse(raw);
    const testIds = [freeUser.id, proUser.id, expiredPro.id, demoUser.id];
    data.users = data.users.filter((u: any) => !testIds.includes(u.id));
    fs.writeFileSync(localDbPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch {}

  console.log('\n============================================================');
  console.log('>>> ALL 7 CREDIT GUARD & DEDUCTION UNIT TESTS PASSED! <<<');
  console.log('============================================================\n');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
