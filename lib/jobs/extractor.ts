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
  const primaryTitle = (personal.jobTitle || experiences[0]?.title || experiences[0]?.position || 'Software Engineer').trim();

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
  } else if (titleLower.includes('graphic') || titleLower.includes('visual') || titleLower.includes('brand')) {
    if (!targetTitles.includes('Graphic Designer')) targetTitles.push('Graphic Designer');
    if (!targetTitles.includes('Visual Designer')) targetTitles.push('Visual Designer');
    if (!targetTitles.includes('Brand Identity Designer')) targetTitles.push('Brand Identity Designer');
  } else {
    targetTitles.push(`Senior ${primaryTitle}`);
    targetTitles.push(`${primaryTitle} Specialist`);
  }

  while (targetTitles.length < 3) {
    targetTitles.push(`${primaryTitle} Specialist`);
  }

  // 3. Determine seniority & years of experience
  let seniority: 'junior' | 'mid' | 'senior' | 'lead' = 'mid';
  const totalExpYears =
    typeof resumeData?.yearsOfExperience === 'number'
      ? resumeData.yearsOfExperience
      : Math.max(1, experiences.length * 2);
  const textCorpus = `${primaryTitle} ${experiences.map((e: any) => `${e.title || e.position || ''} ${e.description || ''}`).join(' ')}`.toLowerCase();

  if (textCorpus.includes('lead') || textCorpus.includes('principal') || textCorpus.includes('director') || textCorpus.includes('head of')) {
    seniority = 'lead';
  } else if (textCorpus.includes('senior') || textCorpus.includes('sr.') || totalExpYears >= 5) {
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
  let countryName = 'Egypt';
  let city = 'Cairo';
  const locLower = location.toLowerCase();

  if (locLower.includes('egypt') || locLower.includes('cairo') || locLower.includes('alexandria') || locLower.includes('giza')) {
    country = 'eg';
    countryName = 'Egypt';
    city = locLower.includes('alexandria') ? 'Alexandria' : locLower.includes('giza') ? 'Giza' : 'Cairo';
  } else if (locLower.includes('saudi') || locLower.includes('riyadh') || locLower.includes('jeddah')) {
    country = 'sa';
    countryName = 'Saudi Arabia';
    city = locLower.includes('jeddah') ? 'Jeddah' : 'Riyadh';
  } else if (locLower.includes('uae') || locLower.includes('dubai') || locLower.includes('abu dhabi')) {
    country = 'ae';
    countryName = 'UAE';
    city = locLower.includes('abu dhabi') ? 'Abu Dhabi' : 'Dubai';
  } else if (locLower.includes('united states') || locLower.includes('usa') || locLower.includes('ca') || locLower.includes('ny')) {
    country = 'us';
    countryName = 'United States';
    city = location.split(',')[0]?.trim() || 'New York';
  } else if (locLower.includes('germany') || locLower.includes('berlin')) {
    country = 'de';
    countryName = 'Germany';
    city = 'Berlin';
  } else if (locLower.includes('uk') || locLower.includes('london') || locLower.includes('united kingdom')) {
    country = 'gb';
    countryName = 'United Kingdom';
    city = 'London';
  } else if (location.includes(',')) {
    const parts = location.split(',').map((p: string) => p.trim());
    city = parts[0] || city;
    countryName = parts[parts.length - 1] || countryName;
  }

  const fullName = typeof personal.fullName === 'string' ? personal.fullName.trim() : '';
  const phone = typeof personal.phone === 'string' ? personal.phone.trim() : '';

  return {
    targetTitles: targetTitles.slice(0, 3),
    seniority,
    topSkills: flatSkills.slice(0, 20),
    languages: languages.filter(Boolean),
    location,
    country,
    remotePreference: true,
    fullName,
    targetRole: primaryTitle,
    yearsOfExperience: totalExpYears,
    city,
    countryName,
    phone,
    links: {
      linkedin: personal.linkedin || '',
      github: personal.github || '',
      portfolio: personal.website || personal.portfolio || '',
    },
  };
}

/**
 * Extracts profile parameters from raw text (e.g. uploaded PDF or pasted resume)
 */
