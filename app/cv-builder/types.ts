import { ResumeData, TemplateId, ThemeConfig } from '../builder/types';

export interface ExtendedPersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  summary: string;
  photoUrl?: string;
  showPhoto?: boolean;
  // Extended CV Demographics
  nationality?: string;
  dateOfBirth?: string;
  maritalStatus?: string;
  drivingLicense?: string;
  address?: string;
  visaOrMilitaryStatus?: string;
}

export interface LanguageItem {
  id: string;
  name: string;
  proficiency: 'Native' | 'Bilingual' | 'Fluent' | 'Professional' | 'Intermediate' | 'Elementary';
  levelPercentage?: number; // 0-100
}

export interface CourseItem {
  id: string;
  title: string;
  institution: string;
  date: string;
  credentialUrl?: string;
}

export interface ReferenceItem {
  id: string;
  name: string;
  position: string;
  company: string;
  email: string;
  phone: string;
}

export interface VolunteerItem {
  id: string;
  role: string;
  organization: string;
  location?: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string[];
}

export interface PublicationItem {
  id: string;
  title: string;
  publisher: string;
  date: string;
  link?: string;
  description?: string;
}

export interface AwardItem {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description?: string;
}

export interface CvData {
  documentType: 'cv';
  personalInfo: ExtendedPersonalInfo;
  experience: ResumeData['experience'];
  education: ResumeData['education'];
  projects: ResumeData['projects'];
  skills: string[];
  softSkills?: string[];
  tools?: string[];
  certifications: string[];
  languages: LanguageItem[];
  courses: CourseItem[];
  references: ReferenceItem[];
  referencesAvailableUponRequest: boolean;
  volunteering: VolunteerItem[];
  publications: PublicationItem[];
  awards: AwardItem[];
}

export type CvTemplateId =
  | 'europass'
  | 'executive'
  | 'academic'
  | 'modern-two-column'
  | 'classic-ats';

import { DocumentLanguage } from '../lib/documentI18n';
export type { DocumentLanguage };

export interface CvThemeConfig {
  accentColor: string;
  fontFamily: string;
  fontSize: 'sm' | 'base' | 'lg';
  documentLanguage?: DocumentLanguage;
}
