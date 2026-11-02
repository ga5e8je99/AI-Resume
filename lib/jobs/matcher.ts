import {
  Job,
  JobSearchParams,
  JobEmploymentTypeFilter,
  JobDatePostedFilter,
  JobSortByOption,
} from './types';

// Common tech & professional skills dictionary for missing-skill detection
const COMMON_JOB_SKILLS = [
  'React',
  'Next.js',
  'TypeScript',
  'JavaScript',
  'Node.js',
  'Python',
  'Java',
  'C#',
  'Go',
  'Rust',
  'PHP',
  'Laravel',
  'Django',
  'FastAPI',
  'Spring Boot',
  'SQL',
  'PostgreSQL',
  'MongoDB',
  'MySQL',
  'Redis',
  'Graphql',
  'REST API',
  'Docker',
  'Kubernetes',
  'AWS',
  'Azure',
  'GCP',
  'CI/CD',
  'Git',
  'Tailwind',
  'Vue',
  'Angular',
  'HTML',
  'CSS',
  'Figma',
  'Agile',
  'Scrum',
  'Jira',
  'Machine Learning',
  'Data Analysis',
  'Power BI',
  'Tableau',
  'Excel',
];

const CORPORATE_SUFFIXES = new Set([
  'inc',
  'incorporated',
  'llc',
  'ltd',
  'limited',
  'corp',
  'corporation',
  'gmbh',
  'co',
  'company',
  'plc',
  'ag',
  'sa',
  'sarl',
  'bv',
  'pty',
  'group',
  'holdings',
  'holding',
]);

const TITLE_SYNONYMS: Record<string, string> = {
  sr: 'senior',
  snr: 'senior',
  jr: 'junior',
  jnr: 'junior',
  dev: 'developer',
  eng: 'engineer',
  mgr: 'manager',
  fe: 'frontend',
   'front-end': 'frontend',
  be: 'backend',
  'back-end': 'backend',
  fs: 'fullstack',
  'full-stack': 'fullstack',
  qa: 'quality assurance',
  ui: 'ui',
  ux: 'ux',
};

/**
 * Normalizes a job title for fuzzy deduplication.
 * Removes trailing location/remote annotations like "(Remote)" or "- Full-time",
 * expands common abbreviations (Sr. -> senior, Dev -> developer), and normalizes tokens.
 */
export function normalizeJobTitleForDedupe(title: string): string {
  if (!title) return '';
  const cleaned = title
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\b(remote|hybrid|onsite|on-site|full[\s-]?time|part[\s-]?time|contract)\b/g, ' ')
    .replace(/front[\s-]+end/g, 'frontend')
    .replace(/back[\s-]+end/g, 'backend')
    .replace(/full[\s-]+stack/g, 'fullstack')
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, ' ');

  const tokens = cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((tok) => TITLE_SYNONYMS[tok] || tok);

  return tokens.join(' ').trim();
}

/**
 * Normalizes a company name for fuzzy deduplication by stripping legal suffixes and punctuation.
 */
export function normalizeCompanyForDedupe(company: string): string {
  if (!company) return '';
  const cleaned = company
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, ' ');
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const filtered = tokens.filter((t) => !CORPORATE_SUFFIXES.has(t));
  return (filtered.length > 0 ? filtered : tokens).join(' ').trim();
}

/**
 * Normalizes a location string for fuzzy deduplication.
 */
export function normalizeLocationForDedupe(location: string, remote?: boolean): string {
  const raw = (location || '').toLowerCase();
  if (
    remote &&
    (!raw ||
      raw.includes('remote') ||
      raw.includes('anywhere') ||
      raw.includes('worldwide') ||
      raw.includes('global') ||
      raw.includes('flexible'))
  ) {
    return 'remote';
  }
  const cleaned = raw
    .replace(/\b(remote|worldwide|anywhere|global|hybrid|on-site|onsite)\b/g, ' ')
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) {
    return remote ? 'remote' : 'global';
  }
  return cleaned;
}

/**
 * Normalizes a job URL by stripping tracking query parameters.
 */
