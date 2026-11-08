import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const OUT_DIR = path.join(ROOT, 'screenshots');
const ARTIFACT_DIR = path.join('C:\\Users\\dell\\.gemini\\antigravity\\brain\\7fb055b1-be88-48c4-a3cb-0553ae03548a', 'screenshots');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('🚀 Starting screenshot capture session via Playwright...');

  // 1. Authenticate with Demo Account to have full data
  let cookieToken = null;
  try {
    const demoRes = await fetch(`${BASE_URL}/api/auth/demo`, { method: 'POST' });
    if (demoRes.ok) {
      const setCookie = demoRes.headers.get('set-cookie');
      if (setCookie) {
        const tokenMatch = setCookie.match(/jobmatch_token=([^;]+)/);
        if (tokenMatch) {
          cookieToken = tokenMatch[1];
          console.log('✓ Demo authentication cookie acquired');
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ Could not pre-authenticate demo user:', err.message);
  }

  // 2. Launch browser
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // High DPI / Retina
    locale: 'ar-EG',
  });

  if (cookieToken) {
    await context.addCookies([
      {
        name: 'jobmatch_token',
        value: cookieToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
  }

  const page = await context.newPage();

  const screenshots = [];

  // Helper function to capture and copy to artifact dir
  async function snap(filename, options = {}) {
    const localPath = path.join(OUT_DIR, filename);
    const artifactPath = path.join(ARTIFACT_DIR, filename);
    await page.screenshot({ path: localPath, ...options });
    fs.copyFileSync(localPath, artifactPath);
    console.log(`📸 Saved: ${filename}`);
    screenshots.push({ filename, localPath, artifactPath });
  }

  try {
  const pagesToCapture = [
    {
      name: '01-Landing-Hero.png',
      url: `${BASE_URL}/`,
      wait: 2500,
      fullPage: false,
    },
    {
      name: '02-Landing-Full.png',
      url: `${BASE_URL}/`,
      wait: 2000,
      fullPage: true,
    },
    {
      name: '03-Resume-Builder-Editor.png',
      url: `${BASE_URL}/builder`,
      wait: 4000,
      fullPage: false,
    },
    {
      name: '04-Resume-Builder-Appearance.png',
      url: `${BASE_URL}/builder`,
      wait: 3000,
      fullPage: false,
      action: async (p) => {
        const btn = p.locator('button:has-text("إعدادات شكل الـ CV")');
        if (await btn.count() > 0) {
          await btn.first().click();
          await p.waitForTimeout(1500);
        }
      },
    },
    {
      name: '05-Cover-Letter-Generator.png',
      url: `${BASE_URL}/cover-letter`,
      wait: 3500,
      fullPage: false,
    },
    {
      name: '06-ATS-Scanner-Review.png',
      url: `${BASE_URL}/review?sample=compact`,
      wait: 4000,
      fullPage: false,
    },
    {
      name: '07-Job-Match-Board.png',
      url: `${BASE_URL}/jobs`,
      wait: 3500,
      fullPage: false,
    },
    {
      name: '08-User-Dashboard.png',
      url: `${BASE_URL}/dashboard`,
      wait: 3500,
      fullPage: false,
    },
    {
      name: '09-Pricing-Plans.png',
      url: `${BASE_URL}/pricing`,
      wait: 2500,
      fullPage: false,
    },
  ];

  for (const item of pagesToCapture) {
    try {
      console.log(`\n⏳ Navigating to ${item.name} (${item.url})...`);
      await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await page.waitForTimeout(item.wait);
      if (item.action) {
        await item.action(page);
      }
      await snap(item.name, { fullPage: item.fullPage });
    } catch (e) {
      console.error(`❌ Failed capturing ${item.name}:`, e.message);
    }
  }

  } catch (err) {
    console.error('❌ Error during capture:', err);
  } finally {
    await browser.close();
  }

  console.log(`\n🎉 Completed! ${screenshots.length} screenshots captured and saved to:`);
  console.log(`📁 Local: ${OUT_DIR}`);
  console.log(`📁 Artifacts: ${ARTIFACT_DIR}`);
}

main().catch(console.error);

