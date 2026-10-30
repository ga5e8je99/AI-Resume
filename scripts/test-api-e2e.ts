import assert from 'assert';
import DataStore from '../app/lib/datastore';
import { generateSmartLinks } from '../lib/jobs/smart-links';
import { searchAllProviders } from '../lib/jobs/providers';
import { getCachedJobResults, setCachedJobResults } from '../lib/jobs/cache';

async function runE2E() {
  console.log('=== Running Full Task B8 Job Match E2E Verification ===\n');

  // 1. Test Provider Aggregation with Live Open Feeds
  console.log('1. Live Open Provider Query & Aggregation...');
  const { remotiveProvider } = await import('../lib/jobs/providers/remotive');
  const { arbeitnowProvider } = await import('../lib/jobs/providers/arbeitnow');
  const { remoteOKProvider } = await import('../lib/jobs/providers/remoteok');

  const p1 = await remotiveProvider.search({ query: 'React Developer' });
  console.log(`Remotive: ${p1.length} jobs`);
  const p2 = await arbeitnowProvider.search({ query: 'React Developer' });
  console.log(`Arbeitnow: ${p2.length} jobs`);
  const p3 = await remoteOKProvider.search({ query: 'React Developer' });
  console.log(`RemoteOK: ${p3.length} jobs`);

  const res = await searchAllProviders({
    query: 'React Developer',
    location: 'Remote',
    remote: true,
    skills: ['React', 'TypeScript'],
  });

  assert.ok(res.jobs.length > 0, 'Live providers must return jobs');
  assert.ok(res.jobs[0].matchScore !== undefined, 'Jobs must have match score');
  assert.ok(res.jobs[0].url.startsWith('http'), 'Job URL must be valid');
  assert.ok(res.attributions.length > 0, 'Attributions must be present');
  console.log(`  Found ${res.jobs.length} jobs. Top job: "${res.jobs[0].title}" (${res.jobs[0].matchScore}%)`);

  // 2. Test 10 Smart Links
  console.log('\n2. 10 Smart Deep Links...');
  const links = generateSmartLinks({
    query: 'Backend Engineer',
    location: 'Cairo',
    remote: true,
  });
  assert.strictEqual(links.length, 10);
  assert.strictEqual(links[0].id, 'linkedin');
  assert.strictEqual(links[1].id, 'indeed');
  assert.strictEqual(links[2].id, 'glassdoor');
  assert.strictEqual(links[3].id, 'wuzzuf');
  assert.strictEqual(links[4].id, 'bayt');
  assert.strictEqual(links[5].id, 'naukrigulf');
  assert.strictEqual(links[6].id, 'gulftalent');
  assert.strictEqual(links[7].id, 'google_jobs');
  assert.strictEqual(links[8].id, 'ziprecruiter');
  assert.strictEqual(links[9].id, 'monster');
  console.log('  All 10 platform deep links generated in correct priority.');

  // 3. Test Caching
  console.log('\n3. Caching 6h TTL...');
  const testKey = { query: 'Unique Cache Test ' + Date.now() };
  await setCachedJobResults(testKey, { jobs: [{ title: 'Cached Role' }] });
  const cached = await getCachedJobResults(testKey);
  assert.ok(cached !== null);
  assert.strictEqual(cached.jobs[0].title, 'Cached Role');
  console.log('  Cache verified successfully.');

  console.log('\n=== ALL E2E VERIFICATIONS SUCCESSFUL! ===');
}

runE2E().catch((err) => {
  console.error('E2E Verification Error:', err);
  process.exit(1);
});
