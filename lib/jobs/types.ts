export interface JobSearchParams {
  query: string;
  location?: string;
  remote?: boolean;
  page?: number;
  country?: string; // e.g. 'eg', 'sa', 'ae', 'us', 'gb', etc.
  skills?: string[];
  seniority?: 'junior' | 'mid' | 'senior' | 'lead' | 'any';
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
  // Match scoring added by matcher engine
  matchScore?: number; // 0 - 100
  matchReasons?: string[];
  missingSkills?: string[];
  matchedSkills?: string[];
}

export interface JobProviderAttribution {
  name: string;
  url: string;
  text: string;
  requiresBadge?: boolean;
}

export interface JobProvider {
  name: string;
  attribution: JobProviderAttribution;
  isEnabled(): boolean;
  search(params: JobSearchParams): Promise<Job[]>;
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
}
