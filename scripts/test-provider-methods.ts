import { remotiveProvider } from '../lib/jobs/providers/remotive';
import { arbeitnowProvider } from '../lib/jobs/providers/arbeitnow';
import { remoteOKProvider } from '../lib/jobs/providers/remoteok';

async function testProviders() {
  console.log('Testing remotiveProvider...');
  const rem = await remotiveProvider.search({ query: 'React Developer' });
  console.log(`Remotive returned ${rem.jobs.length} jobs (${rem.status}, ${rem.tookMs}ms)`);

  console.log('Testing arbeitnowProvider...');
  const arb = await arbeitnowProvider.search({ query: 'React Developer' });
  console.log(`Arbeitnow returned ${arb.jobs.length} jobs (${arb.status}, ${arb.tookMs}ms)`);

  console.log('Testing remoteOKProvider...');
  const remok = await remoteOKProvider.search({ query: 'React Developer' });
  console.log(`RemoteOK returned ${remok.jobs.length} jobs (${remok.status}, ${remok.tookMs}ms)`);
}

testProviders().catch((e) => console.error(e));
