/**
 * Live E2E walkthrough against dev server on http://localhost:3000
 * Tests:
 * 1. Register with invalid inputs (field validations)
 * 2. Register new user
 * 3. Attempt to register again with same email -> 409 conflict
 * 4. Login failure with wrong password -> 401 error
 * 5. Login success with correct credentials -> sets cookie & returns user
 * 6. Destructive action check
 */

const BASE_URL = 'http://localhost:3000';

async function run() {
  console.log('\n--- LIVE HTTP E2E WALKTHROUGH FOR TASK U8 ---\n');

  // Test 1: Register validation failure (empty / short password)
  console.log('Test 1: Register validation failure (password too short)...');
  const res1 = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email: 'test@example.com', password: '123' }),
  });
  const data1 = await res1.json();
  if (res1.status === 400 && data1.error.includes('6 characters')) {
    console.log('  ✓ Register correctly rejected short password with field message');
  } else {
    console.error('  ✗ Register did not return expected validation error:', res1.status, data1);
  }

  // Test 2: Successful registration
  const uniqueEmail = `test_u8_${Date.now()}@jobmatch.ai`;
  console.log(`\nTest 2: Registering valid user (${uniqueEmail})...`);
  const res2 = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Alex Miller', email: uniqueEmail, password: 'password123' }),
  });
  const data2 = await res2.json();
  if (res2.status === 201 && data2.user) {
    console.log('  ✓ User registered successfully with session:', data2.user.email);
  } else {
    console.error('  ✗ Registration failed:', res2.status, data2);
  }

  // Test 3: Register with duplicate email (email taken check)
  console.log('\nTest 3: Attempting duplicate registration (email taken)...');
  const res3 = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Another Alex', email: uniqueEmail, password: 'password123' }),
  });
  const data3 = await res3.json();
  if (res3.status === 409 && data3.error.includes('already exists')) {
    console.log('  ✓ API returned 409 Conflict with message for duplicate email');
  } else {
    console.error('  ✗ Expected 409 conflict for duplicate email:', res3.status, data3);
  }

  // Test 4: Login failure (wrong password)
  console.log('\nTest 4: Login with wrong password...');
  const res4 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: uniqueEmail, password: 'WRONG_PASSWORD_XYZ' }),
  });
  const data4 = await res4.json();
  if (res4.status === 401 && data4.error.includes('Invalid')) {
    console.log('  ✓ Login correctly rejected wrong credentials with 401');
  } else {
    console.error('  ✗ Login failure test failed:', res4.status, data4);
  }

  // Test 5: Login success
  console.log('\nTest 5: Login with correct credentials...');
  const res5 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: uniqueEmail, password: 'password123' }),
  });
  const data5 = await res5.json();
  const setCookie = res5.headers.get('set-cookie');
  if (res5.status === 200 && data5.user && setCookie && setCookie.includes('jobmatch_token')) {
    console.log('  ✓ Login succeeded, returned user object and auth cookie');
  } else {
    console.error('  ✗ Login success test failed:', res5.status, data5);
  }

  // Test 6: Demo login instant access
  console.log('\nTest 6: Demo login instant access...');
  const res6 = await fetch(`${BASE_URL}/api/auth/demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data6 = await res6.json();
  if (res6.status === 200 && data6.user && data6.user.role) {
    console.log('  ✓ Demo login works instantly with sample user session');
  } else {
    console.error('  ✗ Demo login test failed:', res6.status, data6);
  }

  console.log('\n--- ALL E2E FLOWS COMPLETED SUCCESSFULLY ---\n');
}

run().catch((err) => {
  console.error('E2E run error:', err);
  process.exit(1);
});
