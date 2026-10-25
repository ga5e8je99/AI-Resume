export type CoverLetterTone = 'formal' | 'technical' | 'leadership' | 'enthusiastic';
export type CoverLetterLanguage = 'ar' | 'en' | 'fr' | 'de' | 'es' | 'tr';
export type CoverLetterStatus = 'draft' | 'saved' | 'archived';

export interface CoverLetterRecipient {
  companyName: string;
  hiringManager?: string;
  department?: string;
  jobTitle: string;
  location?: string;
}

export interface CoverLetterSender {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  portfolio?: string;
}

export interface CoverLetterContent {
  subject?: string;
  salutation: string;
  introduction: string;
  bodyParagraphs: string[];
  conclusion: string;
  signOff: string;
  fullText: string;
}

export interface CoverLetterData {
  id?: string;
  userId?: string;
  title: string;
  sender: CoverLetterSender;
  recipient: CoverLetterRecipient;
  jobDescription: string;
  extractedKeywords: string[];
  tone: CoverLetterTone;
  language: CoverLetterLanguage;
  status?: CoverLetterStatus;
  isArchived?: boolean;
  templateId?: string;
  content: CoverLetterContent;
  linkedResumeId?: string;
  provider?: string;
  aiGenerated?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GenerateCoverLetterRequest {
  jobDescription?: string;
  jobUrl?: string;
  jobTitle?: string;
  companyName?: string;
  hiringManager?: string;
  tone: CoverLetterTone;
  language: CoverLetterLanguage;
  sender?: Partial<CoverLetterSender>;
  resumeId?: string;
  customNotes?: string;
  templateId?: string;
}

export interface GenerateCoverLetterResponse {
  success: boolean;
  coverLetter?: CoverLetterData;
  extractedKeywords?: string[];
  provider?: string;
  aiGenerated?: boolean;
  error?: string;
}

export interface CoverLetterPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CoverLetterListResponse {
  success: boolean;
  coverLetters: CoverLetterData[];
  pagination: CoverLetterPagination;
  error?: string;
}
