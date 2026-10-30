import { chromium } from 'playwright';
import lighthouse from 'lighthouse';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const QA_DIR = path.resolve(process.cwd(), 'qa');

if (!fs.existsSync(QA_DIR)) {
  fs.mkdirSync(QA_DIR, { recursive: true });
}

const AUDIT_PAGES = [
  { name: 'Home', path: '/' },
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Builder', path: '/builder' },
  { name: 'Scanner', path: '/review' },
  { name: 'Job Match', path: '/jobs' },
  { name: 'Pricing', path: '/pricing' },
];

async function runLighthouseAudit() {
  console.log('Launching Edge with remote debugging port 9222 for Lighthouse...');

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--remote-debugging-port=9222'],
  });

  const scores = [];

  for (const p of AUDIT_PAGES) {
    const url = `${BASE_URL}${p.path}`;
    console.log(`\nAuditing ${p.name} (${url}) with mobile profile...`);

    try {
      const runnerResult = await lighthouse(url, {
        port: 9222,
        output: 'json',
        logLevel: 'error',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        formFactor: 'mobile',
        throttlingMethod: 'simulate',
        screenEmulation: {
          mobile: true,
          width: 360,
          height: 800,
          deviceScaleFactor: 2.6,
          disabled: false,
        },
      });

      const categories = runnerResult.lhr.categories;
      const perf = Math.round((categories.performance?.score || 0) * 100);
      const a11y = Math.round((categories.accessibility?.score || 0) * 100);
      const bp = Math.round((categories['best-practices']?.score || 0) * 100);
      const seo = Math.round((categories.seo?.score || 0) * 100);

      console.log(`  -> Performance:    ${perf}`);
      console.log(`  -> Accessibility:  ${a11y}`);
      console.log(`  -> Best Practices: ${bp}`);
      console.log(`  -> SEO:            ${seo}`);

      scores.push({
        page: p.name,
        path: p.path,
        performance: perf,
        accessibility: a11y,
        bestPractices: bp,
        seo: seo,
      });
    } catch (err) {
      console.error(`  Error auditing ${p.name}:`, err.message);
      scores.push({
        page: p.name,
        path: p.path,
        error: err.message,
      });
    }
  }

  await browser.close();

  const reportPath = path.join(QA_DIR, 'lighthouse-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(scores, null, 2));

  console.log('\n======================================================');
  console.log('             LIGHTHOUSE AUDIT SUMMARY (MOBILE)');
  console.log('======================================================');
  console.table(scores);
  console.log(`Results written to: ${reportPath}\n`);
}

runLighthouseAudit().catch((err) => {
  console.error('Fatal Lighthouse error:', err);
  process.exit(1);
});
