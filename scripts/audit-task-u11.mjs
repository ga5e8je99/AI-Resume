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
  { name: 'Landing', path: '/' },
  { name: 'Login', path: '/login' },
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Builder', path: '/builder' },
];

const results = [];

console.log('Running Task U11 Lighthouse Audits on Landing, Login, Dashboard, Builder...\n');

for (const p of PAGES) {
  const url = `${BASE_URL}${p.path}`;
  const outJson = path.join(QA_DIR, `u11-${p.name.toLowerCase()}.json`);
  console.log(`Auditing ${p.name} (${url})...`);

  const cmd = `npx lighthouse "${url}" --chrome-flags="--headless=new --no-sandbox --disable-gpu" --only-categories=accessibility,best-practices,performance,seo --output=json --output-path="${outJson}" --quiet`;

  try {
    execSync(cmd, {
      env: {
        ...process.env,
        CHROME_PATH: EDGE_PATH,
      },
      stdio: 'pipe',
      timeout: 120000,
    });

    if (fs.existsSync(outJson)) {
      const data = JSON.parse(fs.readFileSync(outJson, 'utf8'));
      const cats = data.categories || {};
      const perf = Math.round((cats.performance?.score || 0) * 100);
      const a11y = Math.round((cats.accessibility?.score || 0) * 100);
      const bp = Math.round((cats['best-practices']?.score || 0) * 100);
      const seo = Math.round((cats.seo?.score || 0) * 100);

      // Extract failed accessibility and best practice audit IDs
      const audits = data.audits || {};
      const a11yIssues = Object.keys(audits)
        .filter((k) => audits[k].score !== null && audits[k].score < 1 && audits[k].details)
        .map((k) => ({ id: k, title: audits[k].title, score: audits[k].score }));

      console.log(`  -> Performance:    ${perf}`);
      console.log(`  -> Accessibility:  ${a11y}`);
      console.log(`  -> Best Practices: ${bp}`);
      console.log(`  -> SEO:            ${seo}`);
      if (a11y < 95 || bp < 95) {
        console.log(`  -> Audits needing attention for ${p.name}:`, a11yIssues.map((i) => i.id));
      }
      console.log('');

      results.push({
        page: p.name,
        path: p.path,
        performance: perf,
        accessibility: a11y,
        bestPractices: bp,
        seo: seo,
        issues: a11yIssues,
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

const summaryPath = path.join(QA_DIR, 'u11-audit-summary.json');
fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));

console.log('======================================================');
console.log('             TASK U11 AUDIT SUMMARY');
console.log('======================================================');
console.table(results.map(r => ({
  page: r.page,
  perf: r.performance,
  a11y: r.accessibility,
  bp: r.bestPractices,
  seo: r.seo
})));
console.log(`Summary written to: ${summaryPath}\n`);
