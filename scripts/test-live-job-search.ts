import { searchAllProviders } from '../lib/jobs/providers';
import { generateSmartLinks } from '../lib/jobs/smart-links';

async function testLiveSearch() {
  console.log('Testing live search across active open API providers...');
  const searchResult = await searchAllProviders({
    query: 'React Developer',
    location: 'Remote',
    remote: true,
    skills: ['React', 'TypeScript', 'JavaScript'],
  });

  console.log(`Sources queried: ${searchResult.sourcesQueried.join(', ')}`);
  console.log(`Total jobs found: ${searchResult.totalFound}`);
  console.log(`Attributions: ${searchResult.attributions.map((a) => a.name).join(', ')}`);

  if (searchResult.jobs.length > 0) {
    const topJob = searchResult.jobs[0];
    console.log('\nTop Matched Job:');
    console.log(`  Title: ${topJob.title}`);
    console.log(`  Company: ${topJob.company}`);
    console.log(`  Source: ${topJob.source}`);
    console.log(`  Score: ${topJob.matchScore}%`);
    console.log(`  Reasons: ${(topJob.matchReasons || []).join(' | ')}`);
    console.log(`  URL: ${topJob.url}`);
  }

  const smartLinks = generateSmartLinks({
    query: 'React Developer',
    location: 'Remote',
    remote: true,
  });

  console.log(`\nGenerated ${smartLinks.length} smart search links.`);
  console.log(`LinkedIn: ${smartLinks[0].url}`);
  console.log(`Wuzzuf: ${smartLinks[3].url}`);
  console.log(`Bayt: ${smartLinks[4].url}`);
  console.log(`Google Jobs: ${smartLinks[7].url}`);
}

testLiveSearch().catch((err) => {
  console.error('Error in live search test:', err);
});
