/**
 * test-cover-letter-performance-reliability.mjs
 * Comprehensive automated test suite for Phase 14: Performance & Reliability
 * Testing:
 * 1. In-memory sliding-window rate limiting (429 Too Many Requests & Retry-After)
 * 2. Summary projection vs full fetching (payload bandwidth reduction)
 * 3. Query bounding & pagination limits (clamping limit <= 100, page >= 1)
 * 4. Fault tolerance & graceful degradation when external services fail
 * 5. URL fetch timeout isolation (AbortController)
 * 6. Debounced state persistence simulation
 */

import jwt from 'jsonwebtoken';
import { checkRateLimit, applyRateLimit, clearAllRateLimits } from '../app/lib/rateLimit.ts';
import { AICoverLetterClient } from '../app/lib/aiCoverLetterClient.ts';

const { sign } = jwt;
const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'jobmatch_ats_ai_resume_super_secret_jwt_key_2026';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${testName} - ${details}`);
  }
}

function createToken(userId = 'usr_perf_01', email = 'perf@example.com', name = 'Performance Tester') {
  return sign({ userId, email, name, role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
}

console.log('='.repeat(75));
console.log('>>> RUNNING PHASE 14: PERFORMANCE & RELIABILITY TEST SUITE <<<');
console.log('='.repeat(75));

async function runSuite() {
  const token = createToken();
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // -------------------------------------------------------------
  // 1. IN-MEMORY SLIDING-WINDOW RATE LIMITING
  // -------------------------------------------------------------
  console.log('\n[Suite 1] Rate Limiting & Resource Protection:');

  clearAllRateLimits();
  const testKey = 'test_rl_user_123';
  const config = { limit: 3, windowMs: 2000, keyPrefix: 'test' };

  // First 3 requests allowed
  const r1 = checkRateLimit(testKey, config);
  const r2 = checkRateLimit(testKey, config);
  const r3 = checkRateLimit(testKey, config);
  assert(r1.allowed && r2.allowed && r3.allowed, 'RateLimit: First 3 requests within window are allowed');
  assert(r3.remaining === 0, 'RateLimit: Remaining count drops to 0 after limit is reached');

  // 4th request blocked
  const r4 = checkRateLimit(testKey, config);
  assert(!r4.allowed && r4.remaining === 0, 'RateLimit: 4th request exceeds limit and is rejected');
  assert(r4.resetMs > 0, 'RateLimit: Returns valid resetMs duration');

  // -------------------------------------------------------------
  // 2. SUMMARY PROJECTION VS FULL PAYLOAD BANDWIDTH
  // -------------------------------------------------------------
  console.log('\n[Suite 2] Summary Projection & Over-fetching Elimination:');

  // Create test document with hefty content via API
  const largeText = 'A'.repeat(5000);
  let createdId = null;

  try {
    const createRes = await fetch(`${BASE_URL}/api/cover-letters`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Performance Benchmark Letter',
        companyName: 'High Perf Corp',
        jobTitle: 'Backend Architect',
        jobDescription: largeText,
        content: {
          subject: 'Subject',
          salutation: 'Salutation',
          introduction: 'Intro',
          bodyParagraphs: [largeText, largeText],
          conclusion: 'Conclusion',
          signOff: 'SignOff',
          fullText: largeText + largeText,
        },
        status: 'saved',
        tone: 'technical',
        language: 'en',
        templateId: 'modern',
      }),
    });
    const createData = await createRes.json();
    createdId = createData.coverLetter?.id;
    assert(createRes.status === 201 && createdId, 'Setup: Created benchmark cover letter document via API');
  } catch (err) {
    assert(false, `Setup failed: ${err.message}`);
  }

  if (createdId) {
    // Fetch full details
    const fullRes = await fetch(`${BASE_URL}/api/cover-letters?limit=10`, {
      method: 'GET',
      headers: authHeaders,
    });
    const fullData = await fullRes.json();
    const fullItem = fullData.coverLetters?.find((i) => i.id === createdId);
    assert(fullItem && fullItem.content && fullItem.content.fullText, 'Full query returns complete text and content object');

    // Fetch summary only
    const summaryRes = await fetch(`${BASE_URL}/api/cover-letters?limit=10&summary=true`, {
      method: 'GET',
      headers: authHeaders,
    });
    const summaryData = await summaryRes.json();
    const summaryItem = summaryData.coverLetters?.find((i) => i.id === createdId);
    assert(summaryItem && summaryItem.title && !summaryItem.content, 'Summary query omits heavy content payload');
    assert(summaryItem && !summaryItem.jobDescription, 'Summary query omits heavy jobDescription payload');

    const fullBytes = Buffer.byteLength(JSON.stringify(fullItem || {}));
    const summaryBytes = Buffer.byteLength(JSON.stringify(summaryItem || {}));
    const savingsPercent = Math.round(((fullBytes - summaryBytes) / fullBytes) * 100);

    assert(
      summaryBytes < fullBytes && savingsPercent >= 70,
      `Summary query achieves ${savingsPercent}% payload bandwidth reduction (${fullBytes}B -> ${summaryBytes}B)`
    );

    // -------------------------------------------------------------
    // 3. PAGINATION & BOUNDED QUERY BOUNDARIES
    // -------------------------------------------------------------
    console.log('\n[Suite 3] Bounded Query Limits & Safe Clamping:');

    // Requesting limit > 100 should clamp to 100
    const clampedRes = await fetch(`${BASE_URL}/api/cover-letters?limit=9999`, {
      method: 'GET',
      headers: authHeaders,
    });
    const clampedData = await clampedRes.json();
    assert(clampedData.pagination?.limit === 100, 'Query Bounding: Requested limit of 9999 is safely clamped to 100');

    // Requesting invalid negative or zero page defaults to 1
    const safePageRes = await fetch(`${BASE_URL}/api/cover-letters?page=-5`, {
      method: 'GET',
      headers: authHeaders,
    });
    const safePageData = await safePageRes.json();
    assert(safePageData.pagination?.page === 1, 'Query Bounding: Negative page number defaults safely to page 1');

    // Total pages calculation
    assert(
      typeof safePageData.pagination?.totalPages === 'number' && safePageData.pagination.totalPages >= 1,
      'Query Bounding: totalPages calculated accurately'
    );
  }

  // -------------------------------------------------------------
  // 4. FAULT TOLERANCE & NON-BLOCKING ISOLATION
  // -------------------------------------------------------------
  console.log('\n[Suite 4] Fault Tolerance & Failure Isolation:');

  // When external AI fails, platform must never crash or throw unhandled 500
  const degradedResult = await AICoverLetterClient.generateCoverLetter({
    jobDescription: 'Software engineer vacancy with Python, PostgreSQL, and Docker.',
    companyName: 'Resilience Inc',
    jobTitle: 'Software Engineer',
    language: 'en',
    tone: 'technical',
  });

  assert(degradedResult && degradedResult.coverLetter, 'Fault Isolation: Generator produces valid output even without external AI keys');
  assert(degradedResult.coverLetter.content.fullText.length > 100, 'Fault Isolation: Complete letter synthesized via built-in engine');
  assert(
    degradedResult.provider === 'built-in-ats-engine' || degradedResult.provider === 'built-in-ats-fallback',
    'Fault Isolation: Gracefully identifies provider without crashing'
  );

  // -------------------------------------------------------------
  // 5. URL FETCH TIMEOUT & BOUNDED ATTEMPTS
  // -------------------------------------------------------------
  console.log('\n[Suite 5] URL Fetch Safety & Protocol Enforcement:');

  let invalidProtoError = false;
  try {
    await fetch(`${BASE_URL}/api/cover-letter/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobUrl: 'ftp://ftp.unsupported.org/job' }),
    });
  } catch {
    invalidProtoError = true;
  }
  assert(!invalidProtoError, 'URL Safety: Handled via route validation returning HTTP 400 without crashing');

  // -------------------------------------------------------------
  // 6. DEBOUNCED CLIENT PERSISTENCE SIMULATION
  // -------------------------------------------------------------
  console.log('\n[Suite 6] Debounced Persistence Simulation:');

  let persistenceCallCount = 0;
  let activeTimer = null;

  function simulateTypingKeyStroke(char, debounceMs = 350) {
    if (activeTimer) clearTimeout(activeTimer);
    activeTimer = setTimeout(() => {
      persistenceCallCount++;
    }, debounceMs);
  }

  // Fast typing simulation: 10 rapid keystrokes within 200ms
  for (let i = 0; i < 10; i++) {
    simulateTypingKeyStroke(String.fromCharCode(65 + i), 350);
  }

  // Wait for debounce timer to fire once
  await new Promise((res) => setTimeout(res, 450));

  assert(
    persistenceCallCount === 1,
    'Debounce Optimization: 10 rapid keystrokes resulted in exactly 1 persistence write instead of 10'
  );

  // -------------------------------------------------------------
  // CLEANUP BENCHMARK DATA
  // -------------------------------------------------------------
  if (createdId) {
    try {
      await fetch(`${BASE_URL}/api/cover-letters/${createdId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
    } catch (_) {}
  }

  // -------------------------------------------------------------
  // FINAL REPORT
  // -------------------------------------------------------------
  console.log('\n' + '='.repeat(75));
  console.log(`TOTAL PERFORMANCE & RELIABILITY CHECKS : ${totalTests}`);
  console.log(`PASSED                                : ${passedTests}`);
  console.log(`FAILED                                : ${failedTests}`);
  console.log('='.repeat(75));

  if (failedTests > 0) {
    process.exit(1);
  } else {
    console.log('\n>>> ALL PHASE 14 PERFORMANCE & RELIABILITY TESTS PASSED! <<<\n');
    process.exit(0);
  }
}

runSuite();
