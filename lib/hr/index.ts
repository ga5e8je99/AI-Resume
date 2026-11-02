import { z } from 'zod';
import {
  sanitizeProfileText,
  type EmploymentType,
  type SeniorityLevel,
  EMPLOYMENT_TYPES,
  SENIORITY_LEVELS,
} from '@/lib/profile';

export const ACCOUNT_ROLES = ['candidate', 'employer'] as const;
export type AccountRole = (typeof ACCOUNT_ROLES)[number];

export const ACCOUNT_TYPES = ['candidate', 'employer', 'both'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ORG_MEMBER_ROLES = ['owner', 'recruiter'] as const;
export type OrgMemberRole = (typeof ORG_MEMBER_ROLES)[number];

export const ORG_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] as const;
export type OrganizationSize = (typeof ORG_SIZES)[number];

export const EMPLOYER_JOB_STATUSES = [
  'draft',
  'pending',
  'published',
  'closed',
  'expired',
] as const;
export type EmployerJobStatus = (typeof EMPLOYER_JOB_STATUSES)[number];

export const EMPLOYER_JOB_SENIORITIES = [...SENIORITY_LEVELS, 'any'] as const;
export type EmployerJobSeniority = SeniorityLevel | 'any';

export const APPLICATION_STATUSES = [
  'new',
  'shortlisted',
  'interview',
  'rejected',
  'hired',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const HR_CREDIT_REASONS = [
  'initial_grant',
  'credit_purchase',
  'admin_grant',
  'job_publish',
  'candidate_ai_analysis',
  'candidate_ai_analysis_refund',
  'top10_comparison_report',
  'top10_comparison_refund',
  'refund',
  'adjustment',
] as const;
export type HrCreditReason = (typeof HR_CREDIT_REASONS)[number] | string;

/**
 * Normalizes `accountType` ('candidate' | 'employer' | 'both') and `accountTypes` (['candidate', 'employer'])
 * so that a user can seamlessly be 'candidate', 'employer', or both.
 */
export function resolveAccountRoleState(
  input?: AccountType | AccountRole[] | string | null,
  existingRoles?: AccountRole[] | null
): {
  accountType: AccountType;
  accountTypes: AccountRole[];
} {
  const roleSet = new Set<AccountRole>();

  if (Array.isArray(input)) {
    for (const r of input) {
      if (r === 'candidate' || r === 'employer') roleSet.add(r);
    }
  } else if (input === 'both') {
    roleSet.add('candidate');
    roleSet.add('employer');
  } else if (input === 'employer') {
    roleSet.add('employer');
    if (Array.isArray(existingRoles) && existingRoles.includes('candidate')) {
      // Only keep candidate if caller explicitly passed 'both' or array; if caller sets 'employer' directly, check if existingRoles had candidate
    }
  } else if (input === 'candidate') {
    roleSet.add('candidate');
  } else if (Array.isArray(existingRoles)) {
    for (const r of existingRoles) {
      if (r === 'candidate' || r === 'employer') roleSet.add(r);
    }
  }

  if (roleSet.size === 0) {
    roleSet.add('candidate');
  }

  const accountTypes: AccountRole[] = [];
  if (roleSet.has('candidate')) accountTypes.push('candidate');
  if (roleSet.has('employer')) accountTypes.push('employer');

  const accountType: AccountType =
    accountTypes.length === 2
      ? 'both'
      : accountTypes[0] === 'employer'
      ? 'employer'
      : 'candidate';

  return { accountType, accountTypes };
}

/**
 * Adds a role ('candidate' or 'employer') to a user's existing account roles,
 * upgrading to 'both' when both 'candidate' and 'employer' are present.
 */
export function enableAccountRole(
  existing: { accountType?: string | null; accountTypes?: string[] | null } | null | undefined,
  roleToAdd: AccountRole
): {
  accountType: AccountType;
  accountTypes: AccountRole[];
} {
  const current = new Set<AccountRole>();
  if (existing?.accountType === 'both') {
    current.add('candidate');
    current.add('employer');
  } else if (existing?.accountType === 'employer') {
    current.add('employer');
  } else if (existing?.accountType === 'candidate') {
    current.add('candidate');
  }
  if (Array.isArray(existing?.accountTypes)) {
    for (const r of existing.accountTypes) {
      if (r === 'candidate' || r === 'employer') current.add(r);
    }
  }
  if (current.size === 0) {
    current.add('candidate');
  }
  current.add(roleToAdd);
  return resolveAccountRoleState(Array.from(current));
}

/**
 * Checks if a user record has the specified account role ('candidate' or 'employer').
 * A user with accountType === 'both' or accountTypes containing both roles matches both.
 */
export function hasAccountRole(
  user: { accountType?: string | null; accountTypes?: string[] | null } | null | undefined,
  role: AccountRole
): boolean {
  if (!user) return false;
  if (user.accountType === 'both') return true;
  if (user.accountType === role) return true;
  if (Array.isArray(user.accountTypes) && user.accountTypes.includes(role)) return true;
  if (!user.accountType && (!user.accountTypes || user.accountTypes.length === 0)) {
    return role === 'candidate';
  }
  return false;
}

/**
 * Sanitizes job description Markdown to strip dangerous HTML/XSS vectors
 * (<script>, <iframe>, <object>, <embed>, <style>, inline on* handlers, javascript:/data:/vbscript: URIs)
 * while preserving clean Markdown formatting (headings, lists, bold/italic, code blocks, safe links).
 */
export function sanitizeJobMarkdown(raw: unknown, maxLength = 15000): string {
  if (typeof raw !== 'string') return '';
  let text = raw
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove null bytes and non-printable control chars (except \n and \t)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

  // Strip dangerous block tags and their contents
  text = text.replace(
    /<\s*(script|iframe|object|embed|style|applet|meta|link|base|form|input|button|textarea|select)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
    ''
  );
  // Strip self-closing or unclosed dangerous tags
  text = text.replace(
    /<\s*\/?\s*(script|iframe|object|embed|style|applet|meta|link|base|form|input|button|textarea|select|svg|math)\b[^>]*\/?>/gi,
    ''
  );
  // Strip any remaining raw HTML tags so only pure Markdown remains
  text = text.replace(/<\/?[a-zA-Z][^>]*>/g, '');

  // Strip inline event handlers if any remain in text fragments
  text = text.replace(/\bon[a-z]+\s*=\s*(['"][^'"]*['"]|[^\s>]+)/gi, '');

  // Neutralize dangerous protocols in Markdown links: [label](javascript:...) or [label](data:...) or [label](vbscript:...)
  text = text.replace(
    /(\[[^\]]*\]\()\s*(?:javascript|vbscript|data)\s*:[^)]*(\))/gi,
    '$1#$2'
  );
  text = text.replace(/\b(?:javascript|vbscript|data)\s*:/gi, '');

  return text.trim().slice(0, maxLength);
}

