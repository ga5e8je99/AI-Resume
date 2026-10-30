import assert from 'assert';
import DataStore from '../app/lib/datastore';
import { requireCredits, consumeCredit } from '../lib/credit-guard';
import { generateSmartLinks } from '../lib/jobs/smart-links';
import { getEnabledProviders, searchAllProviders } from '../lib/jobs/providers';
import { scoreJob, deduplicateJobs, rankJobs } from '../lib/jobs/matcher';
import { buildCacheKey, getCachedJobResults, setCachedJobResults } from '../lib/jobs/cache';
import { extractProfileFromResumeData, extractProfileFromText } from '../lib/jobs/extractor';
import { Job, JobSearchParams } from '../lib/jobs/types';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 Running Task B8 Job Match Test Suite');
  console.log('====================================================\n');

  let passedTests = 0;

  // ---------------------------------------------------------------
  // TEST 1: Smart Deep-Links Generation (All 10 Platforms in Priority Order)
  // ---------------------------------------------------------------
  console.log('Test 1: Smart Links for all 10 Platforms...');
  const smartLinks = generateSmartLinks({
    query: 'Frontend Developer',
    location: 'Cairo, Egypt',
    remote: true,
    country: 'eg',
  });

  assert.strictEqual(smartLinks.length, 10, 'Must generate exactly 10 platforms');
  const expectedOrder = [
    'linkedin',
    'indeed',
    'glassdoor',
    'wuzzuf',
    'bayt',
    'naukrigulf',
    'gulftalent',
    'google_jobs',
    'ziprecruiter',
    'monster',
  ];

  for (let i = 0; i < expectedOrder.length; i++) {
    assert.strictEqual(
      smartLinks[i].id,
      expectedOrder[i],
      `Platform #${i + 1} must be ${expectedOrder[i]}, got ${smartLinks[i].id}`
    );
    assert.strictEqual(smartLinks[i].priority, i + 1);
    assert.ok(smartLinks[i].url.startsWith('https://'), `Platform ${smartLinks[i].id} URL must start with https://`);
  }

  // Confirm parameters are present in URLs
  assert.ok(smartLinks[0].url.includes('keywords=Frontend%20Developer'), 'LinkedIn URL must contain encoded query');
  assert.ok(smartLinks[0].url.includes('f_WT=2'), 'LinkedIn URL must have remote filter flag');
  assert.ok(smartLinks[3].url.includes('wuzzuf.net/search/jobs/'), 'Wuzzuf search URL must be correct');
  assert.ok(smartLinks[4].url.includes('bayt.com'), 'Bayt search URL must be correct');
  assert.ok(smartLinks[7].url.includes('ibp=htl;jobs'), 'Google Jobs URL must include ibp=htl;jobs');

  console.log('  ✅ Test 1 Passed: All 10 platforms generated with deep link parameters in priority order.\n');
  passedTests++;

  // ---------------------------------------------------------------
  // TEST 2: Provider Abstraction & Graceful Degradation
  // ---------------------------------------------------------------
  console.log('Test 2: Provider Abstraction & Graceful Degradation...');
  const enabledProviders = getEnabledProviders();
  const providerNames = enabledProviders.map((p) => p.name);
  console.log(`  Enabled providers: ${providerNames.join(', ')}`);

  // Open APIs must be enabled out of the box
  assert.ok(providerNames.includes('Remotive'), 'Remotive open API must be enabled');
  assert.ok(providerNames.includes('Arbeitnow'), 'Arbeitnow open API must be enabled');
  assert.ok(providerNames.includes('RemoteOK'), 'RemoteOK open API must be enabled');
  assert.ok(providerNames.includes('The Muse'), 'The Muse open API must be enabled');

  // Adzuna and Jooble are disabled gracefully when env vars are missing
  if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) {
    assert.ok(!providerNames.includes('Adzuna'), 'Adzuna must be disabled if credentials missing');
  }
  if (!process.env.JOOBLE_API_KEY) {
    assert.ok(!providerNames.includes('Jooble'), 'Jooble must be disabled if key missing');
  }

  console.log('  ✅ Test 2 Passed: Open providers active, gated providers gracefully disabled.\n');
  passedTests++;

  // ---------------------------------------------------------------
  // TEST 3: Candidate Profile Extraction
  // ---------------------------------------------------------------
  console.log('Test 3: Profile Extraction from Resume Data & Text...');
  const sampleResumeData = {
    personalInfo: {
      fullName: 'Ahmed Hassan',
      jobTitle: 'Senior Full Stack Engineer',
      location: 'Alexandria, Egypt',
    },
    skills: ['React', 'Next.js', 'Node.js', 'PostgreSQL', 'TypeScript', 'Tailwind', 'Docker'],
    experience: [
      {
        title: 'Lead Full-Stack Developer',
        company: 'AlexTech',
        description: 'Led architecture of cloud microservices and React web applications.',
      },
    ],
  };

  const extracted = extractProfileFromResumeData(sampleResumeData);
  assert.strictEqual(extracted.targetTitles[0], 'Senior Full Stack Engineer');
  assert.strictEqual(extracted.targetTitles.length, 3, 'Must produce top 3 target titles');
  assert.strictEqual(extracted.seniority, 'lead', 'Must detect lead seniority');
  assert.strictEqual(extracted.country, 'eg', 'Must map Alexandria to Egypt country code (eg)');
  assert.ok(extracted.topSkills.includes('React'), 'Must extract React skill');

  const textExtract = extractProfileFromText(
    'Sarah Jenkins\nSenior Frontend Engineer in Cairo, Egypt\nSkills: React, TypeScript, Next.js, GraphQL'
  );
  assert.ok(textExtract.targetTitles[0].toLowerCase().includes('frontend'));
  assert.strictEqual(textExtract.country, 'eg');
  assert.ok(textExtract.topSkills.includes('React'));

  console.log('  ✅ Test 3 Passed: Profile extraction accurately parsed titles, seniority, skills, and location.\n');
  passedTests++;

  // ---------------------------------------------------------------
  // TEST 4: Match Score Calculation, Reasons, and Missing Skills
  // ---------------------------------------------------------------
  console.log('Test 4: Match Score Calculation (0-100) & Explanations...');
  const testJob: Job = {
    id: 'test_job_1',
    title: 'Senior Frontend Developer',
    company: 'FinTech Hub',
    location: 'Cairo, Egypt',
    remote: true,
    description: 'Looking for a Senior Frontend Developer skilled in React, TypeScript, Tailwind, and AWS.',
    url: 'https://example.com/job/1',
    source: 'Remotive',
    tags: ['React', 'TypeScript', 'AWS'],
  };

  const params: JobSearchParams = {
    query: 'Senior Frontend Developer',
    location: 'Cairo, Egypt',
    remote: true,
    skills: ['React', 'TypeScript', 'Next.js'],
  };

  const scoreResult = scoreJob(testJob, params);
  console.log(`  Match Score: ${scoreResult.score}%`);
  console.log(`  Matched Skills: ${scoreResult.matchedSkills.join(', ')}`);
  console.log(`  Missing Skills: ${scoreResult.missingSkills.join(', ')}`);
  console.log(`  Reasons: ${scoreResult.reasons.join(' | ')}`);

  assert.ok(scoreResult.score >= 80, 'Score for matching title, location, remote, and skills should be >= 80');
  assert.ok(scoreResult.matchedSkills.includes('React'), 'React must be matched');
  assert.ok(scoreResult.matchedSkills.includes('TypeScript'), 'TypeScript must be matched');
  assert.ok(scoreResult.missingSkills.some((s) => s.toLowerCase() === 'aws'), 'AWS must be detected as missing from candidate');
  assert.ok(scoreResult.reasons.length > 0, 'Must have at least one explanation reason');

  console.log('  ✅ Test 4 Passed: Match score calculated with reasons and missing skills.\n');
  passedTests++;

  // ---------------------------------------------------------------
  // TEST 5: Deduplication and Ranking
  // ---------------------------------------------------------------
  console.log('Test 5: Deduplication and Ranking...');
  const duplicateJobs: Job[] = [
    {
      id: 'job_a1',
      title: 'React Developer',
      company: 'Acme Corp',
      location: 'Remote',
      remote: true,
      description: 'First posting from Remotive',
      url: 'https://remotive.com/job/123',
      source: 'Remotive',
    },
    {
      id: 'job_a2',
      title: 'React Developer',
      company: 'Acme Corp',
      location: 'Remote',
      remote: true,
      description: 'Duplicate posting on another board',
      url: 'https://remotive.com/job/123',
      source: 'RemoteOK',
    },
    {
      id: 'job_b1',
      title: 'Junior PHP Developer',
      company: 'Legacy Systems',
      location: 'Cairo',
      remote: false,
      description: 'PHP role',
      url: 'https://example.com/job/456',
      source: 'Arbeitnow',
    },
  ];

  const deduped = deduplicateJobs(duplicateJobs);
  assert.strictEqual(deduped.length, 2, 'Must deduplicate identical title + company / url');

  const ranked = rankJobs(duplicateJobs, params);
  assert.strictEqual(ranked.length, 2);
  assert.strictEqual(ranked[0].title, 'React Developer', 'Top match must be React Developer for Frontend query');
  assert.ok((ranked[0].matchScore || 0) > (ranked[1].matchScore || 0), 'React Developer score must be higher than PHP');

  console.log('  ✅ Test 5 Passed: Jobs correctly deduplicated and sorted by match score.\n');
  passedTests++;

  // ---------------------------------------------------------------
  // TEST 6: 6-Hour Cache Layer
  // ---------------------------------------------------------------
  console.log('Test 6: 6-Hour Cache Verification...');
  const cacheParams: JobSearchParams = {
    query: 'Backend Engineer Test Cache',
    location: 'Riyadh',
    remote: false,
    country: 'sa',
  };

  const sampleCacheData = {
    jobs: [testJob],
    totalFound: 1,
    attributions: [],
  };

  await setCachedJobResults(cacheParams, sampleCacheData);
  const retrievedCache = await getCachedJobResults(cacheParams);

  assert.ok(retrievedCache !== null, 'Cache must return cached object');
  assert.strictEqual(retrievedCache.jobs[0].title, testJob.title, 'Cached job must match stored job');

  console.log('  ✅ Test 6 Passed: Cache sets and retrieves 6-hour unexpired entries successfully.\n');
  passedTests++;

  // ---------------------------------------------------------------
  // TEST 7: Access Control & Free Quota: 3 Free Searches Allowed
  // ---------------------------------------------------------------
  console.log('Test 7: Quota - Free searches 1, 2, and 3 are allowed without credit deduction...');
  const freeEmail = 'free_' + Date.now().toString(36) + '@example.com';
  const createdFree = await DataStore.createUserAccount({
    name: 'Free Quota Candidate',
    email: freeEmail,
    password: 'password123',
    role: 'user',
    plan: 'free',
    aiCredits: 0, // Zero credits!
  });
  const testFreeUserId = createdFree.id;

  // Verify initial state
  let freeUser = await DataStore.findUserById(testFreeUserId);
  assert.strictEqual(freeUser?.jobMatchFreeUsed ?? 0, 0, 'New user has 0 free searches used');

  // Search 1: Free
  const check1 = await requireCredits(testFreeUserId, undefined, { feature: 'job_match' });
  assert.strictEqual(check1.allowed, true, 'Search 1 must be allowed');
  assert.strictEqual(check1.creditsLeft, 3, '3 free searches remaining');
  const consume1 = await consumeCredit(testFreeUserId, { feature: 'job_match' });
  assert.strictEqual(consume1.success, true);
  freeUser = await DataStore.findUserById(testFreeUserId);
  assert.strictEqual(freeUser?.jobMatchFreeUsed, 1, 'Search 1 increments free used to 1');
  assert.strictEqual(freeUser?.aiCredits, 0, 'No credits deducted on search 1');

  // Search 2: Free
  const check2 = await requireCredits(testFreeUserId, undefined, { feature: 'job_match' });
  assert.strictEqual(check2.allowed, true, 'Search 2 must be allowed');
  assert.strictEqual(check2.creditsLeft, 2, '2 free searches remaining');
  await consumeCredit(testFreeUserId, { feature: 'job_match' });
  freeUser = await DataStore.findUserById(testFreeUserId);
  assert.strictEqual(freeUser?.jobMatchFreeUsed, 2, 'Search 2 increments free used to 2');

  // Search 3: Free
  const check3 = await requireCredits(testFreeUserId, undefined, { feature: 'job_match' });
  assert.strictEqual(check3.allowed, true, 'Search 3 must be allowed');
  assert.strictEqual(check3.creditsLeft, 1, '1 free search remaining');
  await consumeCredit(testFreeUserId, { feature: 'job_match' });
  freeUser = await DataStore.findUserById(testFreeUserId);
  assert.strictEqual(freeUser?.jobMatchFreeUsed, 3, 'Search 3 increments free used to 3');

  console.log('  ✅ Test 7 Passed: Searches 1, 2, and 3 executed free with 0 credits.\n');
  passedTests++;

  // ---------------------------------------------------------------
  // TEST 8: Search 4 Blocked with HTTP 402 NO_CREDITS Paywall
  // ---------------------------------------------------------------
  console.log('Test 8: Quota - Search 4 hits paywall (HTTP 402 NO_CREDITS)...');
  const check4 = await requireCredits(testFreeUserId, undefined, { feature: 'job_match' });
  assert.strictEqual(check4.allowed, false, 'Search 4 must be blocked when free quota is exhausted and credits = 0');
  assert.ok(check4.errorResponse, 'Must return error response');
  assert.strictEqual(check4.errorResponse.status, 402, 'Must return HTTP 402 Payment Required');

  const errorBody = await check4.errorResponse.json();
  assert.strictEqual(errorBody.error, 'NO_CREDITS');
  assert.strictEqual(errorBody.upgradeUrl, '/pricing');
  assert.ok(errorBody.message.includes('3 free Job Match searches'), 'Message must explain 3 free searches used');

  console.log('  ✅ Test 8 Passed: Search 4 returns HTTP 402 with upgrade URL and paywall details.\n');
  passedTests++;

  // ---------------------------------------------------------------
  // TEST 9: Pro Plan Unlimited Fair-Use Searches (0 Deductions)
  // ---------------------------------------------------------------
  console.log('Test 9: Pro Plan - Unlimited Searches...');
  const proEmail = 'pro_' + Date.now().toString(36) + '@example.com';
  const createdPro = await DataStore.createUserAccount({
    name: 'Pro Candidate',
    email: proEmail,
    password: 'password123',
    role: 'user',
    plan: 'pro',
    aiCredits: 0,
  });
  const testProUserId = createdPro.id;

  // Even if pro user has 3 free used already:
  await DataStore.consumeJobMatchCredit(testProUserId);
  await DataStore.consumeJobMatchCredit(testProUserId);
  await DataStore.consumeJobMatchCredit(testProUserId);

  const proCheck = await requireCredits(testProUserId, undefined, { feature: 'job_match' });
  assert.strictEqual(proCheck.allowed, true, 'Pro plan must be allowed');
  assert.strictEqual(proCheck.unlimited, true, 'Pro plan must be marked unlimited');

  const proConsume = await consumeCredit(testProUserId, { feature: 'job_match' });
  assert.strictEqual(proConsume.success, true);
  assert.strictEqual(proConsume.deducted, false, 'Pro plan search must not deduct credits');

  console.log('  ✅ Test 9 Passed: Pro plan has unlimited searches with 0 credit deduction.\n');
  passedTests++;

  // ---------------------------------------------------------------
  // TEST 10: Pay-As-You-Go Plan Deducts 1 Credit Per Search After 3 Free
  // ---------------------------------------------------------------
  console.log('Test 10: PAYG Plan - Deducts 1 Credit per Search after 3 Free...');
  const paygEmail = 'payg_' + Date.now().toString(36) + '@example.com';
  const createdPayg = await DataStore.createUserAccount({
    name: 'PAYG Candidate',
    email: paygEmail,
    password: 'password123',
    role: 'user',
    plan: 'free',
    aiCredits: 10,
  });
  const testPaygUserId = createdPayg.id;

  // Consume 3 free searches first
  await DataStore.consumeJobMatchCredit(testPaygUserId);
  await DataStore.consumeJobMatchCredit(testPaygUserId);
  await DataStore.consumeJobMatchCredit(testPaygUserId);

  let paygUser = await DataStore.findUserById(testPaygUserId);
  assert.strictEqual(paygUser?.aiCredits, 10, 'Credits remain 10 after 3 free searches');

  // Search 4: Must consume 1 credit
  const paygCheck = await requireCredits(testPaygUserId, undefined, { feature: 'job_match' });
  assert.strictEqual(paygCheck.allowed, true, 'PAYG with credits must be allowed');
  const paygConsume = await consumeCredit(testPaygUserId, { feature: 'job_match' });
  assert.strictEqual(paygConsume.success, true);
  assert.strictEqual(paygConsume.deducted, true);

  paygUser = await DataStore.findUserById(testPaygUserId);
  assert.strictEqual(paygUser?.aiCredits, 9, 'Search 4 decrements aiCredits from 10 to 9');
  assert.strictEqual(paygUser?.jobMatchFreeUsed, 4);

  console.log('  ✅ Test 10 Passed: PAYG atomically deducts 1 credit per search after 3 free searches.\n');
  passedTests++;

  // Clean up test users
  await DataStore.deleteUser(testFreeUserId);
  await DataStore.deleteUser(testProUserId);
  await DataStore.deleteUser(testPaygUserId);

  console.log('====================================================');
  console.log(`🎉 All ${passedTests}/${passedTests} Task B8 Job Match Tests Passed!`);
  console.log('====================================================\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
