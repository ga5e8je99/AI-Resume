import jwt from 'jsonwebtoken';
const { sign } = jwt;

const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'jobmatch_ats_ai_resume_super_secret_jwt_key_2026';

// Helper to generate a valid user token
function createTestToken(userId = 'usr_002', email = 'sarah.jenkins@example.com', name = 'Sarah Jenkins') {
  return sign({ userId, email, name, role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
}

async function runTests() {
  console.log('--- Starting Cover Letter API & Validation Test Suite ---\n');
  const token = createTestToken();
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      failed++;
    }
  }

  // 1. POST /api/cover-letter/generate (Validation error - empty body)
  try {
    const res = await fetch(`${BASE_URL}/api/cover-letter/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    assert(res.status === 400 && data.success === false, 'POST /generate with empty body returns 400 Bad Request');
  } catch (err) {
    assert(false, `POST /generate empty body check failed: ${err.message}`);
  }

  // 2. POST /api/cover-letter/generate (SSRF Protection)
  try {
    const res = await fetch(`${BASE_URL}/api/cover-letter/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobUrl: 'http://127.0.0.1:8080/internal-api',
        tone: 'formal',
        language: 'ar',
      }),
    });
    const data = await res.json();
    assert(res.status === 422 && data.success === false, 'POST /generate SSRF attempt to 127.0.0.1 blocked with 422');
  } catch (err) {
    assert(false, `POST /generate SSRF check failed: ${err.message}`);
  }

  // 3. POST /api/cover-letter/generate (Valid payload - Arabic leadership)
  let generatedLetter = null;
  try {
    const res = await fetch(`${BASE_URL}/api/cover-letter/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobDescription: 'مطلوب مدير مشروعات تقنية لقيادة فرق هندسة البرمجيات وتطبيق Agile وScrum وتطوير الأنظمة السحابية وإدارة الميزانيات وتحليل المخاطر.',
        companyName: 'شركة تقنية الرياض',
        jobTitle: 'مدير مشروعات تقنية',
        tone: 'leadership',
        language: 'ar',
        sender: {
          fullName: 'سارة إبراهيم',
          email: 'sarah.ibrahim@example.com',
        },
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true && data.coverLetter?.content?.fullText, 'POST /generate valid Arabic letter returns 200 with content');
    generatedLetter = data.coverLetter;
  } catch (err) {
    assert(false, `POST /generate valid Arabic letter failed: ${err.message}`);
  }

  // 4. POST /api/cover-letter/extract-keywords
  try {
    const res = await fetch(`${BASE_URL}/api/cover-letter/extract-keywords`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Looking for a Senior React and Next.js developer with TypeScript, Docker, and PostgreSQL experience in an Agile squad.',
      }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true && Array.isArray(data.keywords) && data.keywords.includes('React'), 'POST /extract-keywords returns detected keywords');
  } catch (err) {
    assert(false, `POST /extract-keywords failed: ${err.message}`);
  }

  // 5. GET /api/cover-letters (Unauthenticated)
  try {
    const res = await fetch(`${BASE_URL}/api/cover-letters`);
    assert(res.status === 401, 'GET /api/cover-letters without token returns 401 Unauthorized');
  } catch (err) {
    assert(false, `GET /api/cover-letters 401 check failed: ${err.message}`);
  }

  // 6. GET /api/cover-letters (Authenticated with pagination)
  try {
    const res = await fetch(`${BASE_URL}/api/cover-letters?page=1&limit=10&status=all`, {
      headers: authHeaders,
    });
    const data = await res.json();
    assert(res.status === 200 && data.success === true && Array.isArray(data.coverLetters) && data.pagination?.page === 1, 'GET /api/cover-letters returns 200 with pagination structure');
  } catch (err) {
    assert(false, `GET /api/cover-letters authenticated check failed: ${err.message}`);
  }

  // 7. POST /api/cover-letters (Validation error - empty content)
  try {
    const res = await fetch(`${BASE_URL}/api/cover-letters`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title: 'Empty Letter' }),
    });
    const data = await res.json();
    assert(res.status === 400 && data.success === false, 'POST /api/cover-letters with missing content returns 400 Bad Request');
  } catch (err) {
    assert(false, `POST /api/cover-letters missing content check failed: ${err.message}`);
  }

  // 8. POST /api/cover-letters (Valid create - returns 201 Created)
  let savedId = null;
  try {
    const res = await fetch(`${BASE_URL}/api/cover-letters`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'خطاب تقديم لشركة الرياض للتقنية',
        companyName: 'شركة الرياض للتقنية',
        jobTitle: 'مدير مشروعات',
        tone: 'leadership',
        language: 'ar',
        status: 'draft',
        content: generatedLetter?.content || {
          salutation: 'عناية فريق التوظيف',
          introduction: 'يسعدني التقدم للوظيفة...',
          bodyParagraphs: ['فقرة أولى', 'فقرة ثانية'],
          conclusion: 'شكرا لكم',
          signOff: 'مع التحية',
          fullText: 'نص كامل للخطاب...',
        },
      }),
    });
    const data = await res.json();
    assert(res.status === 201 && data.success === true && data.coverLetter?.id, 'POST /api/cover-letters creates document with 201 Created');
    savedId = data.coverLetter?.id;
  } catch (err) {
    assert(false, `POST /api/cover-letters create check failed: ${err.message}`);
  }

  // 9. GET /api/cover-letters/[id]
  if (savedId) {
    try {
      const res = await fetch(`${BASE_URL}/api/cover-letters/${savedId}`, {
        headers: authHeaders,
      });
      const data = await res.json();
      assert(res.status === 200 && data.success === true && data.coverLetter?.id === savedId, 'GET /api/cover-letters/[id] returns 200 with item');
    } catch (err) {
      assert(false, `GET /api/cover-letters/[id] failed: ${err.message}`);
    }

    // 10. PATCH /api/cover-letters/[id] (Partial update)
    try {
      const res = await fetch(`${BASE_URL}/api/cover-letters/${savedId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status: 'saved', title: 'خطاب تقديم محدث - شركة الرياض' }),
      });
      const data = await res.json();
      assert(res.status === 200 && data.success === true && data.coverLetter?.status === 'saved', 'PATCH /api/cover-letters/[id] performs partial update');
    } catch (err) {
      assert(false, `PATCH /api/cover-letters/[id] failed: ${err.message}`);
    }

    // 11. DELETE /api/cover-letters/[id]
    try {
      const res = await fetch(`${BASE_URL}/api/cover-letters/${savedId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const data = await res.json();
      assert(res.status === 200 && data.success === true, 'DELETE /api/cover-letters/[id] removes item and returns 200');
    } catch (err) {
      assert(false, `DELETE /api/cover-letters/[id] failed: ${err.message}`);
    }
  }

  // 12. GET /api/cover-letters/[id] non-existent returns 404
  try {
    const res = await fetch(`${BASE_URL}/api/cover-letters/nonexistent_id_999`, {
      headers: authHeaders,
    });
    assert(res.status === 404, 'GET /api/cover-letters/[id] non-existent returns 404');
  } catch (err) {
    assert(false, `GET 404 check failed: ${err.message}`);
  }

  console.log(`\n--- Test Summary: ${passed} Passed, ${failed} Failed ---`);
  if (failed > 0) process.exit(1);
}

runTests();
