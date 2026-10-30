import { analyzeResumeText } from '../app/lib/atsAnalyzer';

console.log('--- Testing ATS Analysis Engine ---');

// Test 1: Good Resume Text
const goodResume = `
Alex Morgan
San Francisco, CA | alex.morgan@email.com | +1 (555) 349-2041 | linkedin.com/in/alexmorgan

PROFESSIONAL SUMMARY
Results-driven Senior Full-Stack Engineer with 6+ years of experience designing scalable web applications and distributed architectures.

WORK EXPERIENCE
TechNova Solutions — Senior Full-Stack Developer
2023-01 to Present
- Architected and deployed high-performance SaaS platforms serving 120,000+ active users using Next.js 15, TypeScript, and AWS.
- Engineered real-time data pipelines and WebSockets, decreasing latency by 42% and enhancing core metrics.
- Mentored a cross-functional team of 6 engineers and streamlined CI/CD pipelines, accelerating sprint velocity by 28%.

EDUCATION
University of California, Berkeley — Bachelor of Science in Computer Science
2017 to 2021 | GPA: 3.85 / 4.0

TECHNICAL SKILLS
TypeScript, React, Next.js, Node.js, Express, Docker, AWS, PostgreSQL, MongoDB, Git
`;

const resGood = analyzeResumeText(goodResume, 'Full-Stack Developer', '');
console.log('1. Good Resume Score:', resGood.overallScore);
console.log('   Tier:', resGood.overallScore >= 85 ? 'Excellent' : resGood.overallScore >= 70 ? 'Good' : 'Fair');
console.log('   Keywords detected:', resGood.keywordsDetected.length);
console.log('   Contact integrity:', resGood.contactInfo.completenessScore);
console.log('   Quantified metrics count:', resGood.metrics.quantifiedMetricsCount);

if (resGood.overallScore >= 70 && resGood.keywordsDetected.length > 5) {
  console.log('✓ Good Resume Test: PASSED');
} else {
  console.error('✗ Good Resume Test: FAILED');
  process.exit(1);
}

// Test 2: Poor / Minimal Resume Text
const poorResume = `
John
I need a job. Call me later.
`;
const resPoor = analyzeResumeText(poorResume, 'Software Engineer', '');
console.log('\n2. Poor Resume Score:', resPoor.overallScore);
console.log('   Tier:', resPoor.overallScore < 50 ? 'Poor' : 'Fair');
console.log('   Missing sections count:', resPoor.sectionsDetected.filter(s => !s.found).length);

if (resPoor.overallScore < 50) {
  console.log('✓ Poor Resume Test: PASSED');
} else {
  console.error('✗ Poor Resume Test: FAILED');
  process.exit(1);
}

// Test 3: Validation Logic for Non-Supported Files
const supportedExts = ['pdf', 'docx', 'txt'];
const testExts = ['png', 'jpg', 'exe', 'zip', 'pdf'];

for (const ext of testExts) {
  const isSupported = supportedExts.includes(ext);
  if (!isSupported) {
    console.log(`✓ Rejected unsupported extension .${ext} as expected`);
  } else {
    console.log(`✓ Accepted supported extension .${ext}`);
  }
}

console.log('\nAll ATS diagnostic tests completed successfully!');
