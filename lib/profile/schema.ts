import { z } from 'zod';
import {
  EMPLOYMENT_TYPES,
  MAX_PROFILE_INDUSTRIES,
  MAX_PROFILE_LANGUAGES,
  MAX_PROFILE_SKILLS,
  REMOTE_PREFERENCES,
  SENIORITY_LEVELS,
  type EmploymentType,
  type ExpectedSalary,
  type ProfileLinks,
  type RemotePreference,
  type SeniorityLevel,
} from './types';

/**
 * Strips HTML tags, script expressions, and control characters from plain text fields.
 */
export function sanitizeProfileText(input: unknown, maxLength = 160): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitizes a phone number string (keeps digits, +, -, spaces, parentheses).
 */
export function sanitizePhoneText(input: unknown): string {
  if (typeof input !== 'string') return '';
  const stripped = sanitizeProfileText(input, 40);
  return stripped.replace(/[^0-9+\-() .\s]/g, '').trim().slice(0, 32);
}

/**
 * Sanitizes and validates a profile external link (LinkedIn, GitHub, Portfolio).
 * Returns empty string if empty, or a normalized https/http URL.
 * Returns null if the URL is invalid or uses an unsafe protocol.
 */
export function sanitizeProfileUrl(input: unknown): string | null {
  if (input === undefined || input === null) return '';
  if (typeof input !== 'string') return null;
  const raw = input.trim();
  if (!raw) return '';

  if (/^(javascript|vbscript|data|file):/i.test(raw)) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return null;
    }
    return parsed.toString().slice(0, 300);
  } catch {
    return null;
  }
}

/**
 * Sanitizes an avatar URL or safe data:image URI.
 */
export function sanitizeAvatarUrl(input: unknown): string | null {
  if (input === undefined || input === null) return '';
  if (typeof input !== 'string') return null;
  const raw = input.trim();
  if (!raw) return '';

  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,[a-zA-Z0-9+/=]+$/i.test(raw)) {
    return raw.length <= 300_000 ? raw : null;
  }

  if (raw.startsWith('/') && !raw.startsWith('//') && !/[<>"'\s]/.test(raw)) {
    return raw.slice(0, 300);
  }

  return sanitizeProfileUrl(raw);
}

function dedupeStrings(items: string[], maxItems: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    if (!item) continue;
    const key = item.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
      if (result.length >= maxItems) break;
    }
  }
  return result;
}

const safeLinkSchema = z
  .string()
  .max(300)
  .transform((val, ctx) => {
    const cleaned = sanitizeProfileUrl(val);
    if (cleaned === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid URL format. Only http:// or https:// links are allowed.',
      });
      return z.NEVER;
    }
    return cleaned;
  });

