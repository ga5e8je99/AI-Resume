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
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Builder', path: '/builder' },
  { name: 'Scanner', path: '/review' },
  { name: 'Job Match', path: '/jobs' },
  { name: 'Pricing', path: '/pricing' },
];

async function runAudits() {
  console.log('='.repeat(70));
  console.log('   JOBMATCH AI - COMPREHENSIVE LIGHTHOUSE AUDIT (DESKTOP & MOBILE)');
  console.log('='.repeat(70));

  const results = [];

  for (const p of PAGES) {
    const url = `${BASE_URL}${p.path}`;
    const slug = p.name.toLowerCase().replace(/\s+/g, '-');
    
    // 1. Desktop Audit
    console.log(`\n▶ Auditing ${p.name} (Desktop): ${url}...`);
    const deskOut = path.join(QA_DIR, `lh-${slug}-desktop.json`);
    const deskCmd = `npx lighthouse "${url}" --chrome-flags="--headless=new --no-sandbox --disable-gpu" --preset=desktop --only-categories=performance,accessibility,best-practices,seo --output=json --output-path="${deskOut}" --quiet`;

    let deskScores = { perf: 0, a11y: 0, bp: 0, seo: 0 };
    try {
      execSync(deskCmd, {
        env: { ...process.env, CHROME_PATH: EDGE_PATH },
        timeout: 90000,
        stdio: 'ignore',
      });
      if (fs.existsSync(deskOut)) {
        const d = JSON.parse(fs.readFileSync(deskOut, 'utf8')).categories || {};
        deskScores = {
          perf: Math.round((d.performance?.score || 0) * 100),
          a11y: Math.round((d.accessibility?.score || 0) * 100),
          bp: Math.round((d['best-practices']?.score || 0) * 100),
          seo: Math.round((d.seo?.score || 0) * 100),
        };
        console.log(`   Desktop -> Perf: ${deskScores.perf} | A11y: ${deskScores.a11y} | BP: ${deskScores.bp} | SEO: ${deskScores.seo}`);
      }
    } catch (err) {
      console.warn(`   Desktop audit failed: ${err.message}`);
    }

    // 2. Mobile Audit
    console.log(`▶ Auditing ${p.name} (Mobile): ${url}...`);
    const mobOut = path.join(QA_DIR, `lh-${slug}-mobile.json`);
    const mobCmd = `npx lighthouse "${url}" --chrome-flags="--headless=new --no-sandbox --disable-gpu" --form-factor=mobile --screenEmulation.mobile --only-categories=performance,accessibility,best-practices,seo --output=json --output-path="${mobOut}" --quiet`;

    let mobScores = { perf: 0, a11y: 0, bp: 0, seo: 0 };
    try {
      execSync(mobCmd, {
        env: { ...process.env, CHROME_PATH: EDGE_PATH },
        timeout: 90000,
        stdio: 'ignore',
      });
      if (fs.existsSync(mobOut)) {
        const m = JSON.parse(fs.readFileSync(mobOut, 'utf8')).categories || {};
        mobScores = {
          perf: Math.round((m.performance?.score || 0) * 100),
          a11y: Math.round((m.accessibility?.score || 0) * 100),
          bp: Math.round((m['best-practices']?.score || 0) * 100),
          seo: Math.round((m.seo?.score || 0) * 100),
        };
        console.log(`   Mobile  -> Perf: ${mobScores.perf} | A11y: ${mobScores.a11y} | BP: ${mobScores.bp} | SEO: ${mobScores.seo}`);
      }
    } catch (err) {
      console.warn(`   Mobile audit failed: ${err.message}`);
    }

    results.push({
      page: p.name,
      path: p.path,
      desktop: deskScores,
      mobile: mobScores,
    });
  }

  const summaryFile = path.join(QA_DIR, 'comprehensive-lighthouse-results.json');
  fs.writeFileSync(summaryFile, JSON.stringify(results, null, 2));

  console.log('\n' + '='.repeat(80));
  console.log('              SUMMARY OF PRODUCT AUDIT (LIGHTHOUSE)');
  console.log('='.repeat(80));
  console.log('Page'.padEnd(14) + ' | ' + 'Desktop (P / A / BP / SEO)'.padEnd(28) + ' | ' + 'Mobile (P / A / BP / SEO)');
  console.log('-'.repeat(80));
  for (const r of results) {
    const dStr = `${r.desktop.perf} / ${r.desktop.a11y} / ${r.desktop.bp} / ${r.desktop.seo}`;
    const mStr = `${r.mobile.perf} / ${r.mobile.a11y} / ${r.mobile.bp} / ${r.mobile.seo}`;
    console.log(r.page.padEnd(14) + ' | ' + dStr.padEnd(28) + ' | ' + mStr);
  }
  console.log('='.repeat(80));
}

runAudits().catch(console.error);
