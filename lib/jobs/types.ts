export type JobEmploymentTypeFilter =
  | 'any'
  | 'all'
  | 'full-time'
  | 'part-time'
  | 'contract'
  | 'internship';

export type JobDatePostedFilter = 'any' | 'all' | '24h' | '7d' | '30d';

export type JobSortByOption = 'relevance' | 'newest' | 'match' | 'score' | 'date';

export type JobAlertFrequency = 'none' | 'daily' | 'weekly';

export interface JobSearchParams {
  query: string;
  location?: string;
  remote?: boolean;
  page?: number;
  country?: string; // e.g. 'eg', 'sa', 'ae', 'us', 'gb', etc.
  skills?: string[];
  seniority?: 'junior' | 'mid' | 'senior' | 'lead' | 'any';
  employmentType?: JobEmploymentTypeFilter;
  datePosted?: JobDatePostedFilter;
  minSalary?: number;
  maxSalary?: number;
  source?: string;
  sortBy?: JobSortByOption;
  cursor?: string | null;
  limit?: number;
  includeMatch?: boolean;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  description: string;
  url: string;
  source: 'Remotive' | 'Arbeitnow' | 'The Muse' | 'RemoteOK' | 'Adzuna' | 'Jooble' | string;
  sourceBadge?: string;
  postedDate?: string;
  salary?: string;
  jobType?: string; // 'full-time', 'part-time', 'contract', etc.
  tags?: string[];
  // Match scoring added by matcher engine (only when CV/Skill matching is active)
  matchScore?: number; // 0 - 100
  matchReasons?: string[];
  missingSkills?: string[];
  matchedSkills?: string[];
}

export interface SavedJobItem {
  id: string;
  userId: string;
  jobId: string;
  job: Job;
  notes?: string;
  savedAt: string;
}

export interface SavedJobSearch {
  id: string;
  userId: string;
  userEmail: string;
  name: string;
  query: string;
  location?: string;
  country?: string;
  remote?: boolean;
  employmentType?: JobEmploymentTypeFilter;
  datePosted?: JobDatePostedFilter;
  seniority?: 'junior' | 'mid' | 'senior' | 'lead' | 'any';
  minSalary?: number | null;
  maxSalary?: number | null;
  source?: string;
  alertEnabled: boolean;
  alertFrequency: JobAlertFrequency;
  unsubscribeToken: string;
  lastSentAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobClickRecord {
  id: string;
  userId?: string | null;
  jobId: string;
  title: string;
  company: string;
  source: string;
  url: string;
  clickedAt: string;
}

export interface JobProviderAttribution {
  name: string;
  url: string;
  text: string;
  requiresBadge?: boolean;
}

export type ProviderStatusState = 'ok' | 'failed' | 'skipped';

export interface ProviderSearchResult {
  jobs: Job[];
  status: ProviderStatusState;
  error?: string;
  tookMs: number;
}

export interface ProviderStatusEntry {
  provider: string;
  status: ProviderStatusState;
  count: number;
  error?: string;
  tookMs: number;
}

export interface JobProvider {
  name: string;
  attribution: JobProviderAttribution;
  isEnabled(): boolean;
  search(params: JobSearchParams): Promise<ProviderSearchResult>;
}

export interface SmartLinkPlatform {
  id: string;
  name: string;
  region: 'Egypt / MENA' | 'Global' | 'Gulf';
  priority: number;
  iconName: string;
  description: string;
  url: string;
}

export interface CandidateProfileExtract {
  targetTitles: string[]; // top 3 target titles
  seniority: 'junior' | 'mid' | 'senior' | 'lead';
  topSkills: string[];
  languages: string[];
  location: string;
  country: string;
  remotePreference: boolean;
  // Extended fields for onboarding & profile auto-fill
  fullName?: string;
  targetRole?: string;
  yearsOfExperience?: number;
  city?: string;
  countryName?: string;
  phone?: string;
  links?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
}
