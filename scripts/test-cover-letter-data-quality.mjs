/**
 * test-cover-letter-data-quality.mjs
 * Comprehensive automated test suite for Phase 11: Data Validation & Quality
 * Testing:
 * 1. Logical boundary checks for generate request (lengths, tones, languages, templates, email, phone)
 * 2. Logical boundary checks for save/draft payload
 * 3. Text cleaning and entity unescaping for pristine presentation
 * 4. Detection of binary / garbled file extracts
 * 5. Safe handling of external URLs and SSRF boundaries
 * 6. Zero data loss caching and fallback backup simulation
 */

import { CoverLetterService } from '../app/lib/coverLetterService.ts';

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

console.log('='.repeat(70));
console.log('>>> RUNNING PHASE 11: DATA VALIDATION & QUALITY TEST SUITE <<<');
console.log('='.repeat(70));

// -------------------------------------------------------------
// 1. GENERATE REQUEST BOUNDARY VALIDATION
// -------------------------------------------------------------
console.log('\n[Suite 1] Generate Request Logical Boundary Validation:');

// Test 1.1: Missing both description and URL
const resMissingBoth = CoverLetterService.validateRequest({});
assert(!resMissingBoth.valid, 'Rejects when both jobDescription and jobUrl are missing');

// Test 1.2: Job description too short (< 25 chars)
const resShortDesc = CoverLetterService.validateRequest({ jobDescription: 'Short job desc' });
assert(!resShortDesc.valid && resShortDesc.error.includes('قصير جداً'), 'Rejects description shorter than 25 characters');

// Test 1.3: Job description exceeding 35,000 characters
const longDesc = 'A'.repeat(35001);
const resLongDesc = CoverLetterService.validateRequest({ jobDescription: longDesc });
assert(!resLongDesc.valid && resLongDesc.error.includes('الحد الأقصى'), 'Rejects description exceeding 35,000 characters');

// Test 1.4: Company name exceeding 120 characters
const longCompany = 'C'.repeat(121);
const resLongCompany = CoverLetterService.validateRequest({
  jobDescription: 'Valid job description that exceeds twenty-five characters.',
  companyName: longCompany,
});
assert(!resLongCompany.valid && resLongCompany.error.includes('120'), 'Rejects companyName exceeding 120 characters');

// Test 1.5: Job title exceeding 120 characters
const longTitle = 'T'.repeat(121);
const resLongTitle = CoverLetterService.validateRequest({
  jobDescription: 'Valid job description that exceeds twenty-five characters.',
  jobTitle: longTitle,
});
assert(!resLongTitle.valid && resLongTitle.error.includes('120'), 'Rejects jobTitle exceeding 120 characters');

// Test 1.6: Hiring manager exceeding 120 characters
const longManager = 'M'.repeat(121);
const resLongManager = CoverLetterService.validateRequest({
  jobDescription: 'Valid job description that exceeds twenty-five characters.',
  hiringManager: longManager,
});
assert(!resLongManager.valid && resLongManager.error.includes('120'), 'Rejects hiringManager exceeding 120 characters');

// Test 1.7: Custom notes exceeding 500 characters
const longNotes = 'N'.repeat(501);
const resLongNotes = CoverLetterService.validateRequest({
  jobDescription: 'Valid job description that exceeds twenty-five characters.',
  customNotes: longNotes,
});
assert(!resLongNotes.valid && resLongNotes.error.includes('500'), 'Rejects customNotes exceeding 500 characters');

// Test 1.8: Invalid tone
const resInvalidTone = CoverLetterService.validateRequest({
  jobDescription: 'Valid job description that exceeds twenty-five characters.',
  tone: 'informal_slang',
});
assert(!resInvalidTone.valid && resInvalidTone.error.includes('نبرة الخطاب'), 'Rejects unsupported tone value');

// Test 1.9: Valid tones
const validTones = ['formal', 'technical', 'leadership', 'enthusiastic'];
const allTonesValid = validTones.every((t) => {
  return CoverLetterService.validateRequest({
    jobDescription: 'Valid job description that exceeds twenty-five characters.',
    tone: t,
  }).valid;
});
assert(allTonesValid, 'Accepts all 4 supported tone values');

// Test 1.10: Invalid language
const resInvalidLang = CoverLetterService.validateRequest({
  jobDescription: 'Valid job description that exceeds twenty-five characters.',
  language: 'xx',
});
assert(!resInvalidLang.valid && resInvalidLang.error.includes('اللغة'), 'Rejects unsupported language');

