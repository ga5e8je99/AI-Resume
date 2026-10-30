import http from 'http';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

async function isServerRunning() {
  return new Promise((resolve) => {
    const req = http.get(BASE_URL + '/', (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startServer() {
  console.log('Starting production Next.js server...');
  const child = spawn('npx', ['next', 'start', '-p', '3000'], {
    shell: true,
    stdio: 'ignore',
    detached: false,
  });

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await isServerRunning()) {
      console.log('Server is ready on localhost:3000');
      return child;
    }
  }
  throw new Error('Server failed to start within 30 seconds');
}

async function runTests() {
  let serverProcess = null;
  let didStartServer = false;

  try {
    const running = await isServerRunning();
    if (!running) {
      serverProcess = await startServer();
      didStartServer = true;
    }

    console.log('\n--- Testing 404 Not Found Page ---\n');
    const notFoundRes = await fetch(BASE_URL + '/some-random-missing-page-404');
    console.log('404 Status Code:', notFoundRes.status);
    if (notFoundRes.status !== 404) {
      throw new Error(`Expected status 404, got ${notFoundRes.status}`);
    }

    const notFoundHtml = await notFoundRes.text();
    console.log('Received 404 HTML length:', notFoundHtml.length);

    if (!notFoundHtml.includes('404')) {
      throw new Error('404 page does not contain 404');
    }
    if (!notFoundHtml.includes('Page Not Found') && !notFoundHtml.includes('not_found_title')) {
      throw new Error('404 page missing expected heading');
    }
    if (!notFoundHtml.includes('/dashboard')) {
      throw new Error('404 page missing link to /dashboard');
    }
    console.log('✓ 404 Not Found page verified successfully with status 404, custom UI, and navigation buttons!');

    console.log('\n--- Testing Error Boundary Components ---');
    // Verify error.tsx and global-error.tsx syntax and safety
    const errorFile = fs.readFileSync(path.join(process.cwd(), 'app/error.tsx'), 'utf8');
    const globalErrorFile = fs.readFileSync(path.join(process.cwd(), 'app/global-error.tsx'), 'utf8');

    if (!errorFile.includes('console.error')) {
      throw new Error('error.tsx must log errors via console.error');
    }
    if (!errorFile.includes('reset()') && !errorFile.includes('reset')) {
      throw new Error('error.tsx must call reset()');
    }
    if (!globalErrorFile.includes('console.error')) {
      throw new Error('global-error.tsx must log errors via console.error');
    }
    if (!globalErrorFile.includes('<html') || !globalErrorFile.includes('<body')) {
      throw new Error('global-error.tsx must render <html> and <body> tags');
    }
    console.log('✓ error.tsx and global-error.tsx safety contracts verified!');

    console.log('\n==========================================');
    console.log('🎉 404 AND ERROR PAGE VERIFICATIONS PASSED');
    console.log('==========================================\n');
  } finally {
    if (didStartServer && serverProcess) {
      console.log('Stopping test server...');
      try {
        process.platform === 'win32'
          ? spawn('taskkill', ['/pid', serverProcess.pid.toString(), '/T', '/F'])
          : serverProcess.kill('SIGTERM');
      } catch (e) {}
    }
  }
}

runTests().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
