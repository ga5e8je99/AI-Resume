import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

const VIEWPORTS = [320, 375, 768, 1024, 1440];
const LOCALES = ['en', 'ar'];
const PAGES = [
  { name: 'home', path: '/' },
  { name: 'jobs', path: '/jobs' },
  { name: 'pricing', path: '/pricing' },
  { name: 'payment-crypto', path: '/payment/crypto' },
  { name: 'dashboard', path: '/dashboard' },
  { name: 'builder', path: '/builder' },
];

function checkPortOpen(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
      res.resume();
      resolve(true);
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
      console.log(`Using existing Next.js server on http://127.0.0.1:${port}`);
      return { baseUrl: `http://127.0.0.1:${port}`, child: null };
    }
  }

  // Remove stale .next/dev/lock if no server is active
  const lockFile = path.join(ROOT, '.next', 'dev', 'lock');
  if (fs.existsSync(lockFile)) {
    try {
      fs.unlinkSync(lockFile);
    } catch {}
  }

  const port = 3100;
  console.log(`Starting Next.js dev server on port ${port}...`);
  const nextBin = path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');
  const child = spawn(process.execPath, [nextBin, 'dev', '--webpack', '-p', String(port)], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: String(port) },
  });
  child.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    if (text.includes('Ready') || text.includes('Local:')) {
      process.stdout.write(text);
    }
  });
  child.stderr.on('data', (chunk) => {
    process.stderr.write(chunk.toString());
  });

  const start = Date.now();
  while (Date.now() - start < 120000) {
    if (await checkPortOpen(port)) {
      console.log(`Server ready at http://127.0.0.1:${port}`);
      return { baseUrl: `http://127.0.0.1:${port}`, child };
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  child.kill();
  throw new Error('Timed out waiting for Next.js server to start');
}

async function main() {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  let passed = 0;
  let failed = 0;
  function assert(condition, label, detail = '') {
    if (condition) {
      console.log(`  PASS: ${label}`);
      passed++;
    } else {
      console.error(`  FAIL: ${label}${detail ? ` -> ${detail}` : ''}`);
      failed++;
    }
  }

  const { baseUrl, child } = await ensureServer();
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browser = await chromium.launch({
    headless: true,
    ...(fs.existsSync(edgePath) ? { executablePath: edgePath } : { channel: 'msedge' }),
  });

  try {
    for (const lang of LOCALES) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });

      // Mock authenticated user & dashboard data so /dashboard and AppShell render cleanly
      await context.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'usr_responsive_demo_01',
              name: lang === 'ar' ? 'أحمد السالم' : 'Alexander Maximilian',
              email: 'alexander.maximilian.workspace@enterprise-engineering-cloud.io',
              role: 'user',
              plan: 'pro',
              aiCredits: 25,
              billingCycle: 'monthly',
              subscriptionStatus: 'active',
            },
          }),
        });
      });

      await context.route('**/api/dashboard**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            resumes: [
              {
                id: 'res_01',
                title: 'Senior_Principal_Distributed_Systems_Architect_Resume_2026_v4',
                templateId: 'ats-friendly',
                theme: {},
                data: {
                  personalInfo: {
                    name: 'Alexander Maximilian',
                    email: 'alexander.maximilian.workspace@enterprise-engineering-cloud.io',
                  },
                },
                updatedAt: new Date().toISOString(),
              },
            ],
            analyses: [
              {
                id: 'an_01',
                resumeFileName: 'Alexander_Maximilian_Enterprise_Cloud_Architect_2026_Final.pdf',
                targetRole: 'Principal Cloud Solutions Architect',
                overallScore: 92,
                grade: 'A+',
                rankPercentile: 'Top 5%',
                matchLabel: 'Strong Match',
                createdAt: new Date().toISOString(),
                result: {
                  matchingKeywords: ['TypeScript', 'Kubernetes', 'AWS', 'Next.js'],
                  missingKeywords: ['Terraform', 'GraphQL'],
                },
              },
            ],
            coverLetters: [
              {
                id: 'cl_01',
                title: 'Principal Cloud Architect Cover Letter — Global Fintech Corp',
                targetRole: 'Principal Cloud Architect',
                companyName: 'Global Fintech Corp',
                status: 'ready',
                tone: 'executive',
                updatedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
              },
            ],
          }),
        });
      });

      await context.addInitScript((locale) => {
        try {
          window.localStorage.setItem('jobmatch_user_language', locale);
          window.localStorage.setItem('app_language', locale);
          window.localStorage.setItem('jobmatch-lang', locale);
          window.localStorage.setItem('jobmatch_first_visit_splash_seen_v1', 'true');
          document.cookie = `jobmatch_user_language=${locale}; path=/; SameSite=Lax`;
        } catch {}
      }, lang);

      const page = await context.newPage();

      for (const pageDef of PAGES) {
        console.log(`\n=== Testing [${pageDef.name}] (${pageDef.path}) in [${lang}] ===`);

        await page.setViewportSize({ width: 1440, height: 844 });
        await page.goto(`${baseUrl}${pageDef.path}?lang=${lang}`, {
          waitUntil: 'domcontentloaded',
          timeout: 90000,
        });
        if (pageDef.name === 'dashboard') {
          await page.waitForSelector('[data-testid="app-sidebar"]', { state: 'attached', timeout: 30000 });
        } else if (pageDef.name === 'payment-crypto') {
          await page.waitForSelector('[data-testid="copy-wallet-address-btn"]', { state: 'visible', timeout: 30000 });
        }
        await page.waitForTimeout(1000);

        for (const width of VIEWPORTS) {
          await page.setViewportSize({ width, height: 844 });
          // Allow responsive layout & CSS media queries to settle
          await page.waitForTimeout(400);

          // Check horizontal overflow
          const overflowInfo = await page.evaluate(() => {
            const docWidth = document.documentElement.scrollWidth;
            const winWidth = window.innerWidth;
            const offenders = [];
            if (docWidth > winWidth) {
              const all = document.querySelectorAll('*');
              for (const el of all) {
                const r = el.getBoundingClientRect();
                if (r.right > winWidth + 1 || r.left < -1) {
                  offenders.push({
                    tag: el.tagName.toLowerCase(),
                    cls: (el.className && typeof el.className === 'string' ? el.className : '').slice(0, 80),
                    left: Math.round(r.left),
                    right: Math.round(r.right),
                  });
                  if (offenders.length >= 5) break;
                }
              }
            }
            return {
              docWidth,
              winWidth,
              dir: document.documentElement.getAttribute('dir'),
              offenders,
            };
          });

          assert(
            overflowInfo.docWidth <= overflowInfo.winWidth,
            `[${pageDef.name}] [${lang}] @ ${width}px has zero horizontal overflow (scrollWidth=${overflowInfo.docWidth} <= innerWidth=${overflowInfo.winWidth})`,
            JSON.stringify(overflowInfo.offenders)
          );

          // Verify AppShell behavior on /dashboard
          if (pageDef.name === 'dashboard') {
            const shellMetrics = await page.evaluate(() => {
              const sidebar = document.querySelector('[data-testid="app-sidebar"]');
              const drawerTrigger = document.querySelector('[data-testid="app-mobile-drawer-trigger"]');
              const sidebarVisible = sidebar ? window.getComputedStyle(sidebar).display !== 'none' : false;
              const triggerRect = drawerTrigger ? drawerTrigger.getBoundingClientRect() : null;
              return {
                sidebarVisible,
                triggerVisible: triggerRect ? triggerRect.width > 0 && triggerRect.height > 0 : false,
                triggerWidth: triggerRect ? Math.round(triggerRect.width) : 0,
                triggerHeight: triggerRect ? Math.round(triggerRect.height) : 0,
              };
            });

            if (width < 1024) {
              assert(
                !shellMetrics.sidebarVisible && shellMetrics.triggerVisible,
                `[${pageDef.name}] [${lang}] @ ${width}px (<lg): Sidebar is hidden and Drawer trigger is visible`
              );
              assert(
                shellMetrics.triggerWidth >= 44 && shellMetrics.triggerHeight >= 44,
                `[${pageDef.name}] [${lang}] @ ${width}px: Drawer trigger touch target >= 44px (${shellMetrics.triggerWidth}x${shellMetrics.triggerHeight})`
              );
            } else {
              assert(
                shellMetrics.sidebarVisible && !shellMetrics.triggerVisible,
                `[${pageDef.name}] [${lang}] @ ${width}px (>=lg): Desktop Sidebar is visible`
              );
            }
          }

          // Verify Copy button feedback on /payment/crypto at 375px
          if (pageDef.name === 'payment-crypto' && width === 375) {
            const copyBtn = page.locator('[data-testid="copy-wallet-address-btn"]');
            if ((await copyBtn.count()) > 0) {
              await copyBtn.click();
              await page.waitForTimeout(300);
              const btnText = (await copyBtn.innerText()).trim();
              const expectedSub = lang === 'ar' ? 'تم النسخ' : 'Copied';
              assert(
                btnText.includes(expectedSub),
                `[payment-crypto] [${lang}] @ 375px Copy Wallet button shows "${expectedSub}" feedback (got "${btnText}")`
              );
            }
          }

          const screenshotPath = path.join(
            SCREENSHOTS_DIR,
            `${pageDef.name}-${lang}-${width}.png`
          );
          await page.screenshot({ path: screenshotPath, fullPage: false });
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
    if (child) {
      child.kill();
    }
  }

  console.log(`\n========================================`);
  console.log(`Total Passed: ${passed}`);
  console.log(`Total Failed: ${failed}`);
  console.log(`Screenshots saved to: ${SCREENSHOTS_DIR}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

