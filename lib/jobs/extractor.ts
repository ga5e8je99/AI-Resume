import { CandidateProfileExtract } from './types';

/**
 * Extracts candidate profile targeting parameters from structured resume data or raw text.
 */
export function extractProfileFromResumeData(resumeData: any): CandidateProfileExtract {
  const personal = resumeData?.personalInfo || {};
  const experiences = Array.isArray(resumeData?.experience) ? resumeData.experience : [];
  const skills = Array.isArray(resumeData?.skills) ? resumeData.skills : [];
  const languages = Array.isArray(resumeData?.languages)
    ? resumeData.languages.map((l: any) => (typeof l === 'string' ? l : l.name || l.language || ''))
    : [];

  // 1. Primary job title
  const primaryTitle = (personal.jobTitle || (experiences[0]?.title) || 'Software Engineer').trim();

  // 2. Generate top 3 target titles based on role keywords
  const titleLower = primaryTitle.toLowerCase();
  const targetTitles: string[] = [primaryTitle];

  if (titleLower.includes('frontend') || titleLower.includes('front-end')) {
    if (!targetTitles.includes('React Developer')) targetTitles.push('React Developer');
    if (!targetTitles.includes('Full-Stack Engineer')) targetTitles.push('Full-Stack Engineer');
  } else if (titleLower.includes('backend') || titleLower.includes('back-end')) {
    if (!targetTitles.includes('Node.js Developer')) targetTitles.push('Node.js Developer');
    if (!targetTitles.includes('Full-Stack Engineer')) targetTitles.push('Full-Stack Engineer');
  } else if (titleLower.includes('full') || titleLower.includes('stack')) {
    if (!targetTitles.includes('Frontend Engineer')) targetTitles.push('Frontend Engineer');
    if (!targetTitles.includes('Backend Engineer')) targetTitles.push('Backend Engineer');
  } else if (titleLower.includes('product') || titleLower.includes('manager')) {
    if (!targetTitles.includes('Product Lead')) targetTitles.push('Product Lead');
    if (!targetTitles.includes('Technical Product Manager')) targetTitles.push('Technical Product Manager');
  } else if (titleLower.includes('data') || titleLower.includes('machine learning')) {
    if (!targetTitles.includes('Data Scientist')) targetTitles.push('Data Scientist');
    if (!targetTitles.includes('Machine Learning Engineer')) targetTitles.push('Machine Learning Engineer');
  } else {
    targetTitles.push(`Senior ${primaryTitle}`);
    targetTitles.push(`${primaryTitle} Specialist`);
  }

  // Ensure 3 titles
  while (targetTitles.length < 3) {
    targetTitles.push(`${primaryTitle} Specialist`);
  }

  // 3. Determine seniority
  let seniority: 'junior' | 'mid' | 'senior' | 'lead' = 'mid';
  const totalExpYears = experiences.length; // rough proxy or from text
  const textCorpus = `${primaryTitle} ${experiences.map((e: any) => `${e.title} ${e.description || ''}`).join(' ')}`.toLowerCase();

  if (textCorpus.includes('lead') || textCorpus.includes('principal') || textCorpus.includes('director') || textCorpus.includes('head of')) {
    seniority = 'lead';
  } else if (textCorpus.includes('senior') || textCorpus.includes('sr.') || totalExpYears >= 4) {
    seniority = 'senior';
  } else if (textCorpus.includes('junior') || textCorpus.includes('entry') || textCorpus.includes('intern') || totalExpYears <= 1) {
    seniority = 'junior';
  }

  // 4. Clean skills list
  const flatSkills = skills
    .map((s: any) => (typeof s === 'string' ? s : s.name || ''))
    .filter((s: string) => s.trim().length > 1);

  // 5. Location and Country
  const location = (personal.location || personal.city || 'Cairo, Egypt').trim();
  let country = 'eg';
  const locLower = location.toLowerCase();

  if (locLower.includes('egypt') || locLower.includes('cairo') || locLower.includes('alexandria') || locLower.includes('giza')) {
    country = 'eg';
  } else if (locLower.includes('saudi') || locLower.includes('riyadh') || locLower.includes('jeddah')) {
    country = 'sa';
  } else if (locLower.includes('uae') || locLower.includes('dubai') || locLower.includes('abu dhabi')) {
    country = 'ae';
  } else if (locLower.includes('united states') || locLower.includes('usa') || locLower.includes('ca') || locLower.includes('ny')) {
    country = 'us';
  } else if (locLower.includes('germany') || locLower.includes('berlin')) {
    country = 'de';
  } else if (locLower.includes('uk') || locLower.includes('london') || locLower.includes('united kingdom')) {
    country = 'gb';
  }

  return {
    targetTitles: targetTitles.slice(0, 3),
    seniority,
    topSkills: flatSkills.slice(0, 12),
    languages: languages.filter(Boolean),
    location,
    country,
    remotePreference: true,
  };
}

/**
 * Extracts profile parameters from raw text (e.g. uploaded PDF or pasted resume)
 */
export function extractProfileFromText(text: string): CandidateProfileExtract {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const firstFewLines = lines.slice(0, 10).join(' ');

  // Look for title keywords in the first section
  let title = 'Software Engineer';
  const titleMatches = [
    'frontend engineer', 'frontend developer', 'backend engineer', 'backend developer',
    'full stack developer', 'full stack engineer', 'fullstack engineer', 'software engineer',
    'product manager', 'project manager', 'data engineer', 'data scientist',
    'devops engineer', 'ui/ux designer', 'mobile developer', 'ios developer', 'android developer'
  ];

  for (const tm of titleMatches) {
    if (new RegExp(`\\b${tm}\\b`, 'i').test(text)) {
      title = tm.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      break;
    }
  }

  // Extract common skills found in text
  const skillsDictionary = [
    'React', 'Next.js', 'TypeScript', 'JavaScript', 'Node.js', 'Express',
    'Python', 'Django', 'FastAPI', 'Java', 'Spring', 'Go', 'PHP', 'Laravel',
    'SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS',
    'Tailwind CSS', 'GraphQL', 'Git', 'Agile', 'Figma'
  ];

  const foundSkills = skillsDictionary.filter((s) => {
    const rx = new RegExp(`\\b${s.replace('.', '\\.')}\\b`, 'i');
    return rx.test(text);
  });

  // Location heuristics
  let location = 'Cairo, Egypt';
  if (/dubai|abu dhabi|uae/i.test(text)) location = 'Dubai, UAE';
  else if (/riyadh|saudi|ksa/i.test(text)) location = 'Riyadh, Saudi Arabia';
  else if (/london|uk/i.test(text)) location = 'London, UK';
  else if (/remote/i.test(text)) location = 'Remote';

  return extractProfileFromResumeData({
    personalInfo: {
      jobTitle: title,
      location,
    },
    skills: foundSkills.length > 0 ? foundSkills : ['JavaScript', 'React', 'Git'],
    experience: [{ title }],
  });
}
