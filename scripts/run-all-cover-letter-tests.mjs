/**
 * run-all-cover-letter-tests.mjs
 * Master automated test runner for AI Cover Letter Generator (مولد خطابات التقديم الذكي)
 * Orchestrates all unit, integration, API, security, UI, and edge-case test suites.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const SUITES = [
  {
    name: '1. Business Logic & Arabic Normalization',
    script: 'scripts/test-cover-letter-business-logic.mjs',
    useTsx: true,
  },
  {
    name: '2. REST APIs & Core CRUD',
    script: 'scripts/test-cover-letter-apis.mjs',
    useTsx: false,
  },
  {
    name: '3. Security, IDOR, XSS & CSRF Protection',
    script: 'scripts/test-cover-letter-security-permissions.mjs',
    useTsx: true,
  },
  {
    name: '4. Server AI Integration & Fallback Resilience',
    script: 'scripts/test-cover-letter-ai-integration.mjs',
    useTsx: true,
  },
  {
    name: '5. Data Validation, Quality & Binary Detection',
    script: 'scripts/test-cover-letter-data-quality.mjs',
    useTsx: true,
  },
  {
    name: '6. Edge Cases, 6 Dimensions & Boundary Checks',
    script: 'scripts/test-cover-letter-edge-cases.mjs',
    useTsx: true,
  },
  {
    name: '7. UI Flow, Component Contracts & Concurrency',
    script: 'scripts/test-cover-letter-ui-flow.mjs',
    useTsx: true,
  },
  {
    name: '8. Performance, Rate Limiting & Reliability',
    script: 'scripts/test-cover-letter-performance-reliability.mjs',
    useTsx: true,
  },
];

async function runCommand(command, args) {
  return new Promise((resolve) => {
    const proc = spawn(command, args, {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      shell: true,
    });

    proc.on('close', (code) => {
      resolve(code === 0);
    });

    proc.on('error', (err) => {
      console.error(`Execution error: ${err.message}`);
      resolve(false);
    });
  });
}

async function main() {
  console.log('='.repeat(80));
  console.log('>>> JOBMATCH AI - AI COVER LETTER GENERATOR MASTER TEST RUNNER <<<');
  console.log('='.repeat(80));

  const startTime = Date.now();
  const results = [];

  for (const suite of SUITES) {
    console.log(`\n\x1b[36m▶ Running Suite: ${suite.name}\x1b[0m (${suite.script})`);
    console.log('-'.repeat(80));

    const runner = suite.useTsx ? 'npx' : 'node';
    const args = suite.useTsx ? ['tsx', suite.script] : [suite.script];

    const suiteStartTime = Date.now();
    const passed = await runCommand(runner, args);
    const duration = ((Date.now() - suiteStartTime) / 1000).toFixed(2);

    results.push({
      name: suite.name,
      script: suite.script,
      passed,
      duration,
    });
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(80));
  console.log('>>> MASTER TEST EXECUTION SUMMARY <<<');
  console.log('='.repeat(80));

  let allPassed = true;
  for (const res of results) {
    const statusText = res.passed ? '\x1b[32m[PASSED]\x1b[0m' : '\x1b[31m[FAILED]\x1b[0m';
    console.log(` ${statusText} ${res.name.padEnd(50)} (${res.duration}s)`);
    if (!res.passed) allPassed = false;
  }

  console.log('='.repeat(80));
  console.log(`Total Test Suites: ${results.length}`);
  console.log(`Total Duration   : ${totalDuration}s`);
  console.log('='.repeat(80));

  if (!allPassed) {
    console.error('\n\x1b[31m[FAILURE] One or more test suites failed. Review the logs above.\x1b[0m\n');
    process.exit(1);
  } else {
    console.log('\n\x1b[32m[SUCCESS] ALL COVER LETTER TEST SUITES PASSED FLAWLESSLY!\x1b[0m\n');
    process.exit(0);
  }
}

main();
