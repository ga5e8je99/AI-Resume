import { CoverLetterService } from '../app/lib/coverLetterService.ts';

function runBusinessLogicTests() {
  console.log('--- Starting Phase 6: Cover Letter Business Logic & Resilience Test Suite ---\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Arabic normalization
  const normalized = CoverLetterService.normalizeArabic('إدارة مَشاريع وتطوير الأنظمة الذكية');
  assert(
    normalized === 'اداره مشاريع وتطوير الانظمه الذكيه',
    'normalizeArabic correctly strips diacritics and harmonizes alef/taa marbouta'
  );

  // 2. Keyword extraction & TF ranking
  const jobText = `
    We are looking for a Senior React and TypeScript Engineer.
    The candidate will develop Next.js applications, write TypeScript code, and integrate React components.
    Experience with Docker and Kubernetes is required. Familiarity with AWS is a plus.
  `;
  const extracted = CoverLetterService.extractKeywords(jobText, 5);
  assert(
    extracted.includes('TypeScript') && extracted.includes('React') && extracted.includes('Next.js'),
    'extractKeywords detects key skills from English job description'
  );
  // TypeScript & React should be at the top due to frequency (mentioned multiple times)
  assert(
    extracted.indexOf('TypeScript') <= 1 || extracted.indexOf('React') <= 1,
    'extractKeywords orders most frequent skills at the top (TF ranking)'
  );

  // 3. Arabic keyword extraction
  const arJobText = `
    مطلوب مدير مشروعات تقنية لقيادة فرق هندسة البرمجيات وتطبيق منهجيات إدارة المشاريع و Agile.
    يشترط خبرة في تحليل البيانات والذكاء الاصطناعي والتواصل الفعال مع العملاء.
  `;
  const arExtracted = CoverLetterService.extractKeywords(arJobText, 5);
  assert(
    arExtracted.includes('إدارة المشاريع') || arExtracted.includes('الذكاء الاصطناعي'),
    'extractKeywords detects Arabic specialized skills'
  );

  // 4. Resume Cross-matching (Candidate has React and TypeScript, matching Job)
  const mockResume = {
    templateId: 'modern',
    data: {
      personalInfo: {
        fullName: 'أحمد محمود',
        email: 'ahmed@example.com',
        phone: '+966500000000',
        jobTitle: 'مهندس برمجيات أول',
      },
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
      experience: [
        {
          position: 'Senior Frontend Developer',
          company: 'Tech Solutions Co.',
          startDate: '2021',
          endDate: 'Present',
        },
      ],
    },
  };

  const reqWithResume = {
    jobDescription: jobText,
    jobTitle: 'Senior Frontend Engineer',
    companyName: 'Acme Global',
    tone: 'technical',
    language: 'ar',
    resumeId: 'res_001',
    customNotes: 'التركيز على قابلية التوسع ومراجعة الأكواد',
  };

  const letterFromResume = CoverLetterService.generateCoverLetter(reqWithResume, mockResume);

  assert(
    letterFromResume.templateId === 'modern',
    'generateCoverLetter inherits templateId from selected Resume'
  );
  assert(
    letterFromResume.content.bodyParagraphs[0].includes('Tech Solutions Co.'),
    'generateCoverLetter weaves past experience company into body paragraph'
  );
  assert(
    letterFromResume.content.bodyParagraphs[0].includes('التركيز على قابلية التوسع ومراجعة الأكواد'),
    'generateCoverLetter injects customNotes accurately'
  );
  assert(
    letterFromResume.extractedKeywords.length > 0,
    'generateCoverLetter includes extracted keywords list'
  );

  // 5. Missing Data Resilience (Candidate has no phone, no experience, no company specified)
  const bareReq = {
    jobDescription: 'Software Developer needed for backend development and API building.',
    tone: 'formal',
    language: 'en',
  };

  const bareLetter = CoverLetterService.generateCoverLetter(bareReq, null);

  assert(
    bareLetter.sender.fullName === 'Applicant',
    'Missing sender name falls back to polite default (Applicant)'
  );
  assert(
    bareLetter.recipient.companyName === 'Your Company',
    'Missing company name falls back to professional default'
  );
  assert(
    !bareLetter.content.signOff.includes('undefined') && !bareLetter.content.signOff.includes('| |'),
    'Sign-off cleanly formats without undefined or dangling delimiters when contact info is missing'
  );

  // 6. Test all 4 Tones in English and Arabic
  const tones = ['formal', 'technical', 'leadership', 'enthusiastic'];
  for (const tone of tones) {
    const arLetter = CoverLetterService.generateCoverLetter(
      { jobDescription: 'مطلوب مطور واجهات مستخدم React', tone, language: 'ar', companyName: 'الشركة العربية' },
      null
    );
    const enLetter = CoverLetterService.generateCoverLetter(
      { jobDescription: 'React Frontend Developer required', tone, language: 'en', companyName: 'Global Corp' },
      null
    );

    assert(
      arLetter.content.bodyParagraphs.length >= 2 && arLetter.content.fullText.length > 200,
      `Arabic generation for tone "${tone}" produces complete structured letter`
    );
    assert(
      enLetter.content.bodyParagraphs.length >= 2 && enLetter.content.fullText.length > 200,
      `English generation for tone "${tone}" produces complete structured letter`
    );
  }

  // 7. SSRF Protection check
  assert(CoverLetterService.isPrivateOrBlockedHost('localhost') === true, 'SSRF: blocks localhost');
  assert(CoverLetterService.isPrivateOrBlockedHost('127.0.0.1') === true, 'SSRF: blocks 127.0.0.1');
  assert(CoverLetterService.isPrivateOrBlockedHost('169.254.169.254') === true, 'SSRF: blocks cloud metadata IP');
  assert(CoverLetterService.isPrivateOrBlockedHost('192.168.1.1') === true, 'SSRF: blocks private class C IP');
  assert(CoverLetterService.isPrivateOrBlockedHost('10.0.0.5') === true, 'SSRF: blocks private class A IP');
  assert(CoverLetterService.isPrivateOrBlockedHost('example.com') === false, 'SSRF: permits valid public domain');

  console.log(`\n--- Phase 6 Test Summary: ${passed} Passed, ${failed} Failed ---`);
  if (failed > 0) process.exit(1);
}

runBusinessLogicTests();
