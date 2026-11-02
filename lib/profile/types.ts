export const SENIORITY_LEVELS = ['student', 'junior', 'mid', 'senior', 'lead'] as const;
export type SeniorityLevel = (typeof SENIORITY_LEVELS)[number];

export const REMOTE_PREFERENCES = ['onsite', 'hybrid', 'remote', 'any'] as const;
export type RemotePreference = (typeof REMOTE_PREFERENCES)[number];

export const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'internship'] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const MAX_PROFILE_SKILLS = 30;
export const MAX_PROFILE_INDUSTRIES = 15;
export const MAX_PROFILE_LANGUAGES = 15;

export interface ExpectedSalary {
  min: number | null;
  max: number | null;
  currency: string;
  visible: boolean;
}

export interface ProfileLinks {
  linkedin: string;
  github: string;
  portfolio: string;
}

export interface UserProfileData {
  userId: string;
  fullName: string;
  headline: string;
  targetRole: string;
  seniority: SeniorityLevel | null;
  yearsOfExperience: number | null;
  industries: string[];
  skills: string[];
  country: string;
  city: string;
  willingToRelocate: boolean;
  remotePreference: RemotePreference;
  employmentTypes: EmploymentType[];
  expectedSalary: ExpectedSalary;
  languages: string[];
  phone: string;
  phoneVisible: boolean;
  links: ProfileLinks;
  avatar: string;
  profileCompletion: number;
  onboardingCompletedAt: string | null;
  onboardingSkippedAt?: string | null;
}

export interface RedactedUserProfile extends Omit<UserProfileData, 'expectedSalary' | 'phone' | 'phoneVisible'> {
  expectedSalary: ExpectedSalary | null;
  phone: string | null;
  phoneVisible?: boolean;
  isOwner: boolean;
}

