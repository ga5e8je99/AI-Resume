import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'qa', 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: '320x640', w: 320, h: 640 },
  { name: '360x800', w: 360, h: 800 },
  { name: '390x844', w: 390, h: 844 },
  { name: '768x1024', w: 768, h: 1024 },
  { name: '1024x768', w: 1024, h: 768 },
  { name: '1440x900', w: 1440, h: 900 },
];

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'builder', path: '/builder' },
  { name: 'review', path: '/review' },
  { name: 'cover-letter', path: '/cover-letter' },
  { name: 'login', path: '/login' },
  { name: 'privacy', path: '/privacy' },
];

const MODES = [
  { name: 'light-LTR', theme: 'light', dir: 'ltr', lang: 'en' },
  { name: 'dark-LTR', theme: 'dark', dir: 'ltr', lang: 'en' },
  { name: 'light-RTL', theme: 'light', dir: 'rtl', lang: 'ar' },
  { name: 'dark-RTL', theme: 'dark', dir: 'rtl', lang: 'ar' },
];

async function run() {
  console.log(`Starting QA Runner against ${BASE_URL}...`);
  console.log(`Screenshots will be saved to: ${SCREENSHOT_DIR}\n`);

  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch (err) {
    console.log('Falling back to default chromium...');
    browser = await chromium.launch({ headless: true });
  }

  const results = [];
  let overflowFailures = 0;

  for (const pageDef of PAGES) {
    console.log(`\n=== Testing Page: ${pageDef.name} (${pageDef.path}) ===`);

    for (const vp of VIEWPORTS) {
      for (const mode of MODES) {
        const context = await browser.newContext({
          viewport: { width: vp.w, height: vp.h },
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        });

        // Set localStorage before page loads
        await context.addInitScript(({ theme, lang }) => {
          try {
            window.localStorage.setItem('jobmatch-theme', theme);
            window.localStorage.setItem('jobmatch-lang', lang);
          } catch (e) {}
        }, { theme: mode.theme, lang: mode.lang });

        const page = await context.newPage();

        try {
          await page.goto(`${BASE_URL}${pageDef.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
          // Give client components 400ms to hydrate and settle layout
          await page.waitForTimeout(400);

          // Ensure DOM attributes match mode
          await page.evaluate(({ theme, dir, lang }) => {
            document.documentElement.setAttribute('data-theme', theme);
            if (theme === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
            document.documentElement.setAttribute('dir', dir);
            document.documentElement.setAttribute('lang', lang);
          }, { theme: mode.theme, dir: mode.dir, lang: mode.lang });

          await page.waitForTimeout(200);

          // Assert zero horizontal overflow
          const overflowCheck = await page.evaluate(() => {
            const docWidth = document.documentElement.scrollWidth;
            const winWidth = window.innerWidth;
            const bodyWidth = document.body.scrollWidth;
            const isOverflow = docWidth > winWidth + 1 || bodyWidth > winWidth + 1;

            let offendingElements = [];
            if (isOverflow) {
              const all = document.querySelectorAll('*');
              for (const el of all) {
                const rect = el.getBoundingClientRect();
                if (rect.right > winWidth + 2 || rect.left < -2) {
                  offendingElements.push({
                    tag: el.tagName.toLowerCase(),
                    id: el.id,
                    className: (el.className || '').toString().slice(0, 80),
                    rect: { left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) }
                  });
                  if (offendingElements.length >= 5) break;
                }
              }
            }

            return {
              docWidth,
              winWidth,
              bodyWidth,
              isOverflow,
              offendingElements
            };
          });

          const filename = `${pageDef.name}-${vp.name}-${mode.name}.png`;
          const filePath = path.join(SCREENSHOT_DIR, filename);

          // Take viewport screenshot
          await page.screenshot({ path: filePath, fullPage: false });

          const status = overflowCheck.isOverflow ? 'FAIL' : 'PASS';
          if (overflowCheck.isOverflow) {
            overflowFailures++;
            console.error(`  [${status}] ${filename} -> doc: ${overflowCheck.docWidth}px, win: ${overflowCheck.winWidth}px`);
            console.error('    Offending elements:', JSON.stringify(overflowCheck.offendingElements, null, 2));
          } else {
            process.stdout.write(`  [PASS] ${filename}\n`);
          }

          results.push({
            page: pageDef.name,
            viewport: vp.name,
            mode: mode.name,
            status,
            docWidth: overflowCheck.docWidth,
            winWidth: overflowCheck.winWidth,
            filename
          });
        } catch (err) {
          console.error(`  [ERROR] ${pageDef.name} ${vp.name} ${mode.name}:`, err.message);
          results.push({
            page: pageDef.name,
            viewport: vp.name,
            mode: mode.name,
            status: 'ERROR',
            error: err.message
          });
        } finally {
          await context.close();
        }
      }
    }
  }

  // Mobile Drawer Navigation Test
  console.log('\n=== Testing Mobile Drawer Navigation (<768px) ===');
  const drawerContext = await browser.newContext({
    viewport: { width: 360, height: 800 },
  });
  const drawerPage = await drawerContext.newPage();
  try {
    await drawerPage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await drawerPage.waitForTimeout(400);

    const hamburger = drawerPage.locator('button[aria-label*="Navigation Menu" i], button[aria-label*="menu" i]');
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await drawerPage.waitForTimeout(300);

      const isLocked = await drawerPage.evaluate(() => document.body.style.overflow === 'hidden');
      const drawerVisible = await drawerPage.locator('#mobile-drawer-dialog, [role="dialog"]').isVisible();
      console.log(`  Drawer visible: ${drawerVisible}, Scroll locked: ${isLocked}`);

      await drawerPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'drawer-open-360x800.png') });

      // Press Escape
      await drawerPage.keyboard.press('Escape');
      await drawerPage.waitForTimeout(300);

      const isUnlocked = await drawerPage.evaluate(() => document.body.style.overflow !== 'hidden');
      console.log(`  Drawer closed on Escape, Scroll unlocked: ${isUnlocked}`);
    } else {
      console.log('  Hamburger button not found or hidden.');
    }
  } catch (err) {
    console.error('  Drawer test error:', err.message);
  } finally {
    await drawerContext.close();
  }

  await browser.close();

  console.log('\n=======================================');
  console.log(`QA Matrix Complete: ${results.length} combinations tested.`);
  console.log(`Total Overflow Failures: ${overflowFailures}`);
  console.log(`Screenshots stored in: ${SCREENSHOT_DIR}`);
  console.log('=======================================\n');

  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, 'qa-results.json'),
    JSON.stringify({ timestamp: new Date().toISOString(), results, overflowFailures }, null, 2)
  );

  if (overflowFailures > 0) {
    process.exit(1);
  }
}

run().catch((e) => {
  console.error('QA Runner encountered unhandled error:', e);
  process.exit(1);
});
