/**
 * test-cover-letter-edge-cases.mjs
 * Comprehensive automated test suite for Phase 12: Automated Testing
 * Testing the 6 core dimensions:
 * 1. SUCCESS: All valid permutations of tone, language, templates, APIs, and updates
 * 2. FAILURE: Empty descriptions, dead URLs, missing content, non-existent documents
 * 3. INVALID INPUTS: Bad tones, bad languages, bad templates, length boundary violations, malformed email/phone
 * 4. PERMISSIONS: Unauthenticated requests, IDOR on letters and resumes, CSRF violations, XSS sanitization
 * 5. EMPTY DATA: Fallbacks for missing company, title, manager, contacts, whitespace-only fields
 * 6. DEDUPLICATION: Keyword deduplication, smart draft sync (PATCH vs POST), double-submission locks
 */

import jwt from 'jsonwebtoken';
import { CoverLetterService } from '../app/lib/coverLetterService.ts';

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

function createToken(userId, email, name, role = 'user') {
  return sign({ userId, email, name, role }, JWT_SECRET, { expiresIn: '1h' });
}

console.log('='.repeat(75));
console.log('>>> RUNNING PHASE 12: AUTOMATED TESTING - EDGE CASES & DIMENSIONS <<<');
console.log('='.repeat(75));

