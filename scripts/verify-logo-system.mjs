import http from 'http';

const URLS_TO_TEST = [
  '/',
  '/icon.svg',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/apple-icon.png',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-512-maskable.png',
  '/icons/logo.svg',
  '/brand/logo-full-light.svg',
  '/brand/logo-full-dark.svg',
  '/brand/logo-mark.svg',
  '/brand/logo-mono.svg',
  '/brand/logo-stacked.svg',
  '/og-image.png',
];

async function checkUrl(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      resolve({
        path,
        statusCode: res.statusCode,
        contentType: res.headers['content-type'],
        contentLength: res.headers['content-length'],
      });
    }).on('error', (err) => {
      resolve({ path, error: err.message });
    });
  });
}

async function run() {
  console.log('Testing asset HTTP endpoints on http://localhost:3000...\n');
  let failures = 0;
  for (const p of URLS_TO_TEST) {
    const result = await checkUrl(p);
    if (result.statusCode === 200) {
      console.log(`✓ [200] ${result.path.padEnd(32)} (${result.contentType})`);
    } else {
      console.error(`✗ [${result.statusCode || 'ERR'}] ${result.path} - ${result.error || ''}`);
      failures++;
    }
  }

  if (failures === 0) {
    console.log('\n🎉 ALL 17 ASSET ENDPOINTS SERVED WITH HTTP 200 OK!');
  } else {
    console.error(`\n❌ ${failures} endpoint(s) failed.`);
    process.exit(1);
  }
}

run();