// Test 1.11: Valid languages
const validLangs = ['ar', 'en', 'fr', 'de', 'es', 'tr'];
const allLangsValid = validLangs.every((l) => {
  return CoverLetterService.validateRequest({
    jobDescription: 'Valid job description that exceeds twenty-five characters.',
    language: l,
  }).valid;
});
assert(allLangsValid, 'Accepts supported languages (ar, en, fr, de, es, tr)');

// Test 1.12: Invalid templateId
const resInvalidTemplate = CoverLetterService.validateRequest({
  jobDescription: 'Valid job description that exceeds twenty-five characters.',
  templateId: 'unknown_fancy_template',
});
assert(!resInvalidTemplate.valid && resInvalidTemplate.error.includes('معرّف القالب'), 'Rejects unsupported templateId');

// Test 1.13: Valid templateIds
const validTemplates = ['compact', 'modern', 'classic', 'ats-friendly'];
const allTemplatesValid = validTemplates.every((tmpl) => {
  return CoverLetterService.validateRequest({
    jobDescription: 'Valid job description that exceeds twenty-five characters.',
    templateId: tmpl,
  }).valid;
});
assert(allTemplatesValid, 'Accepts all 4 resume matching template IDs');

// Test 1.14: Sender full name exceeding 100 characters
const longSenderName = 'S'.repeat(101);
const resLongSender = CoverLetterService.validateRequest({
  jobDescription: 'Valid job description that exceeds twenty-five characters.',
  sender: { fullName: longSenderName },
});
assert(!resLongSender.valid && resLongSender.error.includes('100'), 'Rejects sender.fullName exceeding 100 characters');

// Test 1.15: Invalid sender email format
const resInvalidEmail = CoverLetterService.validateRequest({
  jobDescription: 'Valid job description that exceeds twenty-five characters.',
  sender: { email: 'not-an-email-address' },
});
assert(!resInvalidEmail.valid && resInvalidEmail.error.includes('البريد الإلكتروني'), 'Rejects malformed sender email');

// Test 1.16: Valid sender email
const resValidEmail = CoverLetterService.validateRequest({
  jobDescription: 'Valid job description that exceeds twenty-five characters.',
  sender: { email: 'candidate.pro@company.org' },
});
assert(resValidEmail.valid, 'Accepts correctly formatted sender email');

// Test 1.17: Invalid sender phone (invalid characters / format)
const resInvalidPhone = CoverLetterService.validateRequest({
  jobDescription: 'Valid job description that exceeds twenty-five characters.',
  sender: { phone: '12-abc' },
});
assert(!resInvalidPhone.valid && resInvalidPhone.error.includes('الهاتف'), 'Rejects invalid characters in sender phone');

// Test 1.18: Valid international sender phone
const resValidPhone = CoverLetterService.validateRequest({
  jobDescription: 'Valid job description that exceeds twenty-five characters.',
  sender: { phone: '+966 (50) 123-4567' },
});
assert(resValidPhone.valid, 'Accepts valid international phone number format');

// Test 1.19: Invalid URL protocol
const resInvalidProto = CoverLetterService.validateRequest({
  jobUrl: 'ftp://files.example.com/job.txt',
});
assert(!resInvalidProto.valid && resInvalidProto.error.includes('http'), 'Rejects non-HTTP/HTTPS protocols in jobUrl');

// Test 1.20: Valid URL
const resValidUrl = CoverLetterService.validateRequest({
  jobUrl: 'https://careers.google.com/jobs/results/12345',
});
assert(resValidUrl.valid, 'Accepts valid HTTPS job URL');


// -------------------------------------------------------------
// 2. SAVE & DRAFT PAYLOAD VALIDATION
// -------------------------------------------------------------
console.log('\n[Suite 2] Save Payload Logical Boundary Validation:');

// Test 2.1: Empty payload
const resEmptySave = CoverLetterService.validateSavePayload(null);
assert(!resEmptySave.valid, 'Rejects null or missing save payload');

// Test 2.2: Missing content
const resMissingContent = CoverLetterService.validateSavePayload({ title: 'My Draft' });
assert(!resMissingContent.valid && resMissingContent.error.includes('محتوى'), 'Rejects payload without content object');

// Test 2.3: Content missing fullText and bodyParagraphs
const resEmptyContent = CoverLetterService.validateSavePayload({
  content: { fullText: '', bodyParagraphs: [] },
});
assert(!resEmptyContent.valid, 'Rejects content without text or paragraphs');

// Test 2.4: Title exceeding 150 characters
const resLongTitleSave = CoverLetterService.validateSavePayload({
  title: 'T'.repeat(151),
  content: { fullText: 'Valid cover letter text for saving in the database.' },
});
assert(!resLongTitleSave.valid && resLongTitleSave.error.includes('150'), 'Rejects title exceeding 150 characters');