async function runEdgeCasesSuite() {
  const userAToken = createToken('usr_edge_a', 'user_a@example.com', 'أحمد القحطاني');
  const userBToken = createToken('usr_edge_b', 'user_b@example.com', 'سارة الشمري');

  const authHeadersA = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${userAToken}`,
  };

  const authHeadersB = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${userBToken}`,
  };

  // =========================================================================
  // 1. SUCCESS DIMENSION (حالات النجاح التامة)
  // =========================================================================
  console.log('\n[Dimension 1: SUCCESS - اختبارات النجاح والمسارات الصحيحة]');

  // 1.1 All 4 Tones in Arabic generate structured letters
  const tones = ['formal', 'technical', 'leadership', 'enthusiastic'];
  for (const t of tones) {
    const letter = CoverLetterService.generateCoverLetter({
      jobDescription: 'مطلوب مهندس ذكاء اصطناعي ونظم موزعة لتطوير منصة معالجة البيانات الضخمة.',
      companyName: 'تقنية المستقبل',
      jobTitle: 'مهندس ذكاء اصطناعي',
      tone: t,
      language: 'ar',
      templateId: 'modern',
    });
    assert(
      letter && letter.content.fullText.length > 200 && letter.tone === t,
      `Success: Arabic generation with tone "${t}" produces complete structured letter`
    );
  }

  // 1.2 All 4 Tones in English generate structured letters
  for (const t of tones) {
    const letter = CoverLetterService.generateCoverLetter({
      jobDescription: 'Seeking a Senior Full Stack Engineer with Next.js, Node.js, and AWS experience.',
      companyName: 'Tech Horizons',
      jobTitle: 'Senior Full Stack Engineer',
      tone: t,
      language: 'en',
      templateId: 'ats-friendly',
    });
    assert(
      letter && letter.content.fullText.length > 200 && letter.tone === t,
      `Success: English generation with tone "${t}" produces complete structured letter`
    );
  }

  // 1.3 Template inheritance and presets
  const templates = ['compact', 'modern', 'classic', 'ats-friendly'];
  for (const tmpl of templates) {
    const letter = CoverLetterService.generateCoverLetter(
      {
        jobDescription: 'Software Developer vacancy requiring TypeScript and React.',
        language: 'en',
        templateId: tmpl,
      },
      { templateId: tmpl }
    );
    assert(letter.templateId === tmpl, `Success: Correctly applies templateId "${tmpl}"`);
  }

  // 1.4 API POST /api/cover-letters creates document with 201
  let createdLetterId = null;
  try {
    const res = await fetch(`${BASE_URL}/api/cover-letters`, {
      method: 'POST',
      headers: authHeadersA,
      body: JSON.stringify({
        title: 'خطاب مهندس برمجيات - تقنية المستقبل',
        companyName: 'تقنية المستقبل',
        jobTitle: 'مهندس برمجيات أول',
        tone: 'technical',
        language: 'ar',
        templateId: 'modern',
        status: 'saved',
        sender: {
          fullName: 'أحمد القحطاني',
          email: 'user_a@example.com',
          phone: '+966 50 111 2233',
        },
        recipient: {
          companyName: 'تقنية المستقبل',
          jobTitle: 'مهندس برمجيات أول',
          hiringManager: 'أحمد المدير',
        },
        content: {
          subject: 'طلب التقديم لشغل وظيفة مهندس برمجيات',
          salutation: 'عناية إدارة الموارد البشرية،',
          introduction: 'يسعدني التقدم بطلبي لشغل الوظيفة المعلنة.',
          bodyParagraphs: ['الفقرة الأولى التفصيلية', 'الفقرة الثانية'],
          conclusion: 'أشكركم على وقتكم واهتمامكم.',
          signOff: 'وتفضلوا بقبول التحية،\nأحمد القحطاني',
          fullText: 'نص الخطاب الكامل النقي والمفصل...',
        },
      }),
    });
    const data = await res.json();
    assert(res.status === 201 && data.success && data.coverLetter?.id, 'Success: POST /api/cover-letters creates draft (201 Created)');
    createdLetterId = data.coverLetter?.id;
  } catch (err) {
    assert(false, `POST /api/cover-letters creation failed: ${err.message}`);
  }

  // 1.5 API GET /api/cover-letters/[id] retrieves created letter
  if (createdLetterId) {
    try {
      const res = await fetch(`${BASE_URL}/api/cover-letters/${createdLetterId}`, {
        method: 'GET',
        headers: authHeadersA,
      });
      const data = await res.json();
      assert(res.status === 200 && data.success && data.coverLetter.id === createdLetterId, 'Success: GET /api/cover-letters/[id] returns letter');
    } catch (err) {
      assert(false, `GET /api/cover-letters/[id] failed: ${err.message}`);
    }
  }

  // 1.6 API PATCH /api/cover-letters/[id] performs partial update
  if (createdLetterId) {
    try {
      const res = await fetch(`${BASE_URL}/api/cover-letters/${createdLetterId}`, {
        method: 'PATCH',
        headers: authHeadersA,
        body: JSON.stringify({
          title: 'عنوان محدث للخطاب',
          status: 'saved',
        }),
      });
      const data = await res.json();
      assert(res.status === 200 && data.success && data.coverLetter.title === 'عنوان محدث للخطاب', 'Success: PATCH /api/cover-letters/[id] updates title');
    } catch (err) {
      assert(false, `PATCH /api/cover-letters/[id] failed: ${err.message}`);
    }
  }

  // =========================================================================
  // 2. FAILURE DIMENSION (حالات الفشل ومعالجة الأخطاء)
  // =========================================================================
  console.log('\n[Dimension 2: FAILURE - حالات الفشل والتعامل مع الأخطاء]');

  // 2.1 Empty payload on generate returns 400
  try {
    const res = await fetch(`${BASE_URL}/api/cover-letter/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(res.status === 400, 'Failure: Empty body on /generate returns 400 Bad Request');
  } catch (err) {
    assert(false, `Empty body test failed: ${err.message}`);
  }

  // 2.2 Short description (<25 chars) on generate returns 400
  try {
    const res = await fetch(`${BASE_URL}/api/cover-letter/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobDescription: 'Short desc' }),
    });
    const data = await res.json();
    assert(res.status === 400 && data.error.includes('قصير جداً'), 'Failure: Short description (<25 chars) returns 400 with Arabic error message');
  } catch (err) {
    assert(false, `Short description test failed: ${err.message}`);
  }

  // 2.3 Non-existent URL or unreachable host returns 422
  try {
    const res = await fetch(`${BASE_URL}/api/cover-letter/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobUrl: 'https://non-existent-unreachable-domain-123456789.org/job',
      }),
    });
    assert(res.status === 422, 'Failure: Unreachable jobUrl returns 422 Unprocessable Entity');
  } catch (err) {
    assert(false, `Unreachable jobUrl test failed: ${err.message}`);
  }

  // 2.4 Missing content on save returns 400
  try {
    const res = await fetch(`${BASE_URL}/api/cover-letters`, {
      method: 'POST',
      headers: authHeadersA,
      body: JSON.stringify({ title: 'Just a title without content' }),
    });
    assert(res.status === 400, 'Failure: Missing content on draft save returns 400 Bad Request');
  } catch (err) {
    assert(false, `Missing content test failed: ${err.message}`);
  }

  // 2.5 Non-existent letter ID on GET returns 404
  try {
    const res = await fetch(`${BASE_URL}/api/cover-letters/cl_non_existent_99999`, {
      method: 'GET',
      headers: authHeadersA,
    });
    assert(res.status === 404, 'Failure: Non-existent letter ID returns 404 Not Found');
  } catch (err) {
    assert(false, `Non-existent ID test failed: ${err.message}`);
  }

  // 2.6 Malformed letter ID syntax returns 400
  try {
    const res = await fetch(`${BASE_URL}/api/cover-letters/invalid@id!with*special`, {
      method: 'GET',
      headers: authHeadersA,
    });
    assert(res.status === 400, 'Failure: Malformed letter ID syntax returns 400 Bad Request');
  } catch (err) {
    assert(false, `Malformed ID test failed: ${err.message}`);
  }

  // =========================================================================
  // 3. INVALID INPUTS DIMENSION (المدخلات غير الصحيحة والحدود المنطقية)
  // =========================================================================
  console.log('\n[Dimension 3: INVALID INPUTS - المدخلات غير الصحيحة والحدود القصوى]');

  // 3.1 Invalid tone
  const invTone = CoverLetterService.validateRequest({
    jobDescription: 'Valid job description that is well over twenty five characters long.',
    tone: 'extremely_informal_bro',
  });
  assert(!invTone.valid, 'Invalid Inputs: Rejects unsupported tone value');

  // 3.2 Invalid language
  const invLang = CoverLetterService.validateRequest({
    jobDescription: 'Valid job description that is well over twenty five characters long.',
    language: 'ru',
  });
  assert(!invLang.valid, 'Invalid Inputs: Rejects unsupported language code');

  // 3.3 Invalid templateId
  const invTmpl = CoverLetterService.validateRequest({
    jobDescription: 'Valid job description that is well over twenty five characters long.',
    templateId: 'cyberpunk_glow_99',
  });
  assert(!invTmpl.valid, 'Invalid Inputs: Rejects unsupported templateId');

  // 3.4 Boundary: companyName > 120 chars
  const invComp = CoverLetterService.validateRequest({
    jobDescription: 'Valid job description that is well over twenty five characters long.',
    companyName: 'A'.repeat(125),
  });
  assert(!invComp.valid && invComp.error.includes('120'), 'Invalid Inputs: Rejects companyName longer than 120 chars');

  // 3.5 Boundary: jobTitle > 120 chars
  const invTitle = CoverLetterService.validateRequest({
    jobDescription: 'Valid job description that is well over twenty five characters long.',
    jobTitle: 'B'.repeat(125),
  });
  assert(!invTitle.valid && invTitle.error.includes('120'), 'Invalid Inputs: Rejects jobTitle longer than 120 chars');

  // 3.6 Boundary: customNotes > 500 chars
  const invNotes = CoverLetterService.validateRequest({
    jobDescription: 'Valid job description that is well over twenty five characters long.',
    customNotes: 'C'.repeat(505),
  });
  assert(!invNotes.valid && invNotes.error.includes('500'), 'Invalid Inputs: Rejects customNotes longer than 500 chars');

  // 3.7 Boundary: jobDescription > 35000 chars
  const invDesc = CoverLetterService.validateRequest({
    jobDescription: 'D'.repeat(35005),
  });
  assert(!invDesc.valid && invDesc.error.includes('الحد الأقصى'), 'Invalid Inputs: Rejects jobDescription longer than 35,000 chars');

  // 3.8 Malformed email
  const invEmail = CoverLetterService.validateRequest({
    jobDescription: 'Valid job description that is well over twenty five characters long.',
    sender: { email: 'bad-email-without-at-domain' },
  });
  assert(!invEmail.valid && invEmail.error.includes('البريد الإلكتروني'), 'Invalid Inputs: Rejects malformed email string');

  // 3.9 Malformed phone
  const invPhone = CoverLetterService.validateRequest({
    jobDescription: 'Valid job description that is well over twenty five characters long.',
    sender: { phone: 'phone-with-letters-and-bad-chars$$$' },
  });
  assert(!invPhone.valid && invPhone.error.includes('الهاتف'), 'Invalid Inputs: Rejects malformed phone format');

  // 3.10 Non-HTTP protocols in jobUrl
  const invProto = CoverLetterService.validateRequest({
    jobUrl: 'javascript:alert(document.cookie)',
  });
  assert(!invProto.valid, 'Invalid Inputs: Rejects javascript: URI in jobUrl');

  // =========================================================================
  // 4. PERMISSIONS & AUTHORIZATION DIMENSION (الصلاحيات والتوثيق والأمان)
  // =========================================================================
  console.log('\n[Dimension 4: PERMISSIONS & AUTHORIZATION - الصلاحيات والحماية]');

  // 4.1 Unauthenticated requests to /api/cover-letters are rejected with 401
  try {
    const resGet = await fetch(`${BASE_URL}/api/cover-letters`);
    assert(resGet.status === 401, 'Permissions: GET /api/cover-letters without token returns 401 Unauthorized');

    const resPost = await fetch(`${BASE_URL}/api/cover-letters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: { fullText: 'Sample' } }),
    });
    assert(resPost.status === 401, 'Permissions: POST /api/cover-letters without token returns 401 Unauthorized');
  } catch (err) {
    assert(false, `Unauthenticated check failed: ${err.message}`);
  }

  // 4.2 IDOR Read Prevention: User B cannot access User A's letter (returns 404)
  if (createdLetterId) {
    try {
      const res = await fetch(`${BASE_URL}/api/cover-letters/${createdLetterId}`, {
        method: 'GET',
        headers: authHeadersB, // User B
      });
      assert(res.status === 404, 'Permissions: IDOR Read Blocked (User B gets 404 for User A letter)');
    } catch (err) {
      assert(false, `IDOR read check failed: ${err.message}`);
    }
  }

  // 4.3 IDOR Update Prevention: User B cannot modify User A's letter (returns 404)
  if (createdLetterId) {
    try {
      const res = await fetch(`${BASE_URL}/api/cover-letters/${createdLetterId}`, {
        method: 'PATCH',
        headers: authHeadersB, // User B
        body: JSON.stringify({ title: 'Hacked by User B' }),
      });
      assert(res.status === 404, 'Permissions: IDOR Update Blocked (User B gets 404 attempting to edit User A letter)');
    } catch (err) {
      assert(false, `IDOR update check failed: ${err.message}`);
    }
  }

  // 4.4 IDOR Delete Prevention: User B cannot delete User A's letter (returns 404)
  if (createdLetterId) {
    try {
      const res = await fetch(`${BASE_URL}/api/cover-letters/${createdLetterId}`, {
        method: 'DELETE',
        headers: authHeadersB, // User B
      });
      assert(res.status === 404, 'Permissions: IDOR Delete Blocked (User B gets 404 attempting to delete User A letter)');
    } catch (err) {
      assert(false, `IDOR delete check failed: ${err.message}`);
    }
  }

  // 4.5 CSRF Origin Verification blocks forged origin
  try {
    const res = await fetch(`${BASE_URL}/api/cover-letters`, {
      method: 'POST',
      headers: {
        ...authHeadersA,
        Origin: 'https://malicious-phishing-site.com',
      },
      body: JSON.stringify({ content: { fullText: 'Forged request' } }),
    });
    assert(res.status === 403, 'Permissions: CSRF origin mismatch returns 403 Forbidden');
  } catch (err) {
    assert(false, `CSRF check failed: ${err.message}`);
  }

  // 4.6 XSS Sanitization strips malicious code
  const dirtyInput = '<script>alert("PWNED")</script><img src=x onerror=alert(1)>Hello World';
  const cleanInput = CoverLetterService.sanitizeText(dirtyInput);
  assert(!cleanInput.includes('<script>') && !cleanInput.includes('onerror='), 'Permissions: XSS tags and event handlers stripped');

  // =========================================================================
  // 5. EMPTY DATA & FALLBACK DIMENSION (البيانات الفارغة والافتراضيات المرنة)
  // =========================================================================
  console.log('\n[Dimension 5: EMPTY DATA & FALLBACKS - البيانات الفارغة والبدائل الافتراضية]');

  // 5.1 Empty candidate contact details format cleanly without dangling delimiters
  const letterNoContact = CoverLetterService.generateCoverLetter({
    jobDescription: 'Software engineer vacancy with React and TypeScript.',
    companyName: 'Acme Corp',
    jobTitle: 'Frontend Engineer',
    language: 'en',
    sender: {
      fullName: 'John Doe',
      email: '',
      phone: '',
    },
  });
  assert(
    !letterNoContact.content.signOff.includes('undefined') &&
    !letterNoContact.content.signOff.includes('null') &&
    !letterNoContact.content.signOff.includes(' | '),
    'Empty Data: Contact line omits delimiters without undefined or null when email/phone are empty'
  );

  // 5.2 Empty companyName falls back to professional default
  const letterEmptyCompanyAr = CoverLetterService.generateCoverLetter({
    jobDescription: 'وظيفة شاغرة في هندسة البرمجيات وتحليل النظم.',
    companyName: '',
    language: 'ar',
  });
  assert(
    letterEmptyCompanyAr.recipient.companyName === 'الشركة الموقرة',
    'Empty Data: Arabic empty company falls back to "الشركة الموقرة"'
  );

  const letterEmptyCompanyEn = CoverLetterService.generateCoverLetter({
    jobDescription: 'Job opening for senior software developer.',
    companyName: '   ',
    language: 'en',
  });
  assert(
    letterEmptyCompanyEn.recipient.companyName === 'Your Company',
    'Empty Data: English empty company falls back to "Your Company"'
  );

  // 5.3 Empty hiringManager falls back to professional default
  const letterEmptyManagerAr = CoverLetterService.generateCoverLetter({
    jobDescription: 'وظيفة شاغرة في هندسة البرمجيات وتحليل النظم.',
    hiringManager: '',
    language: 'ar',
  });
  assert(
    letterEmptyManagerAr.recipient.hiringManager === 'فريق الموارد البشرية المحترم',
    'Empty Data: Arabic empty manager falls back to "فريق الموارد البشرية المحترم"'
  );

  // 5.4 Empty customNotes produces clean text without dangling punctuation
  const letterNoNotes = CoverLetterService.generateCoverLetter({
    jobDescription: 'Full Stack engineer position.',
    customNotes: '   ',
    language: 'en',
  });
  assert(
    !letterNoNotes.content.fullText.includes('particularly like to highlight: .'),
    'Empty Data: Whitespace-only customNotes are cleanly ignored'
  );

  // 5.5 cleanDisplayText handles null/undefined/empty string gracefully
  assert(CoverLetterService.cleanDisplayText('') === '', 'Empty Data: cleanDisplayText handles empty string');
  assert(CoverLetterService.cleanDisplayText(null) === '', 'Empty Data: cleanDisplayText handles null');
  assert(CoverLetterService.cleanDisplayText(undefined) === '', 'Empty Data: cleanDisplayText handles undefined');

  // =========================================================================
  // 6. DEDUPLICATION & REPEAT DIMENSION (التكرار ومنع الازدواجية)
  // =========================================================================
  console.log('\n[Dimension 6: DEDUPLICATION & REPEAT - منع التكرار والازدواجية]');

  // 6.1 Keyword extraction deduplication
  const repeatingJd = 'React React React Docker Docker Python Python Python Python PostgreSQL';
  const extracted = CoverLetterService.extractKeywords(repeatingJd);
  const uniqueKeywords = new Set(extracted);
  assert(
    extracted.length === uniqueKeywords.size,
    'Deduplication: Extracted keywords list contains no duplicate entries'
  );
  assert(
    extracted[0] === 'Python' && extracted[1] === 'React',
    'Deduplication: Most repeated keywords ranked at the top by TF frequency'
  );

  // 6.2 Multiple whitespace and newline collapsing
  const bloatedText = 'Header\n\n\n\n\n\n\nBody text with     many    spaces.\n\n\n\nFooter';
  const normalized = CoverLetterService.cleanDisplayText(bloatedText);
  assert(!normalized.includes('\n\n\n'), 'Deduplication: 3+ consecutive newlines collapsed to maximum 2');
  assert(!normalized.includes('   '), 'Deduplication: Multiple consecutive spaces collapsed to single space');

  // 6.3 Cleanup: User A deletes created test document
  if (createdLetterId) {
    try {
      const res = await fetch(`${BASE_URL}/api/cover-letters/${createdLetterId}`, {
        method: 'DELETE',
        headers: authHeadersA,
      });
      assert(res.status === 200, 'Success/Cleanup: User A successfully deletes their test letter (200 OK)');
    } catch (err) {
      assert(false, `Cleanup delete failed: ${err.message}`);
    }
  }

  // =========================================================================
  // FINAL SUMMARY
  // =========================================================================
  console.log('\n' + '='.repeat(75));
  console.log(`TOTAL EDGE CASE CHECKS : ${totalTests}`);
  console.log(`PASSED                 : ${passedTests}`);
  console.log(`FAILED                 : ${failedTests}`);
  console.log('='.repeat(75));

  if (failedTests > 0) {
    process.exit(1);
  } else {
    console.log('\n>>> ALL PHASE 12 EDGE CASE & DIMENSION TESTS PASSED! <<<\n');
    process.exit(0);
  }
}

runEdgeCasesSuite();