export function normalizeJobUrlForDedupe(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url.trim());
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'ref',
      'source',
      'src',
      'gh_src',
      'fbclid',
      'gclid',
    ];
    trackingParams.forEach((p) => parsed.searchParams.delete(p));
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    const pathname = parsed.pathname.replace(/\/+$/, '').toLowerCase();
    const search = parsed.searchParams.toString().toLowerCase();
    if (!pathname || pathname === '/') return '';
    return `${host}${pathname}${search ? '?' + search : ''}`;
  } catch {
    return '';
  }
}

/**
 * Computes normalized Levenshtein similarity between two strings in [0, 1].
 */
export function levenshteinSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const lenA = a.length;
  const lenB = b.length;
  const maxLen = Math.max(lenA, lenB);
  if (maxLen === 0) return 1;

  // Fast length difference guard
  if (Math.abs(lenA - lenB) / maxLen > 0.5) {
    return 0;
  }

  const prev = new Array<number>(lenB + 1);
  const curr = new Array<number>(lenB + 1);
  for (let j = 0; j <= lenB; j++) prev[j] = j;

  for (let i = 1; i <= lenA; i++) {
    curr[0] = i;
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= lenB; j++) prev[j] = curr[j];
  }

  return 1 - prev[lenB] / maxLen;
}

/**
 * Computes token Jaccard similarity between two normalized strings in [0, 1].
 */
export function tokenJaccardSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const setA = new Set(a.split(/\s+/).filter(Boolean));
  const setB = new Set(b.split(/\s+/).filter(Boolean));
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  setA.forEach((tok) => {
    if (setB.has(tok)) intersection++;
  });
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function computeStringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;
  return Math.max(levenshteinSimilarity(a, b), tokenJaccardSimilarity(a, b));
}

function areLocationsCompatible(locA: string, locB: string, remoteA?: boolean, remoteB?: boolean): boolean {
  if (locA === locB) return true;
  if (remoteA && remoteB && (locA === 'remote' || locB === 'remote')) return true;
  if (!locA || !locB || locA === 'global' || locB === 'global') return true;
  if (locA.includes(locB) || locB.includes(locA)) return true;
  return computeStringSimilarity(locA, locB) >= 0.75;
}

/**
 * Deduplicates jobs across multiple providers using fuzzy matching on
 * normalized (title + company + location) as well as normalized URLs.
 * Merges missing fields (salary, postedDate, tags, jobType) from duplicates.
 */
export function deduplicateJobs(jobs: Job[]): Job[] {
  const uniqueList: {
    job: Job;
    normTitle: string;
    normCompany: string;
    normLocation: string;
    normUrl: string;
  }[] = [];

  for (const job of jobs) {
    const normTitle = normalizeJobTitleForDedupe(job.title || '');
    const normCompany = normalizeCompanyForDedupe(job.company || '');
    const normLocation = normalizeLocationForDedupe(job.location || '', job.remote);
    const normUrl = normalizeJobUrlForDedupe(job.url || '');

    let duplicateEntry: (typeof uniqueList)[number] | undefined;

    for (const existing of uniqueList) {
      // 1. Exact normalized URL match (when path is specific to a job posting)
      if (
        normUrl &&
        existing.normUrl &&
        normUrl === existing.normUrl &&
        normUrl.split('/').length > 2
      ) {
        duplicateEntry = existing;
        break;
      }

      // 2. Exact canonical key match
      if (
        normTitle === existing.normTitle &&
        normCompany === existing.normCompany &&
        areLocationsCompatible(normLocation, existing.normLocation, job.remote, existing.job.remote)
      ) {
        duplicateEntry = existing;
        break;
      }

      // 3. Fuzzy match on company + title + compatible location
      const companySim = computeStringSimilarity(normCompany, existing.normCompany);
      if (companySim >= 0.85) {
        const titleSim = computeStringSimilarity(normTitle, existing.normTitle);
        if (
          titleSim >= 0.8 &&
          areLocationsCompatible(
            normLocation,
            existing.normLocation,
            job.remote,
            existing.job.remote
          )
        ) {
          duplicateEntry = existing;
          break;
        }
      }
    }

    if (duplicateEntry) {
      // Enrich primary job with any missing fields from the duplicate
      const primary = duplicateEntry.job;
      if (!primary.salary && job.salary) primary.salary = job.salary;
      if (!primary.postedDate && job.postedDate) primary.postedDate = job.postedDate;
      if (!primary.jobType && job.jobType) primary.jobType = job.jobType;
      if (
        (!primary.description || primary.description.length < 80) &&
        job.description &&
        job.description.length > (primary.description?.length || 0)
      ) {
        primary.description = job.description;
      }
      if (Array.isArray(job.tags) && job.tags.length > 0) {
        const mergedTags = new Set([...(primary.tags || []), ...job.tags]);
        primary.tags = Array.from(mergedTags).slice(0, 12);
      }
    } else {
      uniqueList.push({
        job: { ...job },
        normTitle,
        normCompany,
        normLocation,
        normUrl,
      });
    }
  }

  return uniqueList.map((entry) => entry.job);
}

