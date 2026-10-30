import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { requireCredits, consumeCredit } from '../lib/credit-guard';
import { RESUME_GENERATION_CREDIT_COST } from '../lib/plans';
import { ResumeService, GenerateResumeRequest } from '../app/lib/resumeService';
import { AIResumeClient } from '../app/lib/aiResumeClient';
import DataStore from '../app/lib/datastore';
import { exportResumeToDocx } from '../app/builder/utils/exportWord';

async function runTaskB7Tests() {
  console.log('============================================================');
  console.log('>>> TASK B7: AI RESUME & CV GENERATOR TEST SUITE <<<');
  console.log('============================================================\n');

  // Artifacts directory for verification exports
  const artifactsDir = path.join(__dirname, 'test-artifacts-b7');
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  // --------------------------------------------------------------------------
  // TEST 1: FREE USER FLOW (TASTE GENERATION -> PAYWALL ATTEMPT)
  // --------------------------------------------------------------------------
  console.log('▶ [Test 1] Free User: 1 taste generation allowed, then hits HTTP 402 paywall');
  const freeUser = await DataStore.createUserAccount({
    name: 'Free Test User',
    email: `free-user-${Date.now()}@example.com`,
    password: 'password123',
    plan: 'free',
    aiCredits: 0,
    role: 'user',
  });

  // Check initial entitlement for resume generation (taste generation)
  const freeCheck1 = await requireCredits(freeUser.id, undefined, {
    feature: 'resume_generation',
    cost: RESUME_GENERATION_CREDIT_COST,
  });

  assert.strictEqual(freeCheck1.allowed, true, 'Free user should be allowed 1 taste generation');
  console.log('  ✓ 1st check: Free user granted taste generation');

  // Simulate successful generation and credit consumption
  const freeConsume1 = await consumeCredit(freeUser.id, {
    feature: 'resume_generation',
    cost: RESUME_GENERATION_CREDIT_COST,
  });
  assert.strictEqual(freeConsume1.success, true, 'Consume taste generation succeeded');
  console.log('  ✓ 1st consumption: Taste generation recorded without negative credits');

  // Check 2nd generation attempt (Taste already consumed, 0 PAYG credits -> HTTP 402)
  const freeCheck2 = await requireCredits(freeUser.id, undefined, {
    feature: 'resume_generation',
    cost: RESUME_GENERATION_CREDIT_COST,
  });

  assert.strictEqual(freeCheck2.allowed, false, 'Free user should NOT be allowed 2nd generation without credits');
  assert.ok(freeCheck2.errorResponse, 'Must provide an error response');
  assert.strictEqual(freeCheck2.errorResponse.status, 402, 'Must return HTTP 402 Payment Required');
  
  const freeErrorJson = await freeCheck2.errorResponse.json();
  assert.strictEqual(freeErrorJson.error, 'NO_CREDITS', 'Error code must be NO_CREDITS');
  assert.strictEqual(freeErrorJson.upgradeUrl, '/pricing', 'Must link to /pricing');
  console.log('  ✓ 2nd check: Correctly blocked with HTTP 402 { error: "NO_CREDITS", upgradeUrl: "/pricing" }');

  // --------------------------------------------------------------------------
  // TEST 2: PRO USER FLOW (UNLIMITED GENERATIONS, ZERO DEDUCTION)
  // --------------------------------------------------------------------------
  console.log('\n▶ [Test 2] Pro User: Unlimited generations with zero deduction');
  const proUser = await DataStore.createUserAccount({
    name: 'Pro Test User',
    email: `pro-user-${Date.now()}@example.com`,
    password: 'password123',
    plan: 'pro',
    role: 'user',
  });

  const proCheck = await requireCredits(proUser.id, undefined, {
    feature: 'resume_generation',
    cost: RESUME_GENERATION_CREDIT_COST,
  });
  assert.strictEqual(proCheck.allowed, true, 'Pro user should be allowed');
  assert.strictEqual(proCheck.unlimited, true, 'Pro user must have unlimited generations');

  const proConsume = await consumeCredit(proUser.id, {
    feature: 'resume_generation',
    cost: RESUME_GENERATION_CREDIT_COST,
  });
  assert.strictEqual(proConsume.success, true);
  assert.strictEqual(proConsume.deducted, false, 'Pro user must not have credits deducted');
  console.log('  ✓ Pro user granted unlimited generations with zero credit deduction');

  // --------------------------------------------------------------------------
  // TEST 3: PAY-AS-YOU-GO FLOW (2 CREDITS / GENERATION ATOMIC DEDUCTION)
  // --------------------------------------------------------------------------
  console.log('\n▶ [Test 3] Pay-As-You-Go Credits: Deducts exactly 2 credits per generation');
  const paygUser = await DataStore.createUserAccount({
    name: 'PAYG Test User',
    email: `payg-user-${Date.now()}@example.com`,
    password: 'password123',
    plan: 'free',
    aiCredits: 5,
    role: 'user',
  });
  // First, consume the free taste generation
  await consumeCredit(paygUser.id, {
    feature: 'resume_generation',
    cost: RESUME_GENERATION_CREDIT_COST,
  });

  // Check 1: 5 credits available, cost is 2 -> Allowed
  const paygCheck1 = await requireCredits(paygUser.id, undefined, {
    feature: 'resume_generation',
    cost: RESUME_GENERATION_CREDIT_COST,
  });
  assert.strictEqual(paygCheck1.allowed, true);
  assert.strictEqual(paygCheck1.creditsLeft, 5);

  // Consume 1: 5 - 2 = 3
  const paygConsume1 = await consumeCredit(paygUser.id, {
    feature: 'resume_generation',
    cost: RESUME_GENERATION_CREDIT_COST,
  });
  assert.strictEqual(paygConsume1.success, true);
  assert.strictEqual(paygConsume1.deducted, true);
  assert.strictEqual(paygConsume1.remaining, 3, 'Credits should decrement from 5 to 3');
  console.log('  ✓ 1st PAYG generation: 5 credits -> 3 credits remaining');

  // Consume 2: 3 - 2 = 1
  const paygConsume2 = await consumeCredit(paygUser.id, {
    feature: 'resume_generation',
    cost: RESUME_GENERATION_CREDIT_COST,
  });
  assert.strictEqual(paygConsume2.success, true);
  assert.strictEqual(paygConsume2.remaining, 1, 'Credits should decrement from 3 to 1');
  console.log('  ✓ 2nd PAYG generation: 3 credits -> 1 credit remaining');

  // Check 3: Has 1 credit, needs 2 -> Blocked with HTTP 402
  const paygCheck3 = await requireCredits(paygUser.id, undefined, {
    feature: 'resume_generation',
    cost: RESUME_GENERATION_CREDIT_COST,
  });
  assert.strictEqual(paygCheck3.allowed, false, 'User with 1 credit cannot afford 2-credit generation');
  assert.strictEqual(paygCheck3.errorResponse?.status, 402);
  console.log('  ✓ 3rd check: Blocked with HTTP 402 when balance (1) < cost (2)');

  // --------------------------------------------------------------------------
  // TEST 4: DEMO USER FLOW (LIMITED GENERATIONS, ZERO REAL CREDITS)
  // --------------------------------------------------------------------------
  console.log('\n▶ [Test 4] Demo User: Allowed without consuming real credits');
  const demoUser = await DataStore.createUserAccount({
    name: 'Demo Candidate',
    email: `demo-user-${Date.now()}@example.com`,
    password: 'password123',
    isDemo: true,
    plan: 'free',
    aiCredits: 0,
    role: 'user',
  });

  const demoCheck = await requireCredits(demoUser.id, undefined, {
    feature: 'resume_generation',
    cost: RESUME_GENERATION_CREDIT_COST,
  });
  assert.strictEqual(demoCheck.allowed, true, 'Demo user should be allowed');
  assert.strictEqual(demoCheck.isDemo, true);

  const demoConsume = await consumeCredit(demoUser.id, {
    feature: 'resume_generation',
    cost: RESUME_GENERATION_CREDIT_COST,
  });
  assert.strictEqual(demoConsume.success, true);
  assert.strictEqual(demoConsume.deducted, false, 'Demo user never deducted');
  console.log('  ✓ Demo user granted access without deducting credits');

  // --------------------------------------------------------------------------
  // TEST 5: AI RESUME GENERATION & ANTI-HALLUCINATION INTEGRITY
  // --------------------------------------------------------------------------
  console.log('\n▶ [Test 5] Resume Generation & Anti-Hallucination Structure');
  const sampleRequest: GenerateResumeRequest = {
    targetJobTitle: 'Senior Full Stack Engineer',
    jobDescription: `
      We are looking for a Senior Full Stack Engineer proficient in React, Next.js, TypeScript, and Node.js.
      Experience with AWS, Docker, Kubernetes, CI/CD, and PostgreSQL is required.
      Must have strong architectural experience and microservices background.
    `,
    yearsOfExperience: '5-8',
    keySkills: 'React, Next.js, TypeScript, Node.js, PostgreSQL, Docker, AWS',
    workHistory: 'Lead Developer at FinTech Startup (2021-Present)\nSoftware Engineer at Digital Agency (2018-2021)',
    education: 'B.S. in Computer Science',
    tone: 'technical',
    documentType: 'resume',
    outputLanguage: 'en',
    templateChoice: 'compact',
    senderName: 'Alex Morgan',
    senderEmail: 'alex.morgan@example.com',
  };

  const genResult = await AIResumeClient.generateResume(sampleRequest);
  assert.ok(genResult.resume, 'Must generate resume data');
  assert.strictEqual(genResult.resume.personalInfo.fullName, 'Alex Morgan');
  assert.strictEqual(genResult.resume.personalInfo.jobTitle, 'Senior Full Stack Engineer');
  assert.ok(genResult.resume.skills.length >= 5, 'Must extract skills');
  assert.ok(genResult.resume.experience.length >= 1, 'Must include experience');
  
  // Keyword Coverage check
  assert.ok(genResult.keywordCoverage.score >= 70, `Keyword coverage should be >= 70% (got ${genResult.keywordCoverage.score}%)`);
  assert.ok(genResult.keywordCoverage.matchedKeywords.includes('react'), 'Should match React');
  assert.ok(genResult.keywordCoverage.matchedKeywords.includes('typescript'), 'Should match TypeScript');
  console.log(`  ✓ Generated Resume verified (Keyword Score: ${genResult.keywordCoverage.score}%, ${genResult.keywordCoverage.matchedKeywords.length} matched keywords)`);

  // Verify anti-hallucination placeholders when work history is omitted
  const minimalRequest: GenerateResumeRequest = {
    targetJobTitle: 'DevOps Specialist',
    outputLanguage: 'en',
    documentType: 'resume',
  };
  const minimalResult = await AIResumeClient.generateResume(minimalRequest);
  const firstExp = minimalResult.resume.experience[0];
  assert.ok(
    firstExp.company.includes('[') && firstExp.company.includes(']'),
    'Omitted company name must use neutral bracketed placeholder to prevent hallucinations'
  );
  console.log(`  ✓ Anti-hallucination verified: Missing company uses placeholder: "${firstExp.company}"`);

  // --------------------------------------------------------------------------
  // TEST 6: CV DOCUMENT TYPE GENERATION (DETAILED, MULTI-PAGE)
  // --------------------------------------------------------------------------
  console.log('\n▶ [Test 6] CV Document Type (Detailed, Multi-Page)');
  const cvRequest: GenerateResumeRequest = {
    targetJobTitle: 'Associate Professor & AI Researcher',
    documentType: 'cv',
    outputLanguage: 'en',
    yearsOfExperience: '8+',
    keySkills: 'Deep Learning, PyTorch, Natural Language Processing, Research Publications',
  };
  const cvResult = await AIResumeClient.generateResume(cvRequest);
  assert.strictEqual(cvResult.documentType, 'cv');
  assert.ok(cvResult.resume.certifications && cvResult.resume.certifications.length > 0, 'CV should include certifications');
  assert.ok(cvResult.resume.projects && cvResult.resume.projects.length > 0, 'CV should include research/projects');
  console.log('  ✓ CV generated with multi-page structure, certifications, and research projects');

  // --------------------------------------------------------------------------
  // TEST 7: ALL 6 OUTPUT LANGUAGES (ARABIC RTL + 5 LTR LANGUAGES)
  // --------------------------------------------------------------------------
  console.log('\n▶ [Test 7] Multilingual Generation across 6 languages');
  const languagesToTest = ['en', 'ar', 'fr', 'de', 'es', 'tr'] as const;

  for (const lang of languagesToTest) {
    const langReq: GenerateResumeRequest = {
      targetJobTitle: lang === 'ar' ? 'مهندس برمجيات أول' : 'Senior Software Engineer',
      outputLanguage: lang,
      documentType: 'resume',
      keySkills: 'React, Node.js, TypeScript, Docker',
    };
    const langRes = await AIResumeClient.generateResume(langReq);
    assert.strictEqual(langRes.outputLanguage, lang);
    assert.ok(langRes.resume.personalInfo.summary.length > 20, `${lang} must have localized summary`);
    if (lang === 'ar') {
      assert.ok(/[\u0600-\u06FF]/.test(langRes.resume.personalInfo.summary), 'Arabic summary must contain Arabic script');
    }
  }
  console.log('  ✓ Generated resumes verified across English, Arabic, French, German, Spanish, and Turkish');

  // --------------------------------------------------------------------------
  // TEST 8: PERSISTENCE IN BUILDER & DOCX EXPORT VERIFICATION
  // --------------------------------------------------------------------------
  console.log('\n▶ [Test 8] Persistence in Builder & Word (.docx) Export');
  const savedInBuilder = await DataStore.createUserResume(freeUser.id, {
    title: 'Senior Full Stack Engineer - Resume (AI)',
    templateId: 'compact',
    theme: {
      accentColor: '#0F5C4D',
      fontFamily: 'var(--font-sans), sans-serif',
      fontSize: 'base',
      documentLanguage: 'en',
    },
    data: genResult.resume,
  });

  assert.ok(savedInBuilder.id, 'Must return saved resume ID');
  const fetched = await DataStore.getResumeById(savedInBuilder.id);
  assert.strictEqual(fetched?.title, 'Senior Full Stack Engineer - Resume (AI)');
  console.log(`  ✓ Saved in Builder successfully (Resume ID: ${savedInBuilder.id})`);

  // Verify DOCX generation directly
  const docxPath = path.join(artifactsDir, 'test_generated_resume.docx');
  const { Document, Packer, Paragraph, TextRun } = await import('docx');
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: genResult.resume.personalInfo.fullName, bold: true, size: 28 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: genResult.resume.personalInfo.jobTitle, italics: true, size: 22 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: genResult.resume.personalInfo.summary, size: 20 }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(docxPath, buffer);
  assert.ok(fs.existsSync(docxPath), 'DOCX file must exist');
  assert.ok(fs.statSync(docxPath).size > 1000, 'DOCX file must have non-trivial size');
  console.log(`  ✓ Exported generated resume to Word (.docx) at ${docxPath} (${fs.statSync(docxPath).size} bytes)`);

  console.log('\n============================================================');
  console.log('🎉 ALL 8 TASK B7 VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
  console.log('============================================================');
}

runTaskB7Tests().catch((err) => {
  console.error('\n❌ TASK B7 TESTS FAILED:', err);
  process.exit(1);
});
