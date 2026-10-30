export interface PersonalInfo {
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
}

export interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  techStack: string;
  link: string;
  description: string[];
}

export interface LanguageItem {
  id: string;
  name: string;
  proficiency: 'Native' | 'Fluent' | 'Proficient' | 'Intermediate' | 'Basic' | string;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  skills: string[];
  certifications: string[];
  languages?: LanguageItem[];
}

export type TemplateId = 
  // ResumeForFree Templates
  | 'compact'      // ResumeForFree: Single column ATS friendly template
  | 'two-column'   // ResumeForFree: A two-column resume layout with sections side by side
  | 'ats-friendly' // Legacy alias for executive-blue
  | 'executive-blue' // Executive Blue Accent Model (spacious layout)
  | 'simple'       // ResumeForFree: Traditional academic CV layout with labeled columns and horizontal rules
  // Popular ATS Templates
  | 'oslo'         // Resume.io ATS: Single-column pure typography, highest parse rate
  | 'amsterdam'    // Resume.io ATS: Modern clean with soft accents & optional photo
  | 'stockholm'    // Resume.io ATS: Compact, high density layout
  | 'london'       // Resume.io ATS: Refined executive style
  | 'classic'      // Standard Ivy League
  | 'modern';      // Best for Engineers

import { DocumentLanguage } from '../lib/documentI18n';
export type { DocumentLanguage };

export interface ThemeConfig {
  accentColor: string;
  fontFamily: string;
  fontSize: 'sm' | 'base' | 'lg';
  documentLanguage?: DocumentLanguage;
}
