export interface SeoJobQueryEntry {
  slug: string;
  title: string;
  query: string;
  location: string;
  remote: boolean;
  summary: string;
  topSkills: string[];
  resumeTips: string[];
}

export const POPULAR_SEO_JOB_QUERIES: SeoJobQueryEntry[] = [
  {
    slug: 'remote-developer-jobs',
    title: 'Remote Software Developer Jobs',
    query: 'Software Developer',
    location: '',
    remote: true,
    summary:
      'Explore remote software developer roles from public job boards and official career feeds. Filter by full-time or contract arrangements and optionally compare postings against your resume skills.',
    topSkills: ['TypeScript', 'JavaScript', 'React', 'Node.js', 'SQL', 'Git', 'REST APIs', 'Docker'],
    resumeTips: [
      'Highlight asynchronous collaboration, distributed team workflows, and clear written documentation.',
      'Include measurable engineering outcomes such as latency reductions, test coverage, or deployment frequency.',
      'Use standard section headings (Experience, Skills, Education) so ATS parsers extract your tech stack accurately.',
    ],
  },
  {
    slug: 'frontend-engineer-jobs',
    title: 'Frontend Engineer Jobs',
    query: 'Frontend Engineer',
    location: '',
    remote: false,
    summary:
      'Browse frontend engineering opportunities focusing on modern web interfaces, accessibility, and performance optimization.',
    topSkills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'HTML5', 'CSS3', 'Accessibility (WCAG)', 'Testing'],
    resumeTips: [
      'Mention Core Web Vitals improvements, accessibility compliance, and component library architecture.',
      'List specific frameworks and state management tools directly in both your Skills section and work bullets.',
    ],
  },
  {
    slug: 'backend-developer-jobs',
    title: 'Backend Developer Jobs',
    query: 'Backend Developer',
    location: '',
    remote: false,
    summary:
      'Find backend and API engineering positions covering distributed systems, databases, cloud infrastructure, and microservices.',
    topSkills: ['Node.js', 'Python', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'AWS', 'System Design'],
    resumeTips: [
      'Detail API throughput, database query optimization, and reliability metrics.',
      'Clearly specify relational and NoSQL databases alongside cloud providers you have used in production.',
    ],
  },
  {
    slug: 'full-stack-developer-jobs',
    title: 'Full-Stack Developer Jobs',
    query: 'Full-Stack Developer',
    location: '',
    remote: true,
    summary:
      'Search full-stack engineering roles spanning frontend applications, backend APIs, and cloud deployment pipelines.',
    topSkills: ['React', 'Next.js', 'Node.js', 'TypeScript', 'PostgreSQL', 'GraphQL', 'Docker', 'CI/CD'],
    resumeTips: [
      'Show end-to-end ownership from UI implementation to database schema design and production monitoring.',
      'Tailor your headline and top skill tags to match the primary stack requested in the job description.',
    ],
  },
  {
    slug: 'data-analyst-jobs',
    title: 'Data Analyst & Business Intelligence Jobs',
    query: 'Data Analyst',
    location: '',
    remote: false,
    summary:
      'Discover data analyst and BI roles focused on SQL reporting, dashboarding, product analytics, and decision support.',
    topSkills: ['SQL', 'Python', 'Excel', 'Power BI', 'Tableau', 'Data Visualization', 'Statistics', 'A/B Testing'],
    resumeTips: [
      'Quantify the business decisions, revenue impact, or reporting time saved by your dashboards and models.',
      'List both querying languages (SQL, Python) and BI platforms (Power BI, Tableau, Looker).',
    ],
  },
  {
    slug: 'product-manager-jobs',
    title: 'Product Manager Jobs',
    query: 'Product Manager',
    location: '',
    remote: false,
    summary:
      'Explore product management openings across SaaS, fintech, e-commerce, and consumer technology teams.',
    topSkills: ['Product Strategy', 'Roadmap Planning', 'User Research', 'Agile / Scrum', 'Product Analytics', 'A/B Testing', 'Stakeholder Management'],
    resumeTips: [
      'Emphasize user adoption, retention, conversion uplift, and cross-functional delivery across engineering and design.',
      'Structure bullets around Problem -> Action -> Measurable Product Outcome.',
    ],
  },
  {
    slug: 'ui-ux-designer-jobs',
    title: 'UI/UX & Product Designer Jobs',
    query: 'Product Designer',
    location: '',
    remote: true,
    summary:
      'Browse UI/UX and product design positions covering user research, design systems, prototyping, and interaction design.',
    topSkills: ['Figma', 'Design Systems', 'Prototyping', 'User Research', 'Wireframing', 'Usability Testing', 'Accessibility'],
    resumeTips: [
      'Include a direct link to your portfolio and highlight how your design changes improved user task completion.',
      'Mention collaboration with frontend engineers and adherence to design tokens and accessibility standards.',
    ],
  },
  {
    slug: 'software-engineer-jobs-cairo',
    title: 'Software Engineer Jobs in Cairo & MENA',
    query: 'Software Engineer',
    location: 'Cairo, Egypt',
    remote: false,
    summary:
      'Search software engineering roles in Cairo, Egypt and across the MENA region, combining international API feeds with direct search links to Wuzzuf, Bayt, and LinkedIn.',
    topSkills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'SQL', 'Git'],
    resumeTips: [
      'Include your city, country, and work preference (On-site, Hybrid, or Remote) clearly in your resume header.',
      'Highlight bilingual communication skills (Arabic & English) when applying to regional and multinational employers.',
    ],
  },
];

export function resolveSeoJobQueryBySlug(rawSlug: string): SeoJobQueryEntry {
  const cleanSlug = decodeURIComponent(rawSlug || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const found = POPULAR_SEO_JOB_QUERIES.find((item) => item.slug === cleanSlug);
  if (found) return found;

  // Honest fallback for any custom slug like "devops-engineer-jobs"
  const isRemote = cleanSlug.includes('remote');
  const words = cleanSlug
    .replace(/\b(jobs|job|openings|careers)\b/g, '')
    .split('-')
    .filter(Boolean);
  const roleLabel =
    words.length > 0
      ? words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : 'Professional';

  return {
    slug: cleanSlug || 'remote-developer-jobs',
    title: `${roleLabel} Jobs`,
    query: roleLabel.replace(/^Remote\s+/i, '').trim() || 'Software Engineer',
    location: '',
    remote: isRemote,
    summary: `Search open ${roleLabel} positions across public job boards and official career feeds. Filter by remote status, contract type, and posting date without needing a CV, or optionally enable CV Match %.`,
    topSkills: ['Communication', 'Problem Solving', 'Project Management', 'Teamwork', 'Analysis'],
    resumeTips: [
      'Align your resume headline and skills section with the exact role terminology used in the job posting.',
      'Use clear, single-column or clean two-column ATS-friendly formatting with measurable achievements.',
    ],
  };
}

