import { remotiveProvider } from '../lib/jobs/providers/remotive';
import { arbeitnowProvider } from '../lib/jobs/providers/arbeitnow';
import { remoteOKProvider } from '../lib/jobs/providers/remoteok';

async function testProviders() {
  console.log('Testing remotiveProvider...');
  const rem = await remotiveProvider.search({ query: 'React Developer' });
  console.log(`Remotive returned ${rem.length} jobs`);

  console.log('Testing arbeitnowProvider...');
  const arb = await arbeitnowProvider.search({ query: 'React Developer' });
  console.log(`Arbeitnow returned ${arb.length} jobs`);

  console.log('Testing remoteOKProvider...');
  const remok = await remoteOKProvider.search({ query: 'React Developer' });
  console.log(`RemoteOK returned ${remok.length} jobs`);
}

testProviders().catch((e) => console.error(e));
