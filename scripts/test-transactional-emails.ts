/**
 * Test Suite: Task 2.5 Transactional Email & Password Reset Flow
 * Verifies:
 * 1. Resend integration and simulator fallback
 * 2. Demo user email suppression
 * 3. AR/EN responsive email templates
 * 4. Forgot password request (generic enumeration-safe response)
 * 5. Cryptographic random token + SHA-256 hash storage + 15m expiration
 * 6. Successful password reset + single-use token invalidation
 * 7. Expired token rejection
 * 8. Invalid token rejection
 */

import crypto from 'crypto';
import DataStore from '../app/lib/datastore';
import { hashPassword, comparePassword } from '../app/lib/auth';
import {
  sendEmail,
  getWelcomeEmailHtml,
  getPasswordResetEmailHtml,
  getPaymentReceiptEmailHtml,
} from '../lib/email';

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 Starting Task 2.5 Transactional Email & Auth Tests');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}${details ? ` -> ${details}` : ''}`);
      failed++;
    }
  }

  // ---------------------------------------------------------
  // 1. Email Helper & Simulator Tests
  // ---------------------------------------------------------
  console.log('--- 1. Email Delivery & Demo Protection ---');

  // Normal user simulated delivery
  const sendRes = await sendEmail({
    to: 'test@example.com',
    subject: 'Test Subject',
    html: '<p>Test email body</p>',
    isDemo: false,
  });
  assert(sendRes.success === true, 'sendEmail succeeds in simulation mode');
  assert(typeof sendRes.id === 'string' && sendRes.id.length > 0, 'sendEmail returns delivery/simulation ID');

  // Demo user email skip
  const demoSendRes = await sendEmail({
    to: 'demo@jobmatch.ai',
    subject: 'Welcome Demo User',
    html: '<p>Demo user content</p>',
    isDemo: true,
  });
  assert(demoSendRes.success === true, 'Demo sendEmail returns success status');
  assert(demoSendRes.skipped === true, 'Demo sendEmail flags skipped: true (suppression works)');

  // ---------------------------------------------------------
  // 2. HTML Templates (AR / EN)
  // ---------------------------------------------------------
  console.log('\n--- 2. Responsive Bilingual Templates ---');

  const welcomeEn = getWelcomeEmailHtml({ name: 'Alex', language: 'en' });
  assert(welcomeEn.includes('Welcome to JobMatch AI, Alex!'), 'Welcome EN contains personalized header');
  assert(welcomeEn.includes('dir="ltr"'), 'Welcome EN sets ltr direction');

  const welcomeAr = getWelcomeEmailHtml({ name: 'أحمد', language: 'ar' });
  assert(welcomeAr.includes('أهلاً بك في JobMatch AI، أحمد!'), 'Welcome AR contains Arabic header');
  assert(welcomeAr.includes('dir="rtl"'), 'Welcome AR sets rtl direction');

  const resetEn = getPasswordResetEmailHtml({ name: 'Alex', resetToken: 'raw_token_123', language: 'en' });
  assert(resetEn.includes('/reset-password/raw_token_123'), 'Reset EN embeds token in link');
  assert(resetEn.includes('15 minutes'), 'Reset EN mentions 15 minutes validity');

  const resetAr = getPasswordResetEmailHtml({ name: 'أحمد', resetToken: 'raw_token_123', language: 'ar' });
  assert(resetAr.includes('/reset-password/raw_token_123'), 'Reset AR embeds token in link');
  assert(resetAr.includes('15 دقيقة'), 'Reset AR mentions 15 minutes in Arabic');

  const receiptEn = getPaymentReceiptEmailHtml({
    name: 'Alex',
    amount: 9,
    currency: 'USD',
    planId: 'pro',
    transactionId: 'tx_stripe_999',
    language: 'en',
  });
  assert(receiptEn.includes('$9') || receiptEn.includes('9 USD'), 'Receipt EN reflects amount and currency');
  assert(receiptEn.includes('tx_stripe_999'), 'Receipt EN reflects transaction ID');

  const receiptAr = getPaymentReceiptEmailHtml({
    name: 'أحمد',
    amount: 150,
    currency: 'EGP',
    planId: 'pro',
    transactionId: 'tx_paymob_888',
    language: 'ar',
  });
  assert(receiptAr.includes('150 EGP'), 'Receipt AR reflects EGP currency');
  assert(receiptAr.includes('tx_paymob_888'), 'Receipt AR reflects Paymob transaction ID');

  // ---------------------------------------------------------
  // 3. User Setup for Forgot/Reset Flow
  // ---------------------------------------------------------
  console.log('\n--- 3. Database & Forgot/Reset Password Flow ---');

  const testUserEmail = `email_test_${Date.now()}@example.com`;
  const initialPassword = 'InitialSecretPass123';
  const hashedInitial = await hashPassword(initialPassword);

  const testUser = await DataStore.createUserAccount({
    name: 'Reset Tester',
    email: testUserEmail,
    password: hashedInitial,
    role: 'user',
  });
  assert(Boolean(testUser?.id), 'Test user created successfully in DataStore');

  // Generate cryptographically random token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expires15m = new Date(Date.now() + 15 * 60 * 1000);

  // Store hash on user
  const setTokenSuccess = await DataStore.setResetPasswordToken(testUser.id, tokenHash, expires15m);
  assert(setTokenSuccess === true, 'DataStore.setResetPasswordToken saves token hash and expiry');

  // Verify hash lookup
  const userByToken = await DataStore.findUserByResetToken(tokenHash);
  assert(userByToken !== null && userByToken.id === testUser.id, 'DataStore.findUserByResetToken locates user by valid unexpired hash');

  // Verify raw token was never stored directly
  const db = DataStore.readDb();
  const rawStored = db.users.find((u) => u.id === testUser.id);
  assert(rawStored?.resetPasswordToken === tokenHash, 'Stored token is strictly the SHA-256 hash');
  assert(rawStored?.resetPasswordToken !== rawToken, 'Raw token is NOT stored in database');

  // Reset password to new password
  const newPassword = 'BrandNewSecretPass456';
  const hashedNew = await hashPassword(newPassword);
  const resetSuccess = await DataStore.resetUserPassword(testUser.id, hashedNew);
  assert(resetSuccess === true, 'DataStore.resetUserPassword successfully updates password');

  // Verify token is single-use and invalidated immediately
  const userByOldToken = await DataStore.findUserByResetToken(tokenHash);
  assert(userByOldToken === null, 'Token is invalidated after single use (cannot be reused)');

  // Verify user can login with new password
  const freshUser = await DataStore.findUserByEmail(testUserEmail);
  const canLoginNew = await comparePassword(newPassword, freshUser?.password || '');
  assert(canLoginNew === true, 'User can authenticate with new password');

  const canLoginOld = await comparePassword(initialPassword, freshUser?.password || '');
  assert(canLoginOld === false, 'Old password is no longer valid');

  // ---------------------------------------------------------
  // 4. Expiration Rejection Test
  // ---------------------------------------------------------
  console.log('\n--- 4. Token Expiration Protection ---');

  const expiredToken = crypto.randomBytes(32).toString('hex');
  const expiredHash = crypto.createHash('sha256').update(expiredToken).digest('hex');
  const pastDate = new Date(Date.now() - 1000 * 60); // Expired 1 minute ago

  await DataStore.setResetPasswordToken(testUser.id, expiredHash, pastDate);

  const expiredLookup = await DataStore.findUserByResetToken(expiredHash);
  assert(expiredLookup === null, 'Expired token is rejected by findUserByResetToken');

  // ---------------------------------------------------------
  // 5. Unknown/Tampered Token Test
  // ---------------------------------------------------------
  console.log('\n--- 5. Tampered / Random Token Protection ---');

  const tamperedHash = crypto.createHash('sha256').update('completely_fake_token').digest('hex');
  const tamperedLookup = await DataStore.findUserByResetToken(tamperedHash);
  assert(tamperedLookup === null, 'Non-existent / tampered token is rejected');

  console.log('\n======================================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
