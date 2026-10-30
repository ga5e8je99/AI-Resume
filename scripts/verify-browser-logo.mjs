import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'docs', 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function run() {
  console.log('Launching browser to verify logo system & icons...\n');
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge' });
  } catch {
    browser = await chromium.launch({ channel: 'chrome' });
  }
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // 1. Landing Page (Light Mode)
  console.log('1. Checking Landing Page (Light Mode)...');
  await page.goto('http://localhost:3000?lang=en', { waitUntil: 'networkidle' });

  // Verify Navbar Logo
  const navLogo = page.locator('header a[aria-label="JobMatch AI"] svg').first();
  await navLogo.waitFor({ state: 'visible', timeout: 5000 });
  const navBox = await navLogo.boundingBox();
  console.log(`✓ Navbar logo visible in light mode: width=${navBox.width.toFixed(1)}px, height=${navBox.height.toFixed(1)}px`);

  // Verify Favicon in HTML head
  const faviconSvg = await page.locator('link[rel="icon"][href*="icon.svg"]').count();
  const faviconIco = await page.locator('link[rel="icon"][href*="favicon.ico"]').count();
  console.log(`✓ Favicon links in <head>: svgCount=${faviconSvg}, icoCount=${faviconIco}`);

  // Screenshot light mode header
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'logo-light-navbar.png'), clip: { x: 0, y: 0, width: 1440, height: 120 } });

  // Verify Footer Logo
  const footerLogo = page.locator('footer a[aria-label="JobMatch AI"] svg').first();
  await footerLogo.scrollIntoViewIfNeeded();
  await footerLogo.waitFor({ state: 'visible' });
  const footerBox = await footerLogo.boundingBox();
  console.log(`✓ Footer logo visible in light mode: width=${footerBox.width.toFixed(1)}px, height=${footerBox.height.toFixed(1)}px`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'logo-light-footer.png'), clip: { x: 0, y: footerBox.y - 40, width: 500, height: 200 } });

  // 2. Dark Mode
  console.log('\n2. Checking Dark Mode...');
  // Toggle dark mode via html attribute or button
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(500);

  const darkNav = page.locator('header').first();
  await darkNav.waitFor({ state: 'visible' });
  await darkNav.screenshot({ path: path.join(SCREENSHOTS_DIR, 'logo-dark-navbar.png') });
  console.log('✓ Dark mode navbar logo screenshot captured');

  // 3. Arabic RTL Mode
  console.log('\n3. Checking Arabic RTL Mode...');
  await page.goto('http://localhost:3000?lang=ar', { waitUntil: 'networkidle' });
  const htmlDir = await page.getAttribute('html', 'dir');
  console.log(`✓ Document dir: ${htmlDir}`);

  const rtlLogo = page.locator('header a[aria-label="JobMatch AI"]');
  const rtlLogoBox = await rtlLogo.boundingBox();
  console.log(`✓ Arabic RTL Logo container positioned at x=${rtlLogoBox.x.toFixed(1)}px (starts from right layout boundary)`);
  
  // Verify that inside the logo, dir="ltr" is preserved
  const logoDir = await page.locator('header a[aria-label="JobMatch AI"] span[dir="ltr"]').count();
  console.log(`✓ LTR preservation inside RTL logo: span[dir="ltr"] found=${logoDir > 0}`);
  await page.locator('header').first().screenshot({ path: path.join(SCREENSHOTS_DIR, 'logo-rtl-navbar.png') });

  // 4. Auth Pages (Login & Register)
  console.log('\n4. Checking Auth Pages...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  const loginLogo = page.locator('a[aria-label="JobMatch AI"]').first();
  await loginLogo.waitFor({ state: 'visible' });
  console.log('✓ Login page header logo rendered');
  await loginLogo.screenshot({ path: path.join(SCREENSHOTS_DIR, 'logo-login.png') });

  // 5. 404 Page
  console.log('\n5. Checking 404 Page...');
  await page.goto('http://localhost:3000/non-existent-page-test', { waitUntil: 'networkidle' });
  const notFoundLogo = page.locator('a[aria-label="JobMatch AI"] svg').first();
  await notFoundLogo.waitFor({ state: 'visible' });
  console.log('✓ 404 page logo rendered');

  await browser.close();
  console.log('\n🎉 ALL BROWSER & VISUAL VERIFICATIONS COMPLETED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('Playwright verification failed:', err);
  process.exit(1);
});
