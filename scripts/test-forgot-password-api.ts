/**
 * End-to-End API Route Tests for Forgot Password & Reset Password
 * Tests POST /api/auth/forgot-password and POST /api/auth/reset-password directly
 */

import { NextRequest } from 'next/server';
import crypto from 'crypto';
import DataStore from '../app/lib/datastore';
import { hashPassword, comparePassword } from '../app/lib/auth';
import { POST as forgotPasswordHandler } from '../app/api/auth/forgot-password/route';
import { POST as resetPasswordHandler } from '../app/api/auth/reset-password/route';

async function runApiTests() {
  console.log('\n======================================================');
  console.log('🌐 Testing Forgot & Reset Password API Routes End-to-End');
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

  // 1. Create a test user
  const email = `api_user_${Date.now()}@test.com`;
  const initialPassword = 'InitialPass123!';
  const hashedPassword = await hashPassword(initialPassword);

  const user = await DataStore.createUserAccount({
    name: 'API Tester',
    email,
    password: hashedPassword,
    role: 'user',
  });
  assert(Boolean(user?.id), 'Test user created');

  // 2. Request forgot-password with NON-EXISTENT email
  const reqUnknown = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: 'nonexistent_account@nowhere.com' }),
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.99' },
  });
  const resUnknown = await forgotPasswordHandler(reqUnknown);
  const dataUnknown = await resUnknown.json();
  assert(resUnknown.status === 200, 'Non-existent email returns HTTP 200 (anti-enumeration)');
  assert(dataUnknown.message.includes('If an account exists'), 'Non-existent email returns generic safe message');

  // 3. Request forgot-password with EXISTING email
  const reqExisting = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email, language: 'en' }),
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
  });
  const resExisting = await forgotPasswordHandler(reqExisting);
  const dataExisting = await resExisting.json();
  assert(resExisting.status === 200, 'Existing email returns HTTP 200');
  assert(dataExisting.message.includes('If an account exists'), 'Existing email returns exact same generic message');

  // Check that token was generated and stored on user
  const db = DataStore.readDb();
  const updatedUser = db.users.find((u) => u.id === user.id);
  assert(Boolean(updatedUser?.resetPasswordToken), 'User has resetPasswordToken set in database');
  assert(Boolean(updatedUser?.resetPasswordExpires), 'User has resetPasswordExpires set in database');

  // Verify expiry is approximately 15 minutes in future
  const expiresMs = new Date(updatedUser!.resetPasswordExpires!).getTime();
  const diffMinutes = (expiresMs - Date.now()) / (60 * 1000);
  assert(diffMinutes > 14 && diffMinutes <= 15.1, 'Token expiration is 15 minutes in future');

  // 4. Rate-limiting test on forgot-password endpoint
  console.log('\n--- Testing Rate Limiter ---');
  let rateLimited = false;
  for (let i = 0; i < 7; i++) {
    const rateReq = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: `ratelimit_${Date.now()}@test.com` }),
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.168.100.55' },
    });
    const rateRes = await forgotPasswordHandler(rateReq);
    if (rateRes.status === 429) {
      rateLimited = true;
      break;
    }
  }
  assert(rateLimited === true, 'Forgot-password endpoint enforces rate limit (HTTP 429 on abuse)');

  // 5. Test Reset Password API
  console.log('\n--- Testing Reset Password API ---');

  // Let's create a known raw token + hash
  const rawResetToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');
  await DataStore.setResetPasswordToken(user.id, tokenHash, new Date(Date.now() + 15 * 60 * 1000));

  // A. Short password (<6 chars)
  const reqShortPass = new NextRequest('http://localhost:3000/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token: rawResetToken, password: '123' }),
    headers: { 'Content-Type': 'application/json' },
  });
  const resShortPass = await resetPasswordHandler(reqShortPass);
  assert(resShortPass.status === 400, 'Password < 6 chars rejected with HTTP 400');

  // B. Bad token
  const reqBadToken = new NextRequest('http://localhost:3000/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token: 'completely_invalid_token', password: 'ValidPassword123' }),
    headers: { 'Content-Type': 'application/json' },
  });
  const resBadToken = await resetPasswordHandler(reqBadToken);
  assert(resBadToken.status === 400, 'Invalid token rejected with HTTP 400');

  // C. Valid token + valid new password
  const newPassword = 'SecureNewPassword2026!';
  const reqValidReset = new NextRequest('http://localhost:3000/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token: rawResetToken, password: newPassword }),
    headers: { 'Content-Type': 'application/json' },
  });
  const resValidReset = await resetPasswordHandler(reqValidReset);
  const dataValidReset = await resValidReset.json();
  assert(resValidReset.status === 200, 'Valid reset returns HTTP 200');
  assert(dataValidReset.success === true, 'Response indicates success: true');

  // D. Token Reuse (Single-Use check)
  const reqReuse = new NextRequest('http://localhost:3000/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token: rawResetToken, password: 'YetAnotherPassword999' }),
    headers: { 'Content-Type': 'application/json' },
  });
  const resReuse = await resetPasswordHandler(reqReuse);
  assert(resReuse.status === 400, 'Reusing previous token fails with HTTP 400 (single-use enforced)');

  // E. Authentication confirmation
  const userAfterReset = await DataStore.findUserByEmail(email);
  const authOk = await comparePassword(newPassword, userAfterReset?.password || '');
  assert(authOk === true, 'User password was updated in datastore and matches new password');

  console.log('\n======================================================');
  console.log(`API Results: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) process.exit(1);
}

runApiTests().catch((err) => {
  console.error('API Test crashed:', err);
  process.exit(1);
});
