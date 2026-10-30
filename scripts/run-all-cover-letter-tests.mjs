/**
 * run-all-cover-letter-tests.mjs
 * Master automated test runner for AI Cover Letter Generator (مولد خطابات التقديم الذكي)
 * Orchestrates all unit, integration, API, security, UI, and edge-case test suites.
 * Fully non-interactive, self-bootstrapping server if needed, zero prompts.
 */

import { spawn, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

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
  {
    name: '9. Credit Guard & Atomic Deduction',
    script: 'scripts/test-credit-guard.ts',
    useTsx: true,
  },
  {
    name: '10. Payments & Webhooks Integration',
    script: 'scripts/test-payments-e2e.ts',
    useTsx: true,
  },
  {
    name: '11. Transactional Email & Password Reset',
    script: 'scripts/test-transactional-emails.ts',
    useTsx: true,
  },
  {
    name: '12. Monitoring, Analytics & Privacy',
    script: 'scripts/test-monitoring-analytics.ts',
    useTsx: true,
  },
  {
    name: '13. Beta Launch End-to-End Lifecycle',
    script: 'scripts/e2e-beta-lifecycle-test.ts',
    useTsx: true,
  },
];

async function isServerRunning() {
  try {
    const res = await fetch(`${BASE_URL}/api/cover-letter/extract-keywords`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'healthcheck' }),
      signal: AbortSignal.timeout(1000),
    });
    return typeof res.status === 'number' && res.status > 0;
  } catch {
    return false;
  }
}

function killProcessTree(pid) {
  if (!pid) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(-pid, 'SIGKILL');
    }
  } catch {
    // Ignore errors if already dead
  }
}

async function startServerIfNeeded() {
  const alreadyRunning = await isServerRunning();
  if (alreadyRunning) {
    console.log(`\x1b[32m✔ Server is already active on ${BASE_URL}\x1b[0m\n`);
    return null;
  }

  // Ensure production build exists for rapid startup
  const nextDir = path.join(ROOT_DIR, '.next');
  if (!fs.existsSync(nextDir)) {
    console.log('\x1b[33m⚡ .next build not detected. Compiling Next.js bundle before tests...\x1b[0m');
    execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });
  }

  console.log(`\x1b[33m⚡ Starting Next.js test server on ${BASE_URL}...\x1b[0m`);
  const serverProc = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    cwd: ROOT_DIR,
    stdio: 'ignore',
    shell: true,
    detached: process.platform !== 'win32',
  });

  // Poll until responsive (max 30s)
  const start = Date.now();
  while (Date.now() - start < 30000) {
    await new Promise((r) => setTimeout(r, 600));
    if (await isServerRunning()) {
      console.log(`\x1b[32m✔ Test server is ready and responding on ${BASE_URL}!\x1b[0m\n`);
      return serverProc;
    }
  }

  killProcessTree(serverProc.pid);
  throw new Error(`Test server failed to start on ${BASE_URL} within 30 seconds.`);
}

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

  let serverProc = null;
  try {
    serverProc = await startServerIfNeeded();
  } catch (err) {
    console.error(`\x1b[31m[ERROR] ${err.message}\x1b[0m`);
    process.exit(1);
  }

  // Register cleanup handlers
  const cleanup = () => {
    if (serverProc && serverProc.pid) {
      console.log('\n\x1b[33m🛑 Shutting down test server...\x1b[0m');
      killProcessTree(serverProc.pid);
      serverProc = null;
    }
  };

  process.on('SIGINT', () => {
    cleanup();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(143);
  });

  const startTime = Date.now();
  const results = [];

  try {
    for (const suite of SUITES) {
      console.log(`\n\x1b[36m▶ Running Suite: ${suite.name}\x1b[0m (${suite.script})`);
      console.log('-'.repeat(80));

      // Use local tsx non-interactively without prompt
      const runner = suite.useTsx ? 'npx' : 'node';
      const args = suite.useTsx ? ['--no-install', 'tsx', suite.script] : [suite.script];

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
  } finally {
    cleanup();
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
    console.log('\n\x1b[32m[SUCCESS] ALL 8 COVER LETTER TEST SUITES PASSED FLAWLESSLY!\x1b[0m\n');
    process.exit(0);
  }
}

main();
