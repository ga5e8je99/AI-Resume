import { Job, JobSearchParams } from './types';

export interface ScoreBreakdown {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasons: string[];
}

/**
 * Standardize text for clean tokenization
 */
function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/**
 * Common technical and professional skills dictionary for keyword extraction from job posts
 */
const COMMON_SKILLS = [
  'react', 'next.js', 'nextjs', 'vue', 'angular', 'svelte', 'typescript', 'javascript',
  'node.js', 'nodejs', 'express', 'nest.js', 'nestjs', 'python', 'django', 'fastapi',
  'flask', 'java', 'spring', 'springboot', 'c#', '.net', 'asp.net', 'golang', 'go',
  'php', 'laravel', 'ruby', 'rails', 'rust', 'c++', 'sql', 'mysql', 'postgresql',
  'postgres', 'mongodb', 'redis', 'elasticsearch', 'graphql', 'rest', 'api', 'docker',
  'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'ci/cd', 'git', 'github',
  'tailwind', 'css', 'html', 'sass', 'redux', 'jest', 'cypress', 'playwright',
  'figma', 'ui/ux', 'agile', 'scrum', 'jira', 'microservices', 'devops', 'linux',
  'machine learning', 'deep learning', 'nlp', 'ai', 'data science', 'pandas',
  'leadership', 'product management', 'system design', 'seo'
];

/**
 * Computes a transparent, deterministic match score (0-100) between candidate profile and a job listing.
 */
