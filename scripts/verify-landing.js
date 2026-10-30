const http = require('http');

http.get('http://localhost:3005/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    const checks = [
      { name: '1. Title Tag', pass: data.includes('JobMatch AI') },
      { name: '2. Meta Description', pass: data.includes('name="description"') || data.includes('ATS-friendly templates') },
      { name: '3. OpenGraph Meta', pass: data.includes('property="og:title"') || data.includes('og-image.png') },
      { name: '4. Twitter Card Meta', pass: data.includes('name="twitter:card"') || data.includes('twitter:card') },
      { name: '5. JSON-LD SoftwareApplication', pass: data.includes('SoftwareApplication') && data.includes('schema.org') },
      { name: '6. Trust Strip Section', pass: data.includes('ATS-friendly') || data.includes('trust_fact') || data.includes('Word &amp; PDF export') || data.includes('Private by design') },
      { name: '7. How It Works Section', pass: data.includes('how-it-works') && data.includes('01') && data.includes('02') && data.includes('03') },
      { name: '8. Feature Showcase Section', pass: data.includes('features') && data.includes('94') && data.includes('JobMatch Studio') },
      { name: '9. Comparison Section (54 -> 91)', pass: data.includes('comparison') && data.includes('54') && data.includes('91') },
      { name: '10. Pricing Teaser Section', pass: data.includes('pricing') && (data.includes('Pay-As-You-Go') || data.includes('Starter')) },
      { name: '11. FAQ Accordion Section', pass: data.includes('faq') && data.includes('<details') },
      { name: '12. Final CTA Band Section', pass: data.includes('bg-brand') && (data.includes('Build your resume free') || data.includes('cta_band')) },
      { name: '13. Footer Section with Links', pass: data.includes('<footer') && data.includes('github.com') && data.includes('/privacy') && data.includes('/terms') },
    ];
    console.table(checks);
    const allPassed = checks.every(c => c.pass);
    console.log('ALL SECTION CHECKS PASSED:', allPassed);
    process.exit(allPassed ? 0 : 1);
  });
}).on('error', err => {
  console.error('Error fetching page:', err.message);
  process.exit(1);
});
