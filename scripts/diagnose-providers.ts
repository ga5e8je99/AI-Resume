async function testEach() {
  console.log('Testing Remotive...');
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?search=react&limit=5', {
      headers: { 'User-Agent': 'JobMatchAI/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    console.log(`Remotive status: ${res.status}`);
    const data = await res.json();
    console.log(`Remotive jobs: ${data?.jobs?.length}`);
  } catch (err: any) {
    console.log('Remotive error:', err?.message);
  }

  console.log('\nTesting Arbeitnow...');
  try {
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api?search=react', {
      headers: { 'User-Agent': 'JobMatchAI/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    console.log(`Arbeitnow status: ${res.status}`);
    const data = await res.json();
    console.log(`Arbeitnow jobs: ${data?.data?.length}`);
  } catch (err: any) {
    console.log('Arbeitnow error:', err?.message);
  }

  console.log('\nTesting RemoteOK...');
  try {
    const res = await fetch('https://remoteok.com/api?tag=react', {
      headers: { 'User-Agent': 'JobMatchAI/1.0 (contact@jobmatch.ai)' },
      signal: AbortSignal.timeout(8000),
    });
    console.log(`RemoteOK status: ${res.status}`);
    const data = await res.json();
    console.log(`RemoteOK items: ${Array.isArray(data) ? data.length : 0}`);
  } catch (err: any) {
    console.log('RemoteOK error:', err?.message);
  }

  console.log('\nTesting The Muse...');
  try {
    const res = await fetch('https://www.themuse.com/api/public/jobs?page=1', {
      headers: { 'User-Agent': 'JobMatchAI/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    console.log(`The Muse status: ${res.status}`);
    const data = await res.json();
    console.log(`The Muse results: ${data?.results?.length}`);
  } catch (err: any) {
    console.log('The Muse error:', err?.message);
  }
}

testEach();
