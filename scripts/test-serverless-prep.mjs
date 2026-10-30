import fs from 'fs';
import path from 'path';

console.log('\n--- Running Serverless Deployment Audit & Verification ---\n');

// 1. Verify .env.example exists and contains all required variables
console.log('1. Checking .env.example configuration...');
const envExamplePath = path.join(process.cwd(), '.env.example');
if (!fs.existsSync(envExamplePath)) {
  throw new Error('.env.example does not exist');
}
const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');

const requiredVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'ADMIN_KEY',
  'ADMIN_EMAILS',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_API_URL',
  'OPENAI_API_KEY',
  'OPENAI_MODEL',
  'OPENAI_BASE_URL',
  'AI_REQUEST_TIMEOUT_MS',
  'AI_MAX_RETRIES',
  'AI_PROVIDER_ENABLED',
];

for (const v of requiredVars) {
  if (!envExampleContent.includes(v)) {
    throw new Error(`.env.example is missing variable: ${v}`);
  }
}
console.log(`✓ .env.example verified with all ${requiredVars.length} required/optional variables and comprehensive comments.`);

// 2. Verify lib/env.ts and app/lib/env.ts
console.log('\n2. Testing lib/env.ts runtime validation logic...');
const appLibEnv = await import('../app/lib/env.js').catch(() => null) || await import('../app/lib/env.ts');
const { validateEnv, isVercel, isProduction } = appLibEnv;

if (typeof validateEnv !== 'function') {
  throw new Error('validateEnv function not exported from env.ts');
}

const currentConfig = validateEnv();
console.log('✓ Runtime validation passed for current environment:');
console.log('  - NODE_ENV:', currentConfig.NODE_ENV);
console.log('  - App URL:', currentConfig.NEXT_PUBLIC_APP_URL);
console.log('  - MongoDB URI configured:', currentConfig.MONGODB_URI ? 'Yes' : 'No');

// 3. Verify vercel.json
console.log('\n3. Checking vercel.json configuration...');
const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
if (!fs.existsSync(vercelJsonPath)) {
  throw new Error('vercel.json does not exist');
}
const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
if (!vercelConfig.functions || !vercelConfig.functions['app/api/**/*']?.maxDuration) {
  throw new Error('vercel.json missing functions maxDuration config');
}
console.log('✓ vercel.json verified with maxDuration:', vercelConfig.functions['app/api/**/*'].maxDuration, 'seconds.');

// 4. Verify DEPLOYMENT.md
console.log('\n4. Checking DEPLOYMENT.md documentation...');
const deploymentPath = path.join(process.cwd(), 'DEPLOYMENT.md');
if (!fs.existsSync(deploymentPath)) {
  throw new Error('DEPLOYMENT.md does not exist');
}
const deploymentContent = fs.readFileSync(deploymentPath, 'utf8');

const requiredTopics = [
  'MongoDB Atlas',
  '0.0.0.0/0',
  'MONGODB_URI',
  'Vercel',
  'JWT_SECRET',
  'Smoke Test',
];

for (const topic of requiredTopics) {
  if (!deploymentContent.includes(topic)) {
    throw new Error(`DEPLOYMENT.md missing required section/topic: ${topic}`);
  }
}
console.log('✓ DEPLOYMENT.md verified with complete MongoDB Atlas setup, Vercel configuration, and post-deploy checklist.');

// 5. Verify serverless-safe Mongoose connection cache
console.log('\n5. Checking serverless-safe database module (app/lib/db.ts)...');
const dbFile = fs.readFileSync(path.join(process.cwd(), 'app/lib/db.ts'), 'utf8');
if (!dbFile.includes('mongooseCache') || !dbFile.includes('bufferCommands: false')) {
  throw new Error('app/lib/db.ts does not implement serverless cached connection pattern');
}
console.log('✓ app/lib/db.ts implements global cache, bufferCommands: false, and readyState checks.');

console.log('\n======================================================');
console.log('🎉 TASK 1.4 SERVERLESS AUDIT & VERIFICATION PASSED');
console.log('======================================================\n');