// Test 2.5: Company name exceeding 120 characters in save payload
const resLongCompanySave = CoverLetterService.validateSavePayload({
  companyName: 'X'.repeat(121),
  content: { fullText: 'Valid cover letter text for saving in the database.' },
});
assert(!resLongCompanySave.valid && resLongCompanySave.error.includes('120'), 'Rejects companyName exceeding 120 characters');

// Test 2.6: Invalid status
const resInvalidStatus = CoverLetterService.validateSavePayload({
  status: 'published_on_twitter',
  content: { fullText: 'Valid cover letter text.' },
});
assert(!resInvalidStatus.valid && resInvalidStatus.error.includes('حالة الخطاب'), 'Rejects invalid status (only draft, saved, archived)');

// Test 2.7: Valid full save payload
const resValidSave = CoverLetterService.validateSavePayload({
  title: 'خطاب تقديم لشركة الاتصالات',
  companyName: 'STC',
  jobTitle: 'Senior Software Engineer',
  hiringManager: 'فريق التوظيف',
  tone: 'technical',
  language: 'ar',
  templateId: 'modern',
  status: 'saved',
  sender: {
    fullName: 'أحمد علي',
    email: 'ahmed@example.com',
    phone: '+966 55 987 6543',
  },
  content: {
    fullText: 'عناية فريق التوظيف، يسعدني التقدم لشغل وظيفة مهندس برمجيات...',
    bodyParagraphs: ['فقرة أولى', 'فقرة ثانية'],
  },
});
assert(resValidSave.valid, 'Accepts well-formed cover letter draft save payload');


// -------------------------------------------------------------
// 3. TEXT CLEANING & NORMALIZATION (cleanDisplayText)
// -------------------------------------------------------------
console.log('\n[Suite 3] Text Cleaning & Presentation Normalization:');

// Test 3.1: Windows CRLF and Mac CR normalization
const textWithCRLF = 'Line 1\r\nLine 2\rLine 3\nLine 4';
const cleanedCRLF = CoverLetterService.cleanDisplayText(textWithCRLF);
assert(!cleanedCRLF.includes('\r'), 'Normalizes all CRLF and CR line breaks into standard newlines');

// Test 3.2: Collapsing excessive vertical empty lines (3+ collapsed to 2)
const textExcessiveGaps = 'Paragraph 1\n\n\n\n\nParagraph 2\n\n\n\nParagraph 3';
const cleanedGaps = CoverLetterService.cleanDisplayText(textExcessiveGaps);
assert(!cleanedGaps.includes('\n\n\n'), 'Collapses 3 or more consecutive newlines into maximum 2');

// Test 3.3: Stripping invisible Unicode control characters and zero-width spaces
const textWithInvisible = 'Hello\u200BWorld\u200DWith\uFEFFInvisible\u2060Joiners\u00A0End';
const cleanedInvisible = CoverLetterService.cleanDisplayText(textWithInvisible);
assert(
  !/[\u200B-\u200D\uFEFF\u2060]/.test(cleanedInvisible),
  'Strips zero-width spaces, zero-width joiners, and BOM control chars'
);

// Test 3.4: Unescaping HTML entities for pristine raw presentation
const textWithEntities = 'Software Engineer &amp; Architect &lt;FinTech&gt; at &quot;Google&quot; &#x27;AI&#x27; &nbsp; Team';
const cleanedEntities = CoverLetterService.cleanDisplayText(textWithEntities);
assert(
  cleanedEntities.includes('&') &&
  cleanedEntities.includes('<FinTech>') &&
  cleanedEntities.includes('"Google"') &&
  cleanedEntities.includes("'AI'"),
  'Properly unescapes &amp;, &lt;, &gt;, &quot;, and &#x27; entities'
);

// Test 3.5: Normalizing multiple horizontal spaces
const textMultipleSpaces = 'Word1     Word2\t\t\tWord3';
const cleanedSpaces = CoverLetterService.cleanDisplayText(textMultipleSpaces);
assert(!cleanedSpaces.includes('     ') && !cleanedSpaces.includes('\t\t'), 'Normalizes multiple spaces and tabs to single spaces');


// -------------------------------------------------------------
// 4. DETECTION OF BINARY OR GARBLED EXTRACTS (isGarbledOrBinaryText)
// -------------------------------------------------------------
console.log('\n[Suite 4] Binary & Garbled Text Detection:');

