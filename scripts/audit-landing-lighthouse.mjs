import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const QA_DIR = path.resolve(process.cwd(), 'qa');
if (!fs.existsSync(QA_DIR)) {
  fs.mkdirSync(QA_DIR, { recursive: true });
}

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const url = `${BASE_URL}/`;
const outJson = path.join(QA_DIR, 'lighthouse-landing.json');

console.log(`Auditing Landing Page (${url}) with Edge binary...`);

const cmd = `npx lighthouse "${url}" --chrome-flags="--headless=new --no-sandbox --disable-gpu" --only-categories=performance,accessibility,best-practices,seo --output=json --output-path="${outJson}" --quiet`;

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

    console.log('======================================================');
    console.log('           LANDING PAGE LIGHTHOUSE RESULTS');
    console.log('======================================================');
    console.log(`Performance:    ${perf}`);
    console.log(`Accessibility:  ${a11y}`);
    console.log(`Best Practices: ${bp}`);
    console.log(`SEO:            ${seo}`);
    console.log('======================================================');

    if (a11y < 90) {
      console.log('\nAccessibility audits that failed:');
      const audits = data.audits || {};
      for (const [key, audit] of Object.entries(audits)) {
        if (audit.score !== null && audit.score < 1 && cats.accessibility.auditRefs.some(ref => ref.id === key)) {
          console.log(`- [${audit.score}] ${audit.title}: ${audit.description}`);
        }
      }
    }

    process.exit(a11y >= 90 ? 0 : 1);
  }
} catch (err) {
  console.error('Lighthouse audit error:', err.message);
  process.exit(1);
}
