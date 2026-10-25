/**
 * Automated Security & Permissions Test Suite for Phase 10
 * Verifies Authentication, Authorization, IDOR Protection, XSS Sanitization, and CSRF Mitigation.
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = 'jobmatch_ats_ai_resume_super_secret_jwt_key_2026';
const BASE_URL = 'http://localhost:3000';

function createToken(userId, email, name) {
  return jwt.sign({ userId, email, name, role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
}

const userAToken = createToken('user_security_a', 'user_a@example.com', 'User A Security');
const userBToken = createToken('user_security_b', 'user_b@example.com', 'User B Security');

function assert(condition, message) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`[PASS] ${message}`);
}

async function runSecurityTests() {
  console.log('--- Starting Phase 10: Cover Letter Security, Permissions & IDOR Test Suite ---\n');

  // Test 1: Unauthenticated Requests to Protected Endpoints Return 401
  const endpoints = [
    { method: 'GET', url: `${BASE_URL}/api/cover-letters` },
    { method: 'POST', url: `${BASE_URL}/api/cover-letters`, body: { title: 'Test' } },
    { method: 'GET', url: `${BASE_URL}/api/cover-letters/cl_sample_123` },
    { method: 'PATCH', url: `${BASE_URL}/api/cover-letters/cl_sample_123`, body: { title: 'Test' } },
    { method: 'DELETE', url: `${BASE_URL}/api/cover-letters/cl_sample_123` },
  ];

  for (const ep of endpoints) {
    const res = await fetch(ep.url, {
      method: ep.method,
      headers: { 'Content-Type': 'application/json' },
      body: ep.body ? JSON.stringify(ep.body) : undefined,
    });
    assert(res.status === 401, `Unauthenticated ${ep.method} ${ep.url} returns 401 Unauthorized`);
  }

  // Test 2: Create a Cover Letter under User A
  const createRes = await fetch(`${BASE_URL}/api/cover-letters`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userAToken}`,
    },
    body: JSON.stringify({
      title: "User A Confidential Cover Letter",
      companyName: "Secret Corp",
      jobTitle: "Security Lead",
      content: {
        salutation: "Dear Hiring Team,",
        introduction: "Confidential introduction text.",
        bodyParagraphs: ["Paragraph 1 for User A confidential application."],
        conclusion: "Best regards.",
        signOff: "Sincerely,",
        fullText: "Confidential Cover Letter Body Text for User A",
      },
    }),
  });

  assert(createRes.status === 201, 'User A creates cover letter with 201 Created');
  const createData = await createRes.json();
  const letterId = createData.coverLetter.id;
  assert(letterId && typeof letterId === 'string', 'Created letter has valid ID');

  // Test 3: IDOR Read Prevention - User B attempts to read User A's letter
  const idorReadRes = await fetch(`${BASE_URL}/api/cover-letters/${letterId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${userBToken}`,
    },
  });
  assert(idorReadRes.status === 404, 'IDOR Read Prevention: User B cannot read User A letter (returns 404)');

  // Test 4: IDOR Update Prevention - User B attempts to modify User A's letter
  const idorUpdateRes = await fetch(`${BASE_URL}/api/cover-letters/${letterId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userBToken}`,
    },
    body: JSON.stringify({
      title: "Hacked by User B",
      content: {
        salutation: "Hacked,",
        introduction: "Hacked introduction",
        bodyParagraphs: ["Hacked paragraph"],
        conclusion: "Hacked",
        signOff: "Hacked",
        fullText: "Maliciously modified text",
      },
    }),
  });
  assert(idorUpdateRes.status === 404, 'IDOR Update Prevention: User B cannot modify User A letter (returns 404)');

  // Verify User A's letter remains intact and untouched
  const verifyRes = await fetch(`${BASE_URL}/api/cover-letters/${letterId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${userAToken}`,
    },
  });
  const verifyData = await verifyRes.json();
  assert(verifyData.coverLetter.title === "User A Confidential Cover Letter", 'User A letter was not altered by User B');

  // Test 5: IDOR Delete Prevention - User B attempts to delete User A's letter
  const idorDeleteRes = await fetch(`${BASE_URL}/api/cover-letters/${letterId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${userBToken}`,
    },
  });
  assert(idorDeleteRes.status === 404, 'IDOR Delete Prevention: User B cannot delete User A letter (returns 404)');

  // Test 6: CSRF Origin Protection
  const csrfRes = await fetch(`${BASE_URL}/api/cover-letters`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userAToken}`,
      Origin: 'https://malicious-cross-origin-attacker.com',
    },
    body: JSON.stringify({
      title: "CSRF Cover Letter",
      companyName: "Victim Corp",
      jobTitle: "Developer",
      content: {
        salutation: "Dear Hiring Team,",
        introduction: "CSRF text",
        bodyParagraphs: ["CSRF"],
        conclusion: "CSRF",
        signOff: "CSRF",
        fullText: "CSRF",
      },
    }),
  });
  assert(csrfRes.status === 403, 'CSRF Protection: Blocks requests from unauthorized Origin header (403)');

  // Test 7: XSS Sanitization in CoverLetterService & DataStore
  const { CoverLetterService } = await import('../app/lib/coverLetterService.ts');
  const xssPayload = "<script>alert('XSS')</script>Google <img src=x onerror=alert(1)> & Co";
  const sanitized = CoverLetterService.sanitizeText(xssPayload);
  assert(!sanitized.includes('<script>'), 'XSS script tags are completely stripped');
  assert(!sanitized.includes('onerror='), 'XSS inline event handlers are completely stripped');
  assert(sanitized.includes('&lt;img'), 'Residual tags are safely escaped');

  // Test 8: Authorized Owner Delete
  const authDeleteRes = await fetch(`${BASE_URL}/api/cover-letters/${letterId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${userAToken}`,
    },
  });
  assert(authDeleteRes.status === 200, 'Authorized Owner User A successfully deletes their own letter (200)');

  console.log('\n--- Phase 10 Test Summary: All Security, IDOR, XSS, and CSRF Tests Passed ---');
}

runSecurityTests().catch((err) => {
  console.error('Security test runner error:', err);
  process.exit(1);
});