/**
 * Generates a URL-safe slug for an EmployerJob posting.
 */
export function generateEmployerJobSlug(
  title: string,
  orgName?: string,
  uniqueSuffix?: string
): string {
  const rawBase = `${title || 'job'}${orgName ? `-${orgName}` : ''}`
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 75);

  const base = rawBase || 'job-posting';
  const suffix =
    uniqueSuffix ||
    `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return `${base}-${suffix}`;
}

// ============================================================================
// Interfaces
// ============================================================================

export interface OrganizationMember {
  userId: string;
  role: OrgMemberRole;
  addedAt: string;
}

export interface OrganizationRecord {
  id: string;
  name: string;
  slug: string;
  website: string;
  logo: string;
  industry: string;
  size: OrganizationSize | string;
  country: string;
  verified: boolean;
  workEmail?: string;
  verifiedAt?: string | null;
  ownerId: string;
  members: OrganizationMember[];
  hrCredits: number;
  creditBalance: number; // Alias synchronized with hrCredits
  monthlySpendCap?: number | null;
  lowBalanceThreshold?: number;
  lowBalanceAlertEnabled?: boolean;
  lastLowBalanceAlertAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployerJobSalary {
  min: number | null;
  max: number | null;
  currency: string;
  visible: boolean;
}

export interface EmployerJobRecord {
  id: string;
  orgId: string;
  title: string;
  description: string; // Markdown sanitized
  requirements: string[];
  skills: string[];
  location: string;
  remote: boolean;
  employmentType: EmploymentType;
  seniority: EmployerJobSeniority;
  salary: EmployerJobSalary;
  screeningQuestions: string[];
  applyMode: 'internal';
  status: EmployerJobStatus;
  moderationFlags?: string[];
  paidWithCredit?: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  applicantsCount: number;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export const JOB_REPORT_REASONS = [
  'payment_request',
  'fake_job',
  'suspicious_links',
  'offensive',
  'other',
] as const;
export type JobReportReason = (typeof JOB_REPORT_REASONS)[number];

export interface JobReportRecord {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  reporterUserId: string;
  reason: JobReportReason;
  details: string;
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationScreeningAnswer {
  question: string;
  answer: string;
}

export interface ApplicationConsent {
  sharedAt: string;
  version: string;
  shareSalary?: boolean;
  sharePhone?: boolean;
}

export interface ApplicationScoreBreakdown {
  skillsScore: number;
  experienceScore: number;
  roleFitScore: number;
  explanation: string;
}

export interface ApplicationAnalysis {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengths?: string[];
  gaps?: string[];
  interviewQuestions?: string[];
  scoreBreakdown?: ApplicationScoreBreakdown;
  jobDescriptionHash?: string;
  redactedCategories?: string[];
  summary: string;
  model: string;
  createdAt: string;
  creditsUsed: number;
}

export interface ApplicationRecord {
  id: string;
  jobId: string;
  orgId: string;
  candidateId: string;
  resumeSnapshot: Record<string, any>;
  coverLetter: string;
  answers: ApplicationScreeningAnswer[];
  consent: ApplicationConsent;
  status: ApplicationStatus;
  notes?: string; // Included only when viewed by HR (org owner/recruiter) or admin
  manualRank?: number | null; // Optional HR manual rank override
  analysis: ApplicationAnalysis | null;
  createdAt: string;
  updatedAt: string;
}

export interface HrCreditLedgerRecord {
  id: string;
  orgId: string;
  delta: number;
  balanceAfter: number;
  reason: HrCreditReason;
  refId: string;
  actorId?: string | null;
  createdAt: string;
}

/**
 * Redacts private HR fields (`notes`) when an application is viewed by a candidate.
 */
export function formatApplicationForViewer(
  app: ApplicationRecord,
  viewerRole: 'candidate' | 'hr' | 'admin'
): ApplicationRecord {
  if (viewerRole === 'hr' || viewerRole === 'admin') {
    return {
      ...app,
      notes: app.notes ?? '',
    };
  }
  const copy: ApplicationRecord = { ...app };
  delete copy.notes;
  return copy;
}

// ============================================================================
// Zod Validation Schemas
// ============================================================================

export const organizationCreateSchema = z.object({
  name: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(120)
    .transform((v) => sanitizeProfileText(v, 120)),
  website: z
    .string()
    .max(300)
    .optional()
    .default('')
    .transform((v) => sanitizeProfileText(v, 300)),
  logo: z
    .string()
    .max(500)
    .optional()
    .default('')
    .transform((v) => sanitizeProfileText(v, 500)),
  industry: z
    .string()
    .max(80)
    .optional()
    .default('')
    .transform((v) => sanitizeProfileText(v, 80)),
  size: z.enum(ORG_SIZES).optional().default('1-10'),
  country: z
    .string()
    .max(80)
    .optional()
    .default('')
    .transform((v) => sanitizeProfileText(v, 80)),
});

export const employerJobInputSchema = z.object({
  orgId: z.string().min(1),
  title: z
    .string()
    .min(2)
    .max(160)
    .transform((v) => sanitizeProfileText(v, 160)),
  description: z
    .string()
    .min(10)
    .max(15000)
    .transform((v) => sanitizeJobMarkdown(v, 15000)),
  requirements: z
    .array(z.string().transform((v) => sanitizeProfileText(v, 300)))
    .max(30)
    .optional()
    .default([]),
  skills: z
    .array(z.string().transform((v) => sanitizeProfileText(v, 60)))
    .max(30)
    .optional()
    .default([]),
  location: z
    .string()
    .max(120)
    .optional()
    .default('')
    .transform((v) => sanitizeProfileText(v, 120)),
  remote: z.boolean().optional().default(false),
  employmentType: z
    .enum(EMPLOYMENT_TYPES)
    .optional()
    .default('full-time'),
  seniority: z
    .enum(EMPLOYER_JOB_SENIORITIES)
    .optional()
    .default('any'),
  salary: z
    .object({
      min: z.number().min(0).max(10_000_000).nullable().optional().default(null),
      max: z.number().min(0).max(10_000_000).nullable().optional().default(null),
      currency: z
        .string()
        .min(3)
        .max(6)
        .optional()
        .default('USD')
        .transform((v) => v.trim().toUpperCase()),
      visible: z.boolean().optional().default(false),
    })
    .optional()
    .default({ min: null, max: null, currency: 'USD', visible: false }),
  screeningQuestions: z
    .array(z.string().transform((v) => sanitizeProfileText(v, 240)))
    .max(5, 'Maximum 5 screening questions allowed')
    .optional()
    .default([]),
  applyMode: z.literal('internal').optional().default('internal'),
  status: z.enum(EMPLOYER_JOB_STATUSES).optional().default('draft'),
  expiresAt: z.string().datetime().nullable().optional().default(null),
});

export const jobReportCreateSchema = z.object({
  jobId: z.string().min(1).max(160),
  jobTitle: z
    .string()
    .max(180)
    .optional()
    .default('')
    .transform((v) => sanitizeProfileText(v, 180)),
  company: z
    .string()
    .max(140)
    .optional()
    .default('')
    .transform((v) => sanitizeProfileText(v, 140)),
  reason: z.enum(JOB_REPORT_REASONS),
  details: z
    .string()
    .max(1500)
    .optional()
    .default('')
    .transform((v) => sanitizeProfileText(v, 1500)),
});

export const applicationCreateSchema = z.object({
  jobId: z.string().min(1),
  candidateId: z.string().min(1),
  resumeSnapshot: z.record(z.string(), z.any()),
  coverLetter: z
    .string()
    .max(8000)
    .optional()
    .default('')
    .transform((v) => sanitizeJobMarkdown(v, 8000)),
  answers: z
    .array(
      z.object({
        question: z.string().transform((v) => sanitizeProfileText(v, 240)),
        answer: z.string().transform((v) => sanitizeProfileText(v, 2000)),
      })
    )
    .max(10)
    .optional()
    .default([]),
  consent: z.object({
    sharedAt: z.union([z.string(), z.date()]).optional(),
    version: z.string().min(1).max(32).default('1.0'),
    shareSalary: z.boolean().optional().default(false),
    sharePhone: z.boolean().optional().default(false),
  }),
});
