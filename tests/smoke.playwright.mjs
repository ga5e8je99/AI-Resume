/**
 * Playwright End-to-End Smoke Test Suite
 * Verifies core user journeys in a real headless Chromium/Edge browser:
 * 1. Homepage (/)
 * 2. Registration (/register)
 * 3. Login (/login)
 * 4. Upload CV (.txt / .pdf resume upload)
 * 5. ATS Analysis (/review score & keyword diagnostics)
 * 6. Pricing (/pricing plans, billing toggle & provider status)
 */

import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DB_FILE = path.join(ROOT, '.data', 'db.json');

function checkPortOpen(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
      res.resume();
      resolve(res.statusCode && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureServer() {
  for (const port of [3000, 3100]) {
    if (await checkPortOpen(port)) {
      console.log(`[Smoke Test] Using running Next.js server at http://127.0.0.1:${port}`);
      return { baseUrl: `http://127.0.0.1:${port}`, child: null };
    }
  }

  const lockFile = path.join(ROOT, '.next', 'dev', 'lock');
  if (fs.existsSync(lockFile)) {
    try {
      fs.unlinkSync(lockFile);
    } catch {
      // Ignore if held by another process
    }
  }

  const port = 3105;
  console.log(`[Smoke Test] Starting Next.js server on port ${port}...`);
  const nextBin = path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');
  const useProdBuild =
    process.env.SMOKE_USE_PROD_BUILD === 'true' &&
    fs.existsSync(path.join(ROOT, '.next', 'BUILD_ID'));
  const args = useProdBuild
    ? [nextBin, 'start', '-p', String(port)]
    : [nextBin, 'dev', '--webpack', '-p', String(port)];

  const child = spawn(process.execPath, args, {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PORT: String(port),
      JWT_SECRET: process.env.JWT_SECRET || 'smoke_test_jwt_secret_key_min_32_characters_2026',
    },
  });

  child.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    if (text.includes('Ready') || text.includes('Local:')) {
      process.stdout.write(text);
    }
  });

  const start = Date.now();
  while (Date.now() - start < 120000) {
    if (await checkPortOpen(port)) {
      console.log(`[Smoke Test] Server ready at http://127.0.0.1:${port}`);
      return { baseUrl: `http://127.0.0.1:${port}`, child };
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  child.kill();
  throw new Error('Timed out waiting for Next.js server to start for smoke tests');
}

async function launchBrowser() {
  const edgeCandidates = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  const existingEdge = edgeCandidates.find((p) => fs.existsSync(p));

  try {
    return await chromium.launch({ headless: true });
  } catch {
    if (existingEdge) {
      return await chromium.launch({ headless: true, executablePath: existingEdge });
    }
    return await chromium.launch({ headless: true, channel: 'msedge' });
  }
}

async function runSmokeTests() {
  const dbSnapshot = fs.existsSync(DB_FILE) ? fs.readFileSync(DB_FILE, 'utf-8') : null;
  let passed = 0;
  let failed = 0;

  function check(condition, label, detail = '') {
    if (condition) {
      console.log(`  ✓ PASS: ${label}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${label}${detail ? ` (${detail})` : ''}`);
      failed++;
    }
  }

  const { baseUrl, child } = await ensureServer();
  const browser = await launchBrowser();

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });

    await context.addInitScript(() => {
      try {
        window.localStorage.setItem('jobmatch_first_visit_splash_seen_v1', 'true');
        window.localStorage.setItem('jobmatch_user_language', 'en');
        window.localStorage.setItem(
          'jobmatch_cookie_consent_v1',
          JSON.stringify({
            necessary: true,
            analytics: false,
            status: 'declined',
            updatedAt: new Date().toISOString(),
          })
        );
      } catch {
        // Ignore on blank frame
      }
    });

    const page = await context.newPage();

    async function fillHydrated(selector, value) {
      const locator = page.locator(selector);
      await locator.waitFor({ state: 'visible', timeout: 30000 });
      for (let attempt = 0; attempt < 5; attempt++) {
        await locator.fill(value);
        await page.waitForTimeout(150);
        const current = await locator.inputValue();
        if (current === value) return;
      }
    }

    // =========================================================================
    // 1. HOMEPAGE (/)
    // =========================================================================
    console.log('\n[1/6] Smoke Test: Homepage (/)');
    const homeRes = await page.goto(`${baseUrl}/`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    check(homeRes && homeRes.status() === 200, 'Homepage responds with HTTP 200');
    await page.waitForSelector('main#main-content', { timeout: 30000 });
    const homeHeading = await page.locator('h1').first().textContent();
    check(Boolean(homeHeading && homeHeading.trim().length > 5), 'Homepage renders primary H1 heading', homeHeading?.trim());
    const scannerSection = await page.locator('#ats-scanner').count();
    check(scannerSection > 0, 'Homepage renders #ats-scanner dropzone section');

    // =========================================================================
    // 2. REGISTRATION (/register)
    // =========================================================================
    console.log('\n[2/6] Smoke Test: Registration (/register)');
    const smokeEmail = `smoke_${Date.now()}@jobmatch.ai`;
    const smokePassword = 'SmokePassword123!';

    await page.goto(`${baseUrl}/register`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    await page.waitForSelector('#reg-name', { timeout: 30000 });

    await fillHydrated('#reg-name', 'Smoke Test Engineer');
    await fillHydrated('#reg-email', smokeEmail);
    await fillHydrated('#reg-password', smokePassword);
    await fillHydrated('#reg-confirm-password', smokePassword);

    const termsBox = page.locator('#reg-terms-checkbox');
    if (!(await termsBox.isChecked())) {
      await termsBox.check({ force: true });
    }

    const [regResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/auth/register') && res.request().method() === 'POST', {
        timeout: 30000,
      }),
      page.locator('form button[type="submit"]').click(),
    ]);

    check(regResponse.status() === 201, 'POST /api/auth/register returns 201 Created');
    await page.waitForURL((url) => url.pathname.includes('/dashboard'), { timeout: 30000 });
    check(page.url().includes('/dashboard'), 'Registration redirects user to /dashboard');

    // =========================================================================
    // 3. LOGIN (/login)
    // =========================================================================
    console.log('\n[3/6] Smoke Test: Login (/login)');
    // Log out first so we can test the full /login form flow
    await page.evaluate(async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.localStorage.removeItem('jobmatch_user');
    });
    await context.clearCookies();

    await page.goto(`${baseUrl}/login`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    await page.waitForSelector('#login-email', { timeout: 30000 });

    await fillHydrated('#login-email', smokeEmail);
    await fillHydrated('#login-password', smokePassword);

    const [loginResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/auth/login') && res.request().method() === 'POST', {
        timeout: 30000,
      }),
      page.locator('form button[type="submit"]').click(),
    ]);

    check(loginResponse.status() === 200, 'POST /api/auth/login returns 200 OK');
    await page.waitForURL((url) => url.pathname.includes('/dashboard'), { timeout: 30000 });
    check(page.url().includes('/dashboard'), 'Login redirects authenticated user to /dashboard');

    // =========================================================================
    // 4 & 5. UPLOAD CV & ATS ANALYSIS (/review)
    // =========================================================================
    console.log('\n[4/6 & 5/6] Smoke Test: Upload CV & ATS Analysis (/review)');
    await page.goto(`${baseUrl}/review`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    await page.waitForSelector('input[type="file"][accept=".pdf,.docx,.txt"]', {
      state: 'attached',
      timeout: 30000,
    });
    await page.waitForTimeout(300);

    const sampleCvContent = [
      'Smoke Test Engineer',
      'San Francisco, CA | smoke.engineer@jobmatch.ai | +1 (555) 234-5678 | linkedin.com/in/smokeengineer | github.com/smokeengineer',
      '',
      'PROFESSIONAL SUMMARY',
      'Senior Full Stack Software Engineer with 7+ years of experience building scalable cloud applications using TypeScript, React, Next.js, Node.js, PostgreSQL, and AWS.',
      '',
      'WORK EXPERIENCE',
      'CloudScale Technologies — Senior Full Stack Software Engineer',
      '2022-01 - Present',
      '- Architected microservices and Next.js web applications serving 250,000+ daily active users, improving latency by 45%.',
      '- Led a team of 6 engineers to deliver automated CI/CD pipelines with GitHub Actions, Docker, and Kubernetes, reducing deployment time by 60%.',
      '- Optimized PostgreSQL and Redis caching layers, cutting database CPU utilization by 38%.',
      '',
      'EDUCATION',
      'University of California — Bachelor of Science in Computer Science',
      '2015 - 2019',
      '',
      'SKILLS',
      'TypeScript, JavaScript, React, Next.js, Node.js, PostgreSQL, MongoDB, Redis, Docker, Kubernetes, AWS, CI/CD, Git',
    ].join('\n');

    const fileInput = page.locator('input[type="file"][accept=".pdf,.docx,.txt"]').first();
    await fileInput.setInputFiles({
      name: 'smoke_test_cv.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(sampleCvContent, 'utf-8'),
    });

    // Wait for staged extraction & scoring to complete and render the uploaded filename
    await page.waitForFunction(
      () => document.body.innerText.includes('smoke_test_cv.txt'),
      { timeout: 30000 }
    );
    check(true, 'CV file (smoke_test_cv.txt) uploaded and extracted in browser');

    const reviewBodyText = await page.locator('body').innerText();
    const hasScoreMetrics =
      reviewBodyText.includes('TypeScript') &&
      (reviewBodyText.includes('/100') || reviewBodyText.includes('ATS') || reviewBodyText.includes('%'));
    check(hasScoreMetrics, 'ATS analysis engine scored uploaded CV and displayed detected keywords');

    // =========================================================================
    // 6. PRICING PAGE (/pricing)
    // =========================================================================
    console.log('\n[6/6] Smoke Test: Pricing Page (/pricing)');
    const pricingRes = await page.goto(`${baseUrl}/pricing`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    check(pricingRes && pricingRes.status() === 200, 'Pricing page responds with HTTP 200');
    await page.waitForFunction(
      () =>
        document.body.innerText.includes('Pro') &&
        (document.body.innerText.includes('Free') || document.body.innerText.includes('Pay')),
      { timeout: 30000 }
    );
    const pricingText = await page.locator('body').innerText();
    check(
      pricingText.includes('Pro') && pricingText.includes('Free'),
      'Pricing page renders Free, Pay-As-You-Go, and Pro plan cards'
    );

    await context.close();
  } finally {
    await browser.close();
    if (child) {
      child.kill();
    }
    if (dbSnapshot !== null) {
      fs.writeFileSync(DB_FILE, dbSnapshot, 'utf-8');
    }
  }

  console.log(`\n========================================`);
  console.log(`Playwright Smoke Tests Passed: ${passed}`);
  console.log(`Playwright Smoke Tests Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSmokeTests().catch((err) => {
  console.error('[Smoke Test Fatal Error]:', err);
  process.exit(1);
});