export const expectedSalarySchema = z
  .object({
    min: z
      .number()
      .min(0, 'Minimum salary cannot be negative')
      .max(10_000_000, 'Minimum salary is too large')
      .nullable()
      .optional(),
    max: z
      .number()
      .min(0, 'Maximum salary cannot be negative')
      .max(10_000_000, 'Maximum salary is too large')
      .nullable()
      .optional(),
    currency: z
      .string()
      .max(10)
      .transform((v) => sanitizeProfileText(v, 10).toUpperCase() || 'USD')
      .optional(),
    visible: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (
        typeof data.min === 'number' &&
        typeof data.max === 'number' &&
        data.max < data.min
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'expectedSalary.max must be greater than or equal to expectedSalary.min',
      path: ['max'],
    }
  );

export const profileLinksSchema = z.object({
  linkedin: safeLinkSchema.optional(),
  github: safeLinkSchema.optional(),
  portfolio: safeLinkSchema.optional(),
});

const languageEntrySchema = z.union([
  z.string().transform((v) => sanitizeProfileText(v, 60)),
  z
    .object({
      language: z.string(),
      proficiency: z.string().optional(),
    })
    .transform((obj) => {
      const lang = sanitizeProfileText(obj.language, 45);
      const prof = obj.proficiency ? sanitizeProfileText(obj.proficiency, 25) : '';
      return prof ? `${lang} (${prof})` : lang;
    }),
]);

const phoneInputSchema = z.union([
  z.string().max(50),
  z.object({
    value: z.string().max(50).optional(),
    number: z.string().max(50).optional(),
    visible: z.boolean().optional(),
  }),
]);

export const profileUpdateSchema = z
  .object({
    fullName: z
      .string()
      .max(120, 'Full name cannot exceed 120 characters')
      .transform((v) => sanitizeProfileText(v, 120))
      .optional(),
    headline: z
      .string()
      .max(160, 'Headline cannot exceed 160 characters')
      .transform((v) => sanitizeProfileText(v, 160))
      .optional(),
    targetRole: z
      .string()
      .max(160, 'Target role cannot exceed 160 characters')
      .transform((v) => sanitizeProfileText(v, 160))
      .optional(),
    seniority: z.enum(SENIORITY_LEVELS).nullable().optional(),
    yearsOfExperience: z
      .number()
      .min(0, 'Years of experience cannot be negative')
      .max(60, 'Years of experience cannot exceed 60')
      .nullable()
      .optional(),
    industries: z
      .array(
        z
          .string()
          .max(80)
          .transform((v) => sanitizeProfileText(v, 80))
      )
      .max(MAX_PROFILE_INDUSTRIES, `Maximum ${MAX_PROFILE_INDUSTRIES} industries allowed`)
      .transform((arr) => dedupeStrings(arr.filter(Boolean), MAX_PROFILE_INDUSTRIES))
      .optional(),
    skills: z
      .array(
        z
          .string()
          .max(60, 'Skill name cannot exceed 60 characters')
          .transform((v) => sanitizeProfileText(v, 60))
      )
      .max(MAX_PROFILE_SKILLS, `Maximum ${MAX_PROFILE_SKILLS} skills allowed`)
      .transform((arr) => dedupeStrings(arr.filter(Boolean), MAX_PROFILE_SKILLS))
      .optional(),
    country: z
      .string()
      .max(80)
      .transform((v) => sanitizeProfileText(v, 80))
      .optional(),
    city: z
      .string()
      .max(80)
      .transform((v) => sanitizeProfileText(v, 80))
      .optional(),
    willingToRelocate: z.boolean().optional(),
    remotePreference: z.enum(REMOTE_PREFERENCES).optional(),
    employmentTypes: z
      .array(z.enum(EMPLOYMENT_TYPES))
      .max(EMPLOYMENT_TYPES.length)
      .transform((arr) => Array.from(new Set(arr)) as EmploymentType[])
      .optional(),
    expectedSalary: expectedSalarySchema.optional(),
    languages: z
      .array(languageEntrySchema)
      .max(MAX_PROFILE_LANGUAGES, `Maximum ${MAX_PROFILE_LANGUAGES} languages allowed`)
      .transform((arr) => dedupeStrings(arr.filter(Boolean), MAX_PROFILE_LANGUAGES))
      .optional(),
    phone: phoneInputSchema.optional(),
    phoneVisible: z.boolean().optional(),
    links: profileLinksSchema.optional(),
    avatar: z
      .string()
      .max(300_000)
      .transform((val, ctx) => {
        const cleaned = sanitizeAvatarUrl(val);
        if (cleaned === null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Invalid avatar URL or image data.',
          });
          return z.NEVER;
        }
        return cleaned;
      })
      .optional(),
    completeOnboarding: z.boolean().optional(),
  })
  .strict();

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export interface PartialProfileForCompletion {
  fullName?: string;
  headline?: string;
  targetRole?: string;
  seniority?: SeniorityLevel | null;
  yearsOfExperience?: number | null;
  industries?: string[];
  skills?: string[];
  country?: string;
  city?: string;
  willingToRelocate?: boolean;
  remotePreference?: RemotePreference;
  employmentTypes?: EmploymentType[];
  expectedSalary?: Partial<ExpectedSalary>;
  languages?: string[];
  phone?: string;
  phoneVisible?: boolean;
  links?: Partial<ProfileLinks>;
  avatar?: string;
}

export const profileSuggestQuerySchema = z.object({
  type: z.enum(['role', 'skill']),
  q: z
    .string()
    .max(100)
    .transform((v) => sanitizeProfileText(v, 100))
    .default(''),
  lang: z.enum(['en', 'ar', 'fr', 'de', 'es', 'tr']).optional(),
  limit: z
    .string()
    .optional()
    .transform((v) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 1 ? Math.min(25, Math.floor(n)) : 12;
    }),
});