export function scoreJob(job: Job, params: JobSearchParams): ScoreBreakdown {
  let score = 0;
  const reasons: string[] = [];
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  const jobTitleTokens = tokenize(job.title);
  const searchTokens = tokenize(params.query);
  const rawCandidateSkills = (params.skills || []).map((s) => s.trim()).filter(Boolean);
  const candidateSkills = rawCandidateSkills.map((s) => s.toLowerCase());

  const fullJobText = `${job.title} ${job.description} ${(job.tags || []).join(' ')}`.toLowerCase();

  // -------------------------------------------------------------
  // 1. Title Similarity (up to 40 points)
  // -------------------------------------------------------------
  let titleScore = 0;
  const normalizedJobTitle = job.title.toLowerCase();
  const normalizedQuery = params.query.toLowerCase().trim();

  if (normalizedJobTitle.includes(normalizedQuery) || normalizedQuery.includes(normalizedJobTitle)) {
    titleScore = 40;
    reasons.push(`Direct title match for "${job.title}"`);
  } else {
    // Check token overlap
    const matchingTitleTokens = searchTokens.filter((token) => jobTitleTokens.includes(token));
    if (searchTokens.length > 0) {
      const ratio = matchingTitleTokens.length / searchTokens.length;
      titleScore = Math.round(ratio * 35);
      if (titleScore > 0) {
        reasons.push(`Title matches key roles: ${matchingTitleTokens.join(', ')}`);
      }
    }
  }

  score += Math.min(40, titleScore);

  // Seniority bonus / alignment (evaluated per candidate seniority)
  if (params.seniority && params.seniority !== 'any') {
    const sLower = params.seniority.toLowerCase();
    const seniorityKeywords: Record<string, string[]> = {
      junior: ['junior', 'entry', 'entry-level', 'intern', 'graduate', 'jr'],
      mid: ['mid', 'mid-level', 'intermediate'],
      senior: ['senior', 'sr', 'staff'],
      lead: ['lead', 'principal', 'head', 'director', 'manager', 'architect', 'vp', 'chief'],
    };

    const userLevelTerms = seniorityKeywords[sLower] || [sLower];
    const matchesUserSeniority = userLevelTerms.some((term) => {
      const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return re.test(normalizedJobTitle) || re.test(fullJobText);
    });

    if (matchesUserSeniority) {
      score += 5;
      reasons.push(`Seniority level (${params.seniority}) aligns with position`);
    } else {
      const otherLevels = Object.entries(seniorityKeywords).filter(([lvl]) => lvl !== sLower);
      const matchesDifferentTitleSeniority = otherLevels.some(([, terms]) =>
        terms.some((term) => {
          const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          return re.test(normalizedJobTitle);
        })
      );
      if (matchesDifferentTitleSeniority) {
        score -= 8;
      }
    }
  }

  // -------------------------------------------------------------
  // 2. Skill Overlap & Missing Skills (up to 40 points)
  // -------------------------------------------------------------
  if (rawCandidateSkills.length > 0) {
    for (let i = 0; i < rawCandidateSkills.length; i++) {
      const originalSkill = rawCandidateSkills[i];
      const s = candidateSkills[i];
      // Look for exact word boundary or occurrence in description/tags
      const regex = new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(fullJobText) || (job.tags || []).some((t) => t.toLowerCase() === s)) {
        matchedSkills.push(originalSkill);
      }
    }

    // Detect skills mentioned in job text that candidate didn't list
    for (const skill of COMMON_SKILLS) {
      if (!candidateSkills.includes(skill)) {
        const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(fullJobText) || (job.tags || []).some((t) => t.toLowerCase() === skill)) {
          missingSkills.push(skill.toUpperCase() === 'AWS' || skill.toUpperCase() === 'SQL' ? skill.toUpperCase() : skill.charAt(0).toUpperCase() + skill.slice(1));
        }
      }
    }

    const matchRatio = matchedSkills.length / Math.min(rawCandidateSkills.length, 8);
    const skillScore = Math.min(40, Math.round(matchRatio * 40));
    score += skillScore;

    if (matchedSkills.length > 0) {
      reasons.push(`Matches ${matchedSkills.length} of your key skills: ${matchedSkills.slice(0, 4).join(', ')}${matchedSkills.length > 4 ? '...' : ''}`);
    }
  } else {
    // If user provided no skills, assign baseline 20 pts from job relevance
    score += 20;
  }

  // -------------------------------------------------------------
  // 3. Location & Remote Fit (up to 20 points)
  // -------------------------------------------------------------
  let locationScore = 0;
  const userWantsRemote = Boolean(params.remote);
  const jobIsRemote = Boolean(job.remote) || fullJobText.includes('remote') || fullJobText.includes('work from home') || fullJobText.includes('anywhere');

  if (userWantsRemote) {
    if (jobIsRemote) {
      locationScore = 20;
      reasons.push('Remote position perfectly matches your remote preference');
    } else {
      locationScore = 5;
    }
  } else {
    // Candidate specified location (e.g., Cairo, Egypt, Dubai, etc.)
    const userLoc = (params.location || '').toLowerCase().trim();
    const jobLoc = (job.location || '').toLowerCase().trim();

    if (userLoc && (jobLoc.includes(userLoc) || userLoc.includes(jobLoc) || fullJobText.includes(userLoc))) {
      locationScore = 20;
      reasons.push(`Direct location match for ${job.location || params.location}`);
    } else if (jobIsRemote) {
      locationScore = 15;
      reasons.push('Remote flexibility offered');
    } else {
      locationScore = 10;
    }
  }

  score += Math.min(20, locationScore);

  // Clamp score between 10 and 99 (or 100 for absolute perfect match)
  const finalScore = Math.min(98, Math.max(25, score));

  return {
    score: finalScore,
    matchedSkills,
    missingSkills: missingSkills.slice(0, 5),
    reasons: reasons.slice(0, 3),
  };
}

/**
 * Deduplicate jobs array by combining matching title + company or identical URL
 */
export function deduplicateJobs(jobs: Job[]): Job[] {
  const seenKeys = new Set<string>();
  const deduped: Job[] = [];

  for (const job of jobs) {
    // Clean normalized key
    const normTitle = (job.title || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 30);
    const normCompany = (job.company || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20);
    const key = `${normTitle}::${normCompany}`;

    const urlKey = job.url ? job.url.trim().toLowerCase() : '';

    if (seenKeys.has(key) || (urlKey && seenKeys.has(urlKey))) {
      continue;
    }

    seenKeys.add(key);
    if (urlKey) seenKeys.add(urlKey);
    deduped.push(job);
  }

  return deduped;
}

/**
 * Scores, ranks, and sorts a list of jobs based on candidate search parameters
 */
export function rankJobs(jobs: Job[], params: JobSearchParams): Job[] {
  const deduped = deduplicateJobs(jobs);

  const scored = deduped.map((job) => {
    const breakdown = scoreJob(job, params);
    return {
      ...job,
      matchScore: breakdown.score,
      matchReasons: breakdown.reasons,
      missingSkills: breakdown.missingSkills,
      matchedSkills: breakdown.matchedSkills,
    };
  });

  // Sort descending by matchScore
  scored.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  return scored;
}
