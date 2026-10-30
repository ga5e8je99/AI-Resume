import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const QA_DIR = path.resolve(process.cwd(), 'qa');
if (!fs.existsSync(QA_DIR)) {
  fs.mkdirSync(QA_DIR, { recursive: true });
}

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const PAGES = [
  { name: 'Home', path: '/' },
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Builder', path: '/builder' },
  { name: 'Scanner', path: '/review' },
  { name: 'Job Match', path: '/jobs' },
  { name: 'Pricing', path: '/pricing' },
];

const results = [];

console.log('Running Mobile Lighthouse Audits using Edge binary...\n');

for (const p of PAGES) {
  const url = `${BASE_URL}${p.path}`;
  const outJson = path.join(QA_DIR, `lighthouse-${p.name.toLowerCase().replace(/\s+/g, '-')}.json`);
  console.log(`Auditing ${p.name} (${url})...`);

  const cmd = `npx lighthouse "${url}" --chrome-flags="--headless=new --no-sandbox --disable-gpu" --only-categories=performance,accessibility,best-practices,seo --form-factor=mobile --screenEmulation.mobile --output=json --output-path="${outJson}" --quiet`;

  try {
    execSync(cmd, {
      env: {
        ...process.env,
        CHROME_PATH: EDGE_PATH,
      },
      stdio: 'inherit',
      timeout: 120000,
    });

    if (fs.existsSync(outJson)) {
      const data = JSON.parse(fs.readFileSync(outJson, 'utf8'));
      const cats = data.categories || {};
      const perf = Math.round((cats.performance?.score || 0) * 100);
      const a11y = Math.round((cats.accessibility?.score || 0) * 100);
      const bp = Math.round((cats['best-practices']?.score || 0) * 100);
      const seo = Math.round((cats.seo?.score || 0) * 100);

      console.log(`  -> Performance:    ${perf}`);
      console.log(`  -> Accessibility:  ${a11y}`);
      console.log(`  -> Best Practices: ${bp}`);
      console.log(`  -> SEO:            ${seo}\n`);

      results.push({
        page: p.name,
        path: p.path,
        performance: perf,
        accessibility: a11y,
        bestPractices: bp,
        seo: seo,
      });
    }
  } catch (err) {
    console.error(`  Failed auditing ${p.name}:`, err.message);
    results.push({
      page: p.name,
      path: p.path,
      error: err.message,
    });
  }
}

const summaryPath = path.join(QA_DIR, 'lighthouse-summary.json');
fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));

console.log('======================================================');
console.log('             LIGHTHOUSE AUDIT SUMMARY (MOBILE)');
console.log('======================================================');
console.table(results);
console.log(`Summary written to: ${summaryPath}\n`);
