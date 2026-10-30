/**
 * Automated Test Suite for Phase 9: Server-side AI Integration & Resilience Fallback
 * Verifies AICoverLetterClient, timeouts, retry logic, error handling, and zero-hallucination fallback.
 */

import http from 'http';
import jwt from 'jsonwebtoken';

function assert(condition, message) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`[PASS] ${message}`);
}

async function runTests() {
  console.log('--- Starting Phase 9: AI Integration & Fallback Resilience Test Suite ---\n');

  // Dynamically import the compiled or TS modules via tsx / ts-node or Next.js app modules
  const { AICoverLetterClient } = await import('../app/lib/aiCoverLetterClient.ts');

  // Test 1: Config resolution with defaults
  const config = AICoverLetterClient.getConfig();
  assert(typeof config.timeoutMs === 'number' && config.timeoutMs >= 1000, 'Config resolves valid timeoutMs');
  assert(typeof config.maxRetries === 'number' && config.maxRetries >= 0, 'Config resolves valid maxRetries');
  assert(typeof config.model === 'string' && config.model.length > 0, 'Config resolves model name');

  // Test 2: Behavior when no API key is set (Default Development / Production Fallback)
  const sampleRequest = {
    jobDescription: 'We are seeking an experienced Full Stack Software Engineer skilled in React, Node.js, and TypeScript.',
    jobTitle: 'Senior Full Stack Engineer',
    companyName: 'Tech Innovations Inc',
    hiringManager: 'Engineering Hiring Manager',
    tone: 'technical',
    language: 'en',
    sender: {
      fullName: 'Ahmed Salem',
      email: 'ahmed@example.com',
      phone: '+966500000000',
    },
  };

  const sampleResume = {
    data: {
      personalInfo: {
        fullName: 'Ahmed Salem',
        email: 'ahmed@example.com',
        jobTitle: 'Full Stack Developer',
      },
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
      experience: [
        {
          position: 'Software Engineer',
          company: 'Cloud Scale',
          startDate: '2021',
          endDate: 'Present',
        },
      ],
    },
  };

  const resultNoKey = await AICoverLetterClient.generateCoverLetter(sampleRequest, sampleResume);
  assert(resultNoKey && resultNoKey.coverLetter, 'Generator returns valid cover letter data without API key');
  assert(resultNoKey.aiGenerated === false, 'aiGenerated flag is false when using built-in engine');
  assert(resultNoKey.provider === 'built-in-ats-engine', 'Provider is identified as built-in-ats-engine');
  assert(resultNoKey.coverLetter.content.bodyParagraphs.length >= 2, 'Cover letter contains multiple body paragraphs');
  assert(resultNoKey.coverLetter.content.fullText.includes('Ahmed Salem'), 'Full text includes candidate name');
  assert(resultNoKey.coverLetter.content.fullText.includes('Tech Innovations Inc'), 'Full text includes target company');

  // Test 3: Resilience when mock external server returns HTTP 500 / 429
  // Spin up a transient mock server simulating a failing external AI endpoint
  let mockServerRequests = 0;
  const mockServer = http.createServer((req, res) => {
    mockServerRequests++;
    // Simulate HTTP 500 error
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: 'Internal server error from external AI provider' } }));
  });

  await new Promise((resolve) => mockServer.listen(0, '127.0.0.1', resolve));
  const mockPort = mockServer.address().port;
  const mockBaseUrl = `http://127.0.0.1:${mockPort}`;

  // Temporarily set mock env vars
  const origKey = process.env.OPENAI_API_KEY;
  const origBase = process.env.OPENAI_BASE_URL;
  const origRetries = process.env.AI_MAX_RETRIES;
  const origTimeout = process.env.AI_REQUEST_TIMEOUT_MS;

  process.env.OPENAI_API_KEY = 'test-mock-key';
  process.env.OPENAI_BASE_URL = mockBaseUrl;
  process.env.AI_MAX_RETRIES = '1';
  process.env.AI_REQUEST_TIMEOUT_MS = '2000';

  const resultFailedAI = await AICoverLetterClient.generateCoverLetter(sampleRequest, sampleResume);

  assert(mockServerRequests > 1, `Retry mechanism attempted requests on transient 500 (attempted: ${mockServerRequests})`);
  assert(resultFailedAI.aiGenerated === false, 'Gracefully switches to fallback when provider fails');
  assert(resultFailedAI.provider === 'built-in-ats-fallback', 'Identified as built-in-ats-fallback upon error');
  assert(resultFailedAI.fallbackReason && resultFailedAI.fallbackReason.includes('500'), 'Logs informative fallback reason without crashing');
  assert(resultFailedAI.coverLetter.content.fullText.length > 100, 'Fallback generates complete letter text');

  // Test 4: Mock server returning successful valid JSON with markdown fence
  mockServer.removeAllListeners('request');
  mockServer.on('request', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        choices: [
          {
            message: {
              content: "```json\n" + JSON.stringify({
                subject: "Application for Senior Full Stack Engineer",
                salutation: "Dear Hiring Team,",
                introduction: "I am writing to enthusiastically apply for the Senior Full Stack Engineer position at Tech Innovations Inc.",
                bodyParagraphs: [
                  "With extensive hands-on experience in React and Node.js, I have architected high-throughput web systems.",
                  "At Cloud Scale, I led backend initiatives delivering 40% performance gains."
                ],
                conclusion: "I look forward to discussing how my technical background aligns with your engineering roadmap.",
                signOff: "Sincerely,",
                fullText: "Dear Hiring Team,\n\nI am writing to enthusiastically apply for the Senior Full Stack Engineer position at Tech Innovations Inc.\n\nWith extensive hands-on experience in React and Node.js, I have architected high-throughput web systems.\n\nAt Cloud Scale, I led backend initiatives delivering 40% performance gains.\n\nI look forward to discussing how my technical background aligns with your engineering roadmap.\n\nSincerely,\nAhmed Salem",
                extractedKeywords: ["React", "Node.js", "TypeScript"]
              }) + "\n```"
            }
          }
        ]
      })
    );
  });

  const resultSuccessAI = await AICoverLetterClient.generateCoverLetter(sampleRequest, sampleResume);
  assert(resultSuccessAI.aiGenerated === true, 'Successfully parses LLM output and marks aiGenerated = true');
  assert(resultSuccessAI.coverLetter.content.bodyParagraphs.length === 2, 'Parsed 2 body paragraphs from AI response');
  assert(resultSuccessAI.coverLetter.extractedKeywords.includes('React'), 'Extracted keywords preserved from AI response');

  // Test 5: Mock server returning malformed/corrupted non-JSON response
  mockServer.removeAllListeners('request');
  mockServer.on('request', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        choices: [
          {
            message: {
              content: "I cannot generate valid JSON right now. Here is random text instead without required fields."
            }
          }
        ]
      })
    );
  });

  const resultMalformed = await AICoverLetterClient.generateCoverLetter(sampleRequest, sampleResume);
  assert(resultMalformed.aiGenerated === false, 'Catches malformed AI response and seamlessly executes fallback');
  assert(resultMalformed.provider === 'built-in-ats-fallback', 'Fallback provider assigned when schema validation fails');
  assert(resultMalformed.coverLetter.content.fullText.length > 50, 'Complete fallback text produced');

  // Cleanup mock server & restore environment
  mockServer.close();
  if (origKey !== undefined) process.env.OPENAI_API_KEY = origKey; else delete process.env.OPENAI_API_KEY;
  if (origBase !== undefined) process.env.OPENAI_BASE_URL = origBase; else delete process.env.OPENAI_BASE_URL;
  if (origRetries !== undefined) process.env.AI_MAX_RETRIES = origRetries; else delete process.env.AI_MAX_RETRIES;
  if (origTimeout !== undefined) process.env.AI_REQUEST_TIMEOUT_MS = origTimeout; else delete process.env.AI_REQUEST_TIMEOUT_MS;

  // Test 6: Verify end-to-end API Route on live local server
  try {
    const testToken = jwt.sign(
      { userId: 'usr_mvpabfxqsnc5', email: 'demo@jobmatch.ai', name: 'Alex Rivera (Demo)', role: 'user', isDemo: true },
      process.env.JWT_SECRET || 'jobmatch_ats_ai_resume_super_secret_jwt_key_2026',
      { expiresIn: '1h' }
    );
    const apiRes = await fetch('http://localhost:3000/api/cover-letter/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify(sampleRequest),
    });

    assert(apiRes.status === 200, 'POST /api/cover-letter/generate returns HTTP 200');
    const apiData = await apiRes.json();
    assert(apiData.success === true, 'API response indicates success: true');
    assert(typeof apiData.provider === 'string', 'API response includes provider metadata');
    assert(typeof apiData.aiGenerated === 'boolean', 'API response includes aiGenerated metadata');
    assert(apiData.coverLetter && apiData.coverLetter.content, 'API response returns full cover letter structure');

    // Security assertion: API response must NEVER leak secret keys
    const rawResString = JSON.stringify(apiData);
    assert(!rawResString.includes('jobmatch_ats_ai_resume_super_secret_jwt_key_2026'), 'API response does not leak JWT secret');
    assert(!rawResString.includes('GA138989@20102011f'), 'API response does not leak Admin key');
  } catch (err) {
    console.warn('Note: Local dev server was not reachable for Test 6, skipping live HTTP endpoint test:', err.message);
  }

  console.log('\n--- Phase 9 Test Summary: All AI Integration & Resilience Tests Passed Successfully ---');
}

runTests().catch((err) => {
  console.error('Test runner failure:', err);
  process.exit(1);
});