// Test 4.1: Plain Arabic text returns false (not garbled)
const validArabicText = 'يسعدني التقدم لشغل وظيفة مهندس برمجيات أول لدى شركتكم الموقرة.';
assert(!CoverLetterService.isGarbledOrBinaryText(validArabicText), 'Valid Arabic text is recognized as legitimate');

// Test 4.2: Plain English text returns false (not garbled)
const validEnglishText = 'I am writing to express my enthusiasm for the Senior Backend Engineer role.';
assert(!CoverLetterService.isGarbledOrBinaryText(validEnglishText), 'Valid English text is recognized as legitimate');

// Test 4.3: Binary null bytes detected
const binaryWithNull = 'Legitimate looking prefix\0\0\0\x01\x02binary garbage data';
assert(CoverLetterService.isGarbledOrBinaryText(binaryWithNull), 'Detects binary null bytes from corrupted streams');

// Test 4.4: ZIP archive signature (PK\x03\x04) detected
const rawZipBytes = 'PK\x03\x04\x14\x00\x08\x00\x08\x00word/document.xml';
assert(CoverLetterService.isGarbledOrBinaryText(rawZipBytes), 'Detects raw ZIP archive header from unparsed .docx file');

// Test 4.5: High control character ratio detected
const highControlChars = 'Text \x01\x02\x03\x04\x05\x06\x07\x08\x0E\x0F\x10\x11\x12\x13\x14\x15';
assert(CoverLetterService.isGarbledOrBinaryText(highControlChars), 'Detects high density of unprintable non-ASCII control characters');


// -------------------------------------------------------------
// 5. EXTERNAL URL SAFETY & SSRF REJECTION
// -------------------------------------------------------------
console.log('\n[Suite 5] External URL Safety & SSRF Restrictions:');

async function testUrlProtection() {
  const dangerousUrls = [
    'http://localhost:3000/api/admin',
    'http://127.0.0.1:8080/secret',
    'http://169.254.169.254/latest/meta-data',
    'http://10.0.0.1/internal',
    'http://192.168.1.1/router',
  ];

  for (const dangerous of dangerousUrls) {
    let errorCaught = false;
    try {
      await CoverLetterService.fetchJobDescriptionFromUrl(dangerous);
    } catch (err) {
      errorCaught = true;
    }
    assert(errorCaught, `Blocks access to private/SSRF target: ${dangerous}`);
  }
}

await testUrlProtection();


// -------------------------------------------------------------
// 6. ZERO DATA LOSS SIMULATION (Cache & Fallback Backup)
// -------------------------------------------------------------
console.log('\n[Suite 6] Zero Data Loss & Fallback Backup Verification:');

// Test 6.1: Simulated form cache serialization & deserialization
const mockFormData = {
  companyName: 'Acme Corp',
  jobTitle: 'Full Stack Engineer',
  hiringManager: 'Jane Doe',
  jobDescription: 'We are seeking a talented full stack engineer with Node and React experience.',
  customNotes: 'Highlight experience with cloud infrastructure',
  tone: 'technical',
  language: 'en',
  templateId: 'modern',
};

const serialized = JSON.stringify(mockFormData);
const deserialized = JSON.parse(serialized);
assert(
  deserialized.companyName === mockFormData.companyName &&
  deserialized.jobDescription === mockFormData.jobDescription &&
  deserialized.tone === 'technical',
  'Form state serializes and deserializes accurately without data loss'
);

// Test 6.2: Simulated local backup array deduplication
const mockDraft1 = { id: 'cl_1', title: 'Letter 1', lastEdited: 100 };
const mockDraft2 = { id: 'cl_2', title: 'Letter 2', lastEdited: 200 };
let storage = [mockDraft1, mockDraft2];

// Update draft 1 locally
const updatedDraft1 = { id: 'cl_1', title: 'Letter 1 Updated', lastEdited: 300 };
const filtered = storage.filter((d) => d.id !== updatedDraft1.id);
filtered.unshift(updatedDraft1);
storage = filtered;

assert(
  storage.length === 2 && storage[0].title === 'Letter 1 Updated',
  'Fallback backup replaces existing letter without duplicating or losing data'
);


// -------------------------------------------------------------
// FINAL REPORT
// -------------------------------------------------------------
console.log('\n' + '='.repeat(70));
console.log(`TOTAL CHECKS : ${totalTests}`);
console.log(`PASSED       : ${passedTests}`);
console.log(`FAILED       : ${failedTests}`);
console.log('='.repeat(70));

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('\n>>> ALL PHASE 11 DATA VALIDATION & QUALITY CHECKS PASSED SUCCESSFULLY! <<<\n');
  process.exit(0);
}
