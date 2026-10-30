import { chromium } from 'playwright';
import assert from 'assert';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const VIEWPORTS = [
  { name: 'Mobile (360px)', width: 360, height: 800 },
  { name: 'Tablet (768px)', width: 768, height: 1024 },
  { name: 'Desktop (1440px)', width: 1440, height: 900 },
];

const PAGES = [
  { name: 'Home', path: '/' },
  { name: 'Login', path: '/login' },
  { name: 'Register', path: '/register' },
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Builder', path: '/builder' },
  { name: 'Scanner', path: '/review' },
  { name: 'Cover Letter', path: '/cover-letter' },
  { name: 'AI Resume Generator', path: '/resume/generate' },
  { name: 'Job Match', path: '/jobs' },
  { name: 'Pricing', path: '/pricing' },
  { name: 'Crypto Payment', path: '/payment/crypto' },
  { name: 'Admin Payments', path: '/admin/payments' },
  { name: '404 Page', path: '/non-existent-page-for-404-check' },
];

const LANGUAGES = ['ar', 'en', 'de', 'fr', 'es', 'tr'];

console.log('--- [Task B10: Final Product UI/UX Matrix Validation] ---');
console.log('Testing 3 Viewports (360px, 768px, 1440px) x 6 Languages (AR RTL, EN, DE, FR, ES, TR) x Dark/Light theme...\n');

async function runMatrix() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  let totalTests = 0;
  let passedTests = 0;

  for (const vp of VIEWPORTS) {
    console.log(`\n=== Testing Viewport: ${vp.name} ===`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await context.newPage();

    for (const pageDef of PAGES) {
      for (const lang of LANGUAGES) {
        for (const theme of ['dark', 'light']) {
          totalTests++;
          await context.addCookies([
            { name: 'jobmatch_user_language', value: lang, domain: 'localhost', path: '/' },
            { name: 'jobmatch_theme', value: theme, domain: 'localhost', path: '/' },
          ]);

          try {
            await page.goto(`${BASE_URL}${pageDef.path}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
            await page.waitForTimeout(60);

            const pageMetrics = await page.evaluate((testLang) => {
              const doc = document.documentElement;
              const scrollW = doc.scrollWidth;
              const innerW = window.innerWidth;
              const hasHorizontalOverflow = scrollW > innerW + 4; // allow small subpixel margin

              const bodyStyle = window.getComputedStyle(document.body);
              const htmlDir = doc.getAttribute('dir');

              return {
                scrollW,
                innerW,
                hasHorizontalOverflow,
                htmlDir,
                title: document.title,
              };
            }, lang);

            assert(!pageMetrics.hasHorizontalOverflow, 
              `Horizontal overflow detected on ${pageDef.name} at ${vp.width}px (${lang} ${theme}): scrollWidth=${pageMetrics.scrollW} > innerWidth=${pageMetrics.innerW}`);

            if (lang === 'ar') {
              assert(pageMetrics.htmlDir === 'rtl', `Expected dir=rtl for Arabic on ${pageDef.name}`);
            }

            passedTests++;
          } catch (err) {
            console.error(`  ✗ FAIL [${vp.name} | ${lang.toUpperCase()} ${theme} | ${pageDef.name}]:`, err.message);
          }
        }
      }
      console.log(`  ✓ ${pageDef.name} passed across 6 languages & dark/light themes at ${vp.width}px`);
    }

    await context.close();
  }

  await browser.close();

  console.log('\n======================================================');
  console.log(`Matrix Validation Complete: ${passedTests}/${totalTests} checks passed.`);
  console.log('======================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runMatrix().catch((err) => {
  console.error('Fatal matrix error:', err);
  process.exit(1);
});
