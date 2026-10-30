import assert from 'node:assert';
import { getUserEntitlements } from '../lib/credits.ts';

console.log('============================================================');
console.log('>>> TESTING getUserEntitlements() ENTITLEMENT LOGIC <<<');
console.log('============================================================');

// Test 1: null / undefined user
const nullEnt = getUserEntitlements(null);
assert.strictEqual(nullEnt.isPro, false, 'null user isPro should be false');
assert.strictEqual(nullEnt.unlimited, false, 'null user unlimited should be false');
assert.strictEqual(nullEnt.creditsLeft, 0, 'null user creditsLeft should be 0');
console.log('✔ Test 1 passed: null user returns safe defaults');

// Test 2: Free user default (missing aiCredits)
const freeDefault = getUserEntitlements({ plan: 'free' });
assert.strictEqual(freeDefault.isPro, false);
assert.strictEqual(freeDefault.unlimited, false);
assert.strictEqual(freeDefault.creditsLeft, 3, 'default credits should be 3');
console.log('✔ Test 2 passed: free user defaults to 3 credits');

// Test 3: Free user with specific credits
const freeCustom = getUserEntitlements({ plan: 'free', aiCredits: 7 });
assert.strictEqual(freeCustom.isPro, false);
assert.strictEqual(freeCustom.unlimited, false);
assert.strictEqual(freeCustom.creditsLeft, 7);
console.log('✔ Test 3 passed: free user with explicit credits');

// Test 4: Free user with 0 credits
const freeZero = getUserEntitlements({ plan: 'free', aiCredits: 0 });
assert.strictEqual(freeZero.isPro, false);
assert.strictEqual(freeZero.unlimited, false);
assert.strictEqual(freeZero.creditsLeft, 0);
console.log('✔ Test 4 passed: free user with 0 credits clamped properly');

// Test 5: Active Pro user (no expiry)
const proUser = getUserEntitlements({ plan: 'pro', aiCredits: 0 });
assert.strictEqual(proUser.isPro, true);
assert.strictEqual(proUser.unlimited, true);
assert.strictEqual(proUser.creditsLeft, Infinity);
console.log('✔ Test 5 passed: active Pro user isPro=true, unlimited=true, creditsLeft=Infinity');

// Test 6: Active Enterprise user
const entUser = getUserEntitlements({ plan: 'enterprise', aiCredits: 5 });
assert.strictEqual(entUser.isPro, true);
assert.strictEqual(entUser.unlimited, true);
assert.strictEqual(entUser.creditsLeft, Infinity);
console.log('✔ Test 6 passed: active Enterprise user isPro=true, unlimited=true');

// Test 7: Pro user with future expiry
const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days ahead
const proFuture = getUserEntitlements({ plan: 'pro', planExpiresAt: futureDate });
assert.strictEqual(proFuture.isPro, true);
assert.strictEqual(proFuture.unlimited, true);
assert.strictEqual(proFuture.creditsLeft, Infinity);
console.log('✔ Test 7 passed: Pro user with future planExpiresAt remains active Pro');

// Test 8: Pro user with EXPIRED plan (treated as free)
const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24); // 1 day ago
const proExpired = getUserEntitlements({ plan: 'pro', aiCredits: 2, planExpiresAt: pastDate });
assert.strictEqual(proExpired.isPro, false, 'expired pro user should be downgraded to free');
assert.strictEqual(proExpired.unlimited, false, 'expired pro user should not be unlimited');
assert.strictEqual(proExpired.creditsLeft, 2, 'expired pro user gets remaining numeric credits');
console.log('✔ Test 8 passed: expired Pro user treated as free tier');

// Test 9: Enterprise user with EXPIRED plan (treated as free)
const entExpired = getUserEntitlements({ plan: 'enterprise', aiCredits: 0, planExpiresAt: pastDate });
assert.strictEqual(entExpired.isPro, false);
assert.strictEqual(entExpired.unlimited, false);
assert.strictEqual(entExpired.creditsLeft, 0);
console.log('✔ Test 9 passed: expired Enterprise user treated as free tier');

console.log('\n============================================================');
console.log('>>> ALL 9 CREDITS ENTITLEMENTS TESTS PASSED! <<<');
console.log('============================================================\n');