export function extractProfileFromText(text: string): CandidateProfileExtract {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // Extract candidate full name heuristic from the first 3 lines
  let fullName = '';
  for (const line of lines.slice(0, 4)) {
    if (
      line.length >= 3 &&
      line.length <= 50 &&
      !/@|http|www\.|\d{4}|curriculum|resume|سيرة/i.test(line) &&
      line.split(/\s+/).length >= 2 &&
      line.split(/\s+/).length <= 5
    ) {
      fullName = line;
      break;
    }
  }

  // Look for title keywords in the document
  let title = 'Software Engineer';
  const titleMatches = [
    'senior graphic designer', 'graphic designer', 'lead visual designer', 'visual designer',
    'brand designer', 'brand identity designer', 'art director', 'creative director',
    'ui/ux designer', 'product designer', 'motion designer', 'package designer',
    'frontend engineer', 'frontend developer', 'backend engineer', 'backend developer',
    'full stack developer', 'full stack engineer', 'fullstack engineer', 'software engineer',
    'product manager', 'project manager', 'data engineer', 'data scientist', 'data analyst',
    'devops engineer', 'mobile developer', 'ios developer', 'android developer',
    'financial accountant', 'accountant', 'financial analyst', 'digital marketing specialist',
    'hr specialist', 'civil engineer', 'mechanical engineer', 'electrical engineer',
  ];

  for (const tm of titleMatches) {
    if (new RegExp(`\\b${tm}\\b`, 'i').test(text)) {
      title = tm
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      break;
    }
  }

  // Extract common skills found in text
  const skillsDictionary = [
    'Photoshop', 'Illustrator', 'InDesign', 'After Effects', 'Premiere Pro',
    'Figma', 'Sketch', 'Canva', 'Typography', 'Brand Identity', 'Color Theory',
    'Logo Design', 'Motion Graphics', 'Packaging Design', 'Prepress',
    'React', 'Next.js', 'TypeScript', 'JavaScript', 'Node.js', 'Express',
    'Python', 'Django', 'FastAPI', 'Java', 'Spring', 'Go', 'PHP', 'Laravel',
    'SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS',
    'Tailwind CSS', 'GraphQL', 'Git', 'Agile', 'Scrum', 'Excel', 'Power BI',
    'Tableau', 'SEO', 'AutoCAD', 'Revit',
  ];

  const foundSkills = skillsDictionary.filter((s) => {
    const rx = new RegExp(`\\b${s.replace('.', '\\.')}\\b`, 'i');
    return rx.test(text);
  });

  // Extract spoken languages
  const languageCatalog = ['Arabic', 'English', 'French', 'German', 'Spanish', 'Turkish'];
  const foundLanguages = languageCatalog.filter((lang) =>
    new RegExp(`\\b${lang}\\b`, 'i').test(text)
  );
  if (/العربية/.test(text) && !foundLanguages.includes('Arabic')) {
    foundLanguages.push('Arabic');
  }
  if (/الإنجليزية/.test(text) && !foundLanguages.includes('English')) {
    foundLanguages.push('English');
  }

  // Years of experience heuristic
  let yearsOfExperience = 2;
  const yearsMatch = text.match(/(\d{1,2})\+?\s*(?:years|yrs|سنوات|عام)/i);
  if (yearsMatch && yearsMatch[1]) {
    const parsedYrs = parseInt(yearsMatch[1], 10);
    if (parsedYrs >= 0 && parsedYrs <= 50) {
      yearsOfExperience = parsedYrs;
    }
  }

  // Phone & Links heuristics
  const phoneMatch = text.match(/(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{4}/);
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);

  // Location heuristics
  let location = 'Cairo, Egypt';
  if (/dubai|abu dhabi|uae/i.test(text)) location = 'Dubai, UAE';
  else if (/riyadh|saudi|ksa/i.test(text)) location = 'Riyadh, Saudi Arabia';
  else if (/london|uk/i.test(text)) location = 'London, UK';
  else if (/berlin|germany/i.test(text)) location = 'Berlin, Germany';
  else if (/remote/i.test(text)) location = 'Cairo, Egypt';

  return extractProfileFromResumeData({
    personalInfo: {
      fullName,
      jobTitle: title,
      location,
      phone: phoneMatch ? phoneMatch[0].trim() : '',
      linkedin: linkedinMatch ? linkedinMatch[0].trim() : '',
      github: githubMatch ? githubMatch[0].trim() : '',
    },
    skills: foundSkills.length > 0 ? foundSkills : ['JavaScript', 'React', 'Git'],
    languages: foundLanguages.length > 0 ? foundLanguages : ['English', 'Arabic'],
    yearsOfExperience,
    experience: [{ title }],
  });
}

export const extractProfileFromResume = extractProfileFromResumeData;