/**
 * Scores a single job against the candidate's search & profile parameters (0 - 100)
 * and generates transparent "Why it matches" reasons + missing skills.
 */
export function scoreJob(
  job: Job,
  params: JobSearchParams
): {
  score: number;
  matchScore: number;
  reasons: string[];
  matchReasons: string[];
  matchedSkills: string[];
  missingSkills: string[];
} {
  let score = 0;
  const reasons: string[] = [];
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  const titleLower = (job.title || '').toLowerCase();
  const descLower = (job.description || '').toLowerCase();
  const tagsLower = (job.tags || []).map((t) => t.toLowerCase()).join(' ');
  const combinedJobText = `${titleLower} ${descLower} ${tagsLower}`;

  // 1. Title Similarity (0 - 35 points)
  const queryLower = (params.query || '').toLowerCase().trim();
  const queryTokens = queryLower.split(/\s+/).filter((t) => t.length > 2);

  if (queryLower && titleLower.includes(queryLower)) {
    score += 35;
    reasons.push(`Exact title match for "${params.query}"`);
  } else if (queryTokens.length > 0) {
    const matchedTokens = queryTokens.filter((t) => titleLower.includes(t));
    if (matchedTokens.length > 0) {
      const ratio = matchedTokens.length / queryTokens.length;
      const pts = Math.round(15 + ratio * 18);
      score += pts;
      reasons.push(`Strong title alignment (${matchedTokens.join(', ')})`);
    } else {
      const descTokens = queryTokens.filter((t) => combinedJobText.includes(t));
      if (descTokens.length > 0) {
        score += 10;
      }
    }
  }

  // 2. Skills Overlap (0 - 40 points)
  const candidateSkills = (params.skills || []).filter((s) => s.trim().length > 0);
  if (candidateSkills.length > 0) {
    for (const skill of candidateSkills) {
      const sLower = skill.toLowerCase().trim();
      if (combinedJobText.includes(sLower)) {
        matchedSkills.push(skill);
      }
    }

    const skillPoints = Math.min(40, matchedSkills.length * 10);
    score += skillPoints;

    if (matchedSkills.length > 0) {
      reasons.push(
        `Matches ${matchedSkills.length} of your skills: ${matchedSkills.slice(0, 4).join(', ')}`
      );
    }
  } else {
    score += 20;
  }

  // Detect Missing Skills mentioned in the job description that candidate doesn't have
  const candidateSkillsLower = new Set(candidateSkills.map((s) => s.toLowerCase().trim()));
  for (const dictSkill of COMMON_JOB_SKILLS) {
    const dLower = dictSkill.toLowerCase();
    const escaped = dLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|\\W)${escaped}(\\W|$)`, 'i');
    if (regex.test(combinedJobText) && !candidateSkillsLower.has(dLower)) {
      missingSkills.push(dictSkill);
    }
  }

  // 3. Location / Remote Fit (0 - 15 points)
  const jobLocLower = (job.location || '').toLowerCase();
  const reqLocLower = (params.location || '').toLowerCase().trim();

  if (params.remote && job.remote) {
    score += 15;
    reasons.push('Remote-friendly work arrangement');
  } else if (reqLocLower && jobLocLower.includes(reqLocLower)) {
    score += 15;
    reasons.push(`Located in your target area (${job.location})`);
  } else if (job.remote) {
    score += 12;
    reasons.push('Offers remote flexibility');
  } else {
    score += 6;
  }

  // 4. Seniority Alignment (0 - 10 points)
  const seniority = params.seniority || 'any';
  if (seniority !== 'any') {
    const seniorityKeywords: Record<string, string[]> = {
      junior: ['junior', 'entry', 'associate', 'grad', 'intern', 'jr'],
      mid: ['mid', 'intermediate', 'ii', 'software engineer', 'developer'],
      senior: ['senior', 'sr', 'principal', 'staff', 'iii'],
      lead: ['lead', 'manager', 'head', 'director', 'vp', 'architect', 'chief'],
    };

    const targetWords = seniorityKeywords[seniority] || [];
    if (targetWords.some((w) => titleLower.includes(w))) {
      score += 10;
      reasons.push(
        `Matches ${seniority.charAt(0).toUpperCase() + seniority.slice(1)} seniority level`
      );
    } else {
      score += 5;
    }
  } else {
    score += 8;
  }

  const finalScore = Math.max(25, Math.min(99, score));

  if (reasons.length === 0) {
    reasons.push('Relevant industry & role category');
  }

  return {
    score: finalScore,
    matchScore: finalScore,
    reasons,
    matchReasons: reasons,
    matchedSkills: matchedSkills.slice(0, 6),
    missingSkills: missingSkills.slice(0, 4),
  };
}

/**
 * Computes a general search relevance score (0 - 100) for a job based strictly on
 * query, location, and remote preference (without requiring a user's CV or skills).
 */
export function computeSearchRelevance(job: Job, params: JobSearchParams): number {
  let score = 0;
  const titleLower = (job.title || '').toLowerCase();
  const descLower = (job.description || '').toLowerCase();
  const tagsLower = (job.tags || []).map((t) => t.toLowerCase()).join(' ');
  const queryLower = (params.query || '').toLowerCase().trim();

  if (queryLower) {
    if (titleLower === queryLower) {
      score += 60;
    } else if (titleLower.includes(queryLower)) {
      score += 48;
    } else {
      const tokens = queryLower.split(/\s+/).filter((t) => t.length > 1);
      if (tokens.length > 0) {
        const titleHits = tokens.filter((t) => titleLower.includes(t)).length;
        const tagHits = tokens.filter((t) => tagsLower.includes(t)).length;
        const descHits = tokens.filter((t) => descLower.includes(t)).length;
        score += (titleHits / tokens.length) * 38;
        score += (tagHits / tokens.length) * 12;
        score += (descHits / tokens.length) * 10;
      }
    }
  }

  const reqLoc = (params.location || '').toLowerCase().trim();
  const jobLoc = (job.location || '').toLowerCase();
  if (reqLoc && jobLoc.includes(reqLoc)) {
    score += 20;
  }
  if (params.remote && job.remote) {
    score += 15;
  }

  // Slight recency boost
  if (job.postedDate) {
    const postedMs = new Date(job.postedDate).getTime();
    if (Number.isFinite(postedMs)) {
      const ageDays = Math.max(0, (Date.now() - postedMs) / (1000 * 3600 * 24));
      if (ageDays <= 3) score += 8;
      else if (ageDays <= 14) score += 4;
    }
  }

  return Math.round(score);
}

/**
 * Parses a numeric salary range `{ min, max }` from a free-text salary string
 * like "$80,000 - $120,000", "$90k - $110k", or "60000". Returns null if unparseable.
 */
export function parseSalaryRange(salaryStr?: string): { min: number; max: number } | null {
  if (!salaryStr || typeof salaryStr !== 'string') return null;
  const matches = Array.from(
    salaryStr.matchAll(/(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)(\s*[kK])?/g)
  );
  if (matches.length === 0) return null;

  const numbers: number[] = [];
  for (const m of matches) {
    const rawNum = parseFloat(m[1].replace(/,/g, ''));
    if (!Number.isFinite(rawNum) || rawNum <= 0) continue;
    const isK = Boolean(m[2]);
    const val = isK ? rawNum * 1000 : rawNum;
    // Ignore tiny numbers like "5 days" unless they are in a reasonable salary range (>= 500)
    if (val >= 500) {
      numbers.push(val);
    }
  }

  if (numbers.length === 0) return null;
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  return { min, max };
}

/**
 * Normalizes a job's employment type string into one of the standard filter buckets.
 */
export function normalizeJobEmploymentType(
  job: Job
): 'full-time' | 'part-time' | 'contract' | 'internship' {
  const raw = `${job.jobType || ''} ${job.title || ''}`.toLowerCase();
  if (raw.includes('intern') || raw.includes('trainee')) return 'internship';
  if (raw.includes('part-time') || raw.includes('part time') || raw.includes('part_time')) {
    return 'part-time';
  }
  if (
    raw.includes('contract') ||
    raw.includes('freelance') ||
    raw.includes('temporary') ||
    raw.includes('consultant')
  ) {
    return 'contract';
  }
  return 'full-time';
}

/**
 * Checks whether a job matches the requested seniority filter.
 */
export function matchesSeniorityFilter(
  job: Job,
  seniority?: 'junior' | 'mid' | 'senior' | 'lead' | 'any'
): boolean {
  if (!seniority || seniority === 'any') return true;
  const text = `${job.title || ''} ${job.jobType || ''} ${(job.tags || []).join(' ')}`.toLowerCase();

  const isJunior = /\b(junior|jr\.?|entry[\s-]?level|intern|graduate|associate|trainee)\b/i.test(text);
  const isSenior = /\b(senior|sr\.?|staff|principal)\b/i.test(text);
  const isLead = /\b(lead|manager|head|director|vp|chief|architect)\b/i.test(text);

  if (seniority === 'junior') {
    return isJunior || (!isSenior && !isLead);
  }
  if (seniority === 'mid') {
    return !isLead && !isJunior;
  }
  if (seniority === 'senior') {
    return isSenior || isLead;
  }
  if (seniority === 'lead') {
    return isLead || isSenior;
  }
  return true;
}

/**
 * Checks whether a job's `postedDate` falls within the requested `datePosted` window.
 */
export function matchesDatePostedFilter(
  job: Job,
  datePosted?: JobDatePostedFilter,
  nowMs: number = Date.now()
): boolean {
  if (!datePosted || datePosted === 'any' || datePosted === 'all') return true;
  if (!job.postedDate) return false;

  const postedTime = new Date(job.postedDate).getTime();
  if (!Number.isFinite(postedTime)) return false;

  const diffHours = (nowMs - postedTime) / (1000 * 3600);
  if (datePosted === '24h') return diffHours <= 36; // 36h grace for date-only ISO strings (YYYY-MM-DD)
  if (datePosted === '7d') return diffHours <= 7 * 24 + 12;
  if (datePosted === '30d') return diffHours <= 30 * 24 + 12;
  return true;
}

export interface FilterAndSortOptions extends JobSearchParams {
  minScore?: number;
}

/**
 * Filters and sorts a list of jobs according to search parameters:
 * - remote, employmentType, datePosted, seniority, minSalary, maxSalary, source, minScore
 * - sortBy: 'relevance' | 'newest' ('date') | 'match' ('score')
 */
export function filterAndSortJobs(jobs: Job[], options: FilterAndSortOptions = { query: '' }): Job[] {
  const {
    remote,
    employmentType,
    datePosted,
    seniority,
    minSalary,
    maxSalary,
    source,
    minScore,
    sortBy = 'relevance',
  } = options;

  const filtered = jobs.filter((job) => {
    if (remote && !job.remote) {
      return false;
    }

    if (employmentType && employmentType !== 'any' && employmentType !== 'all') {
      if (normalizeJobEmploymentType(job) !== employmentType) {
        return false;
      }
    }

    if (datePosted && datePosted !== 'any' && datePosted !== 'all') {
      if (!matchesDatePostedFilter(job, datePosted)) {
        return false;
      }
    }

    if (seniority && seniority !== 'any') {
      if (!matchesSeniorityFilter(job, seniority)) {
        return false;
      }
    }

    if (typeof minSalary === 'number' && minSalary > 0) {
      const parsed = parseSalaryRange(job.salary);
      if (!parsed || parsed.max < minSalary) {
        return false;
      }
    }

    if (typeof maxSalary === 'number' && maxSalary > 0) {
      const parsed = parseSalaryRange(job.salary);
      if (!parsed || parsed.min > maxSalary) {
        return false;
      }
    }

    if (source && source !== 'all' && source !== 'any') {
      if ((job.source || '').toLowerCase() !== source.toLowerCase()) {
        return false;
      }
    }

    if (typeof minScore === 'number' && minScore > 0) {
      if ((job.matchScore ?? 0) < minScore) {
        return false;
      }
    }

    return true;
  });

  const sorted = [...filtered];
  const normalizedSort: 'relevance' | 'newest' | 'match' =
    sortBy === 'date' || sortBy === 'newest'
      ? 'newest'
      : sortBy === 'score' || sortBy === 'match'
        ? 'match'
        : 'relevance';

  if (normalizedSort === 'newest') {
    sorted.sort((a, b) => {
      const dateA = a.postedDate ? new Date(a.postedDate).getTime() : 0;
      const dateB = b.postedDate ? new Date(b.postedDate).getTime() : 0;
      if (dateB !== dateA) return dateB - dateA;
      return computeSearchRelevance(b, options) - computeSearchRelevance(a, options);
    });
  } else if (normalizedSort === 'match') {
    sorted.sort((a, b) => {
      const scoreDiff = (b.matchScore ?? 0) - (a.matchScore ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return computeSearchRelevance(b, options) - computeSearchRelevance(a, options);
    });
  } else {
    sorted.sort((a, b) => {
      const relDiff = computeSearchRelevance(b, options) - computeSearchRelevance(a, options);
      if (relDiff !== 0) return relDiff;
      const dateA = a.postedDate ? new Date(a.postedDate).getTime() : 0;
      const dateB = b.postedDate ? new Date(b.postedDate).getTime() : 0;
      return dateB - dateA;
    });
  }

  return sorted;
}

export function encodeJobCursor(offset: number): string {
  return Buffer.from(JSON.stringify({ o: Math.max(0, Math.floor(offset)) }), 'utf-8').toString(
    'base64url'
  );
}

export function decodeJobCursor(cursor?: string | null): number {
  if (!cursor || typeof cursor !== 'string') return 0;
  const trimmed = cursor.trim();
  if (!trimmed) return 0;
  if (/^\d+$/.test(trimmed)) {
    return Math.max(0, parseInt(trimmed, 10));
  }
  try {
    const decoded = JSON.parse(Buffer.from(trimmed, 'base64url').toString('utf-8'));
    if (decoded && typeof decoded.o === 'number' && Number.isFinite(decoded.o) && decoded.o >= 0) {
      return Math.floor(decoded.o);
    }
  } catch {
    // ignore malformed cursor and start at 0
  }
  return 0;
}

export interface CursorPaginatedJobs {
  items: Job[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
  offset: number;
  limit: number;
}

/**
 * Slices a ranked/filtered job list using cursor-based pagination.
 */
export function paginateJobsWithCursor(
  jobs: Job[],
  cursor?: string | null,
  limit: number = 20
): CursorPaginatedJobs {
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit || 20)));
  const offset = decodeJobCursor(cursor);
  const total = jobs.length;
  const items = jobs.slice(offset, offset + safeLimit);
  const nextOffset = offset + items.length;
  const hasMore = nextOffset < total;
  const nextCursor = hasMore ? encodeJobCursor(nextOffset) : null;

  return {
    items,
    nextCursor,
    hasMore,
    total,
    offset,
    limit: safeLimit,
  };
}

/**
 * Deduplicates, scores, and sorts jobs in descending order of matchScore.
 */
export function rankJobs(jobs: Job[], params: JobSearchParams): Job[] {
  const unique = deduplicateJobs(jobs);

  const scored = unique.map((job) => {
    const { matchScore, matchReasons, matchedSkills, missingSkills } = scoreJob(job, params);
    return {
      ...job,
      matchScore,
      matchReasons,
      matchedSkills,
      missingSkills,
    };
  });

  return scored.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}
