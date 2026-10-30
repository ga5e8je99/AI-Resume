/**
 * E2E Test: Exhaust 3 Credits and Verify HTTP 402 Payment Required on 4th Request
 */

import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function isServerReady() {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`);
    return res.status === 401 || res.status === 200;
  } catch {
    return false;
  }
}

async function startServerIfNeeded() {
  if (await isServerReady()) {
    console.log(`✔ Server already listening on ${BASE_URL}`);
    return null;
  }

  console.log(`⚡ Starting Next.js test server on ${BASE_URL}...`);
  const server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    shell: true,
    stdio: 'ignore',
  });

  const startTime = Date.now();
  while (Date.now() - startTime < 45000) {
    if (await isServerReady()) {
      console.log(`✔ Server ready on ${BASE_URL}!`);
      return server;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('Server failed to start within timeout');
}

async function run() {
  console.log('============================================================');
  console.log('>>> E2E TEST: 3 CREDITS EXHAUSTION & HTTP 402 VERIFICATION <<<');
  console.log('============================================================\n');

  const serverProc = await startServerIfNeeded();
  const localDbPath = path.join(process.cwd(), '.data', 'db.json');
  let testUserId = null;

  try {
    const testEmail = `exhaust_${Date.now()}@test.com`;

    // 1. Register a fresh free user (receives 3 free AI credits by default)
    console.log(`👤 Registering test user ${testEmail}...`);
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Credit Exhaustion Tester',
        email: testEmail,
        password: 'Password123!',
      }),
    });

    assert.strictEqual(regRes.status, 201, 'Registration should return HTTP 201 Created');
    const setCookie = regRes.headers.get('set-cookie');
    assert(setCookie, 'Must receive session cookie on registration');

    const regData = await regRes.json();
    testUserId = regData.user?.id;
    console.log(`✔ User registered successfully (ID: ${testUserId}). Initial free credits: 3.`);

    // Extract cookie
    const tokenMatch = setCookie.match(/jobmatch_token=([^;]+)/);
    const cookieHeader = tokenMatch ? `jobmatch_token=${tokenMatch[1]}` : setCookie.split(';')[0];

    const authHeaders = {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    };

    const payload = {
      jobTitle: 'Software Engineer',
      companyName: 'Tech Innovations Ltd',
      jobDescription: 'Seeking a Full-Stack TypeScript and React developer with Node.js and MongoDB proficiency to build scalable enterprise web systems.',
      tone: 'formal',
      language: 'en',
    };

    // Request 1: Should succeed, credits become 2
    console.log('\n--- Request 1 (Credits: 3 -> 2) ---');
    const res1 = await fetch(`${BASE_URL}/api/cover-letter/generate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(payload),
    });
    assert.strictEqual(res1.status, 200, 'Request 1 should return HTTP 200');
    const data1 = await res1.json();
    assert.strictEqual(data1.success, true);
    assert.strictEqual(data1.creditsLeft, 2, 'Request 1 response should indicate 2 creditsLeft');
    console.log('✔ Request 1 succeeded (HTTP 200, 2 credits left).');

    // Request 2: Should succeed, credits become 1
    console.log('\n--- Request 2 (Credits: 2 -> 1) ---');
    const res2 = await fetch(`${BASE_URL}/api/cover-letter/generate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(payload),
    });
    assert.strictEqual(res2.status, 200, 'Request 2 should return HTTP 200');
    const data2 = await res2.json();
    assert.strictEqual(data2.creditsLeft, 1, 'Request 2 response should indicate 1 creditsLeft');
    console.log('✔ Request 2 succeeded (HTTP 200, 1 credit left).');

    // Request 3: Should succeed, credits become 0
    console.log('\n--- Request 3 (Credits: 1 -> 0) ---');
    const res3 = await fetch(`${BASE_URL}/api/cover-letter/generate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(payload),
    });
    assert.strictEqual(res3.status, 200, 'Request 3 should return HTTP 200');
    const data3 = await res3.json();
    assert.strictEqual(data3.creditsLeft, 0, 'Request 3 response should indicate 0 creditsLeft');
    console.log('✔ Request 3 succeeded (HTTP 200, 0 credits left).');

    // Request 4: MUST FAIL WITH HTTP 402 NO_CREDITS
    console.log('\n--- Request 4 (Credits: 0 -> Blocked by Credit Guard) ---');
    const res4 = await fetch(`${BASE_URL}/api/cover-letter/generate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(payload),
    });
    assert.strictEqual(res4.status, 402, 'Request 4 MUST return HTTP 402 Payment Required');
    const data4 = await res4.json();
    assert.strictEqual(data4.error, 'NO_CREDITS', 'Error response code must be NO_CREDITS');
    assert.strictEqual(data4.upgradeUrl, '/pricing', 'Error response must contain upgradeUrl: /pricing');
    console.log('✔ Request 4 correctly blocked with HTTP 402, error: "NO_CREDITS", and upgradeUrl: "/pricing"!');

    // Cleanup test user
    if (testUserId && fs.existsSync(localDbPath)) {
      try {
        const raw = fs.readFileSync(localDbPath, 'utf-8');
        const data = JSON.parse(raw);
        data.users = data.users.filter((u) => u.id !== testUserId);
        fs.writeFileSync(localDbPath, JSON.stringify(data, null, 2), 'utf-8');
      } catch {}
    }

    console.log('\n============================================================');
    console.log('>>> ALL EXHAUSTION & HTTP 402 CHECKS PASSED FLAWLESSLY! <<<');
    console.log('============================================================\n');
  } finally {
    if (serverProc) {
      console.log('Stopping test server...');
      serverProc.kill();
    }
  }
}

run().catch((err) => {
  console.error('E2E Test failed:', err);
  process.exit(1);
});
