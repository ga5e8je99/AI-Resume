import http from 'http';
import { spawn } from 'child_process';

const BASE_URL = 'http://localhost:3000';

async function isServerRunning() {
  return new Promise((resolve) => {
    const req = http.get(BASE_URL + '/api/auth/me', (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startServer() {
  console.log('Starting production Next.js server...');
  const child = spawn('npx', ['next', 'start', '-p', '3000'], {
    shell: true,
    stdio: 'ignore',
    detached: false,
  });

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await isServerRunning()) {
      console.log('Server is ready on localhost:3000');
      return child;
    }
  }
  throw new Error('Server failed to start within 30 seconds');
}

async function runTests() {
  let serverProcess = null;
  let didStartServer = false;

  try {
    const running = await isServerRunning();
    if (!running) {
      serverProcess = await startServer();
      didStartServer = true;
    }

    console.log('\n--- Running Demo Auth Verification Tests ---\n');

    // Test 1: POST /api/auth/demo
    console.log('Test 1: Calling POST /api/auth/demo...');
    const demoRes = await fetch(BASE_URL + '/api/auth/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!demoRes.ok) {
      const errText = await demoRes.text();
      throw new Error(`Demo login failed with status ${demoRes.status}: ${errText}`);
    }

    const demoData = await demoRes.json();
    console.log('Demo response user:', demoData.user);

    if (!demoData.success) throw new Error('demoData.success should be true');
    if (!demoData.user.isDemo) throw new Error('demoData.user.isDemo must be true');
    if (demoData.user.email !== 'demo@jobmatch.ai') throw new Error('demoData.user.email must be demo@jobmatch.ai');

    const setCookie = demoRes.headers.get('set-cookie');
    if (!setCookie || !setCookie.includes('jobmatch_token')) {
      throw new Error('Expected jobmatch_token cookie in set-cookie header');
    }
    const tokenMatch = setCookie.match(/jobmatch_token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : '';
    console.log('✓ Token cookie extracted successfully');

    const authHeaders = {
      Cookie: `jobmatch_token=${token}`,
      'Content-Type': 'application/json',
    };

    // Test 2: Verify /api/auth/me returns isDemo: true
    console.log('Test 2: Verifying session via GET /api/auth/me...');
    const meRes = await fetch(BASE_URL + '/api/auth/me', { headers: authHeaders });
    const meData = await meRes.json();
    if (!meData.user?.isDemo) throw new Error('GET /api/auth/me should return isDemo: true');
    console.log('✓ Session verified for demo user:', meData.user.name, `(isDemo: ${meData.user.isDemo})`);

    // Test 3: Verify seeded Resume
    console.log('Test 3: Checking pre-seeded resume via GET /api/resumes...');
    const resumesRes = await fetch(BASE_URL + '/api/resumes', { headers: authHeaders });
    const resumesData = await resumesRes.json();
    const resumes = resumesData.resumes || [];
    if (resumes.length !== 1) throw new Error(`Expected 1 pre-seeded resume, found ${resumes.length}`);
    const resume = resumes[0];
    if (!resume.title.includes('Alex Rivera')) throw new Error(`Unexpected resume title: ${resume.title}`);
    console.log('✓ Seeded resume found:', resume.title);

    // Test 4: Verify seeded ATS Scan Report
    console.log('Test 4: Checking pre-seeded ATS scan via GET /api/analyses...');
    const analysesRes = await fetch(BASE_URL + '/api/analyses', { headers: authHeaders });
    const analysesData = await analysesRes.json();
    const analyses = analysesData.analyses || [];
    if (analyses.length !== 1) throw new Error(`Expected 1 pre-seeded analysis, found ${analyses.length}`);
    const analysis = analyses[0];
    if (analysis.overallScore !== 88) throw new Error(`Expected overallScore 88, got ${analysis.overallScore}`);
    console.log('✓ Seeded ATS report found: score', analysis.overallScore, `(${analysis.matchLabel})`);

    // Test 5: Verify seeded Cover Letter Draft
    console.log('Test 5: Checking pre-seeded cover letter via GET /api/cover-letters...');
    const clRes = await fetch(BASE_URL + '/api/cover-letters', { headers: authHeaders });
    const clData = await clRes.json();
    const coverLetters = clData.coverLetters || clData.items || [];
    if (coverLetters.length !== 1) throw new Error(`Expected 1 pre-seeded cover letter, found ${coverLetters.length}`);
    const cl = coverLetters[0];
    if (!cl.companyName.includes('Acme Cloud')) throw new Error(`Unexpected companyName: ${cl.companyName}`);
    console.log('✓ Seeded cover letter found:', cl.title, 'for', cl.companyName);

    // Test 6: Idempotence test (re-seed does not duplicate data)
    console.log('Test 6: Testing idempotence by calling POST /api/auth/demo a second time...');
    const demoRes2 = await fetch(BASE_URL + '/api/auth/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!demoRes2.ok) throw new Error('Second demo login call failed');

    const resumesRes2 = await fetch(BASE_URL + '/api/resumes', { headers: authHeaders });
    const analysesRes2 = await fetch(BASE_URL + '/api/analyses', { headers: authHeaders });
    const clRes2 = await fetch(BASE_URL + '/api/cover-letters', { headers: authHeaders });

    const rCount = (await resumesRes2.json()).resumes?.length || 0;
    const aCount = (await analysesRes2.json()).analyses?.length || 0;
    const clData2 = await clRes2.json();
    const cCount = (clData2.coverLetters || clData2.items || []).length;

    if (rCount !== 1 || aCount !== 1 || cCount !== 1) {
      throw new Error(`Idempotence check failed: resume count=${rCount}, analysis count=${aCount}, coverLetter count=${cCount}`);
    }
    console.log('✓ Idempotence verified: exactly 1 resume, 1 analysis, and 1 cover letter after second demo initialization.');

    console.log('\n==========================================');
    console.log('🎉 ALL DEMO AUTH TESTS PASSED SUCCESSFULLY');
    console.log('==========================================\n');
  } finally {
    if (didStartServer && serverProcess) {
      console.log('Stopping test server...');
      try {
        process.platform === 'win32'
          ? spawn('taskkill', ['/pid', serverProcess.pid.toString(), '/T', '/F'])
          : serverProcess.kill('SIGTERM');
      } catch (e) {}
    }
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
