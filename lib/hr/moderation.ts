import { sanitizeProfileText } from '@/lib/profile';

export const FREE_AND_DISPOSABLE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.fr',
  'yahoo.de',
  'hotmail.com',
  'hotmail.co.uk',
  'outlook.com',
  'outlook.sa',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'gmx.com',
  'gmx.de',
  'yandex.com',
  'yandex.ru',
  'mail.com',
  'mail.ru',
  'zoho.com',
  'tempmail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'mailinator.com',
  'yopmail.com',
  'sharklasers.com',
  'trashmail.com',
]);

export interface CompanyEmailValidationResult {
  valid: boolean;
  email: string;
  domain: string;
  reason?: 'INVALID_EMAIL' | 'CONSUMER_EMAIL_DOMAIN_NOT_ALLOWED';
}

/**
 * Validates that an email address belongs to a corporate/organization domain
 * and is NOT a free consumer webmail or disposable provider (gmail, yahoo, hotmail, etc.).
 */
export function validateCompanyDomainEmail(rawEmail: unknown): CompanyEmailValidationResult {
  if (typeof rawEmail !== 'string') {
    return { valid: false, email: '', domain: '', reason: 'INVALID_EMAIL' };
  }
  const email = rawEmail.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@([a-z0-9-]+(?:\.[a-z0-9-]+)+)$/i;
  const match = email.match(emailRegex);
  if (!match) {
    return { valid: false, email, domain: '', reason: 'INVALID_EMAIL' };
  }

  const domain = match[1].toLowerCase();
  if (FREE_AND_DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return {
      valid: false,
      email,
      domain,
      reason: 'CONSUMER_EMAIL_DOMAIN_NOT_ALLOWED',
    };
  }

  return { valid: true, email, domain };
}

// ============================================================================
// Content Moderation Filter (Banned Words, Suspicious Links, Payment Requests)
// ============================================================================

const PAYMENT_REQUEST_PATTERNS: RegExp[] = [
  /\b(?:registration|application|training|processing|onboarding|security|equipment|background\s*check)\s+fee\b/i,
  /\bpay\s+(?:a\s+)?(?:fee|deposit|upfront|for\s+training|for\s+equipment)\b/i,
  /\bsend\s+money\b/i,
  /\bwire\s+transfer\b/i,
  /\bwestern\s+union\b/i,
  /\bcrypto(?:currency)?\s+(?:deposit|payment|fee)\b/i,
  /(?:رسوم\s*(?:تقديم|تدريب|تسجيل|إدارية|استمارة|توظيف)|دفع\s*مبلغ|تحويل\s*(?:مالي|بنكي)\s*للتقديم|اشترط\s*دفع)/i,
];

const BANNED_SCAM_PATTERNS: RegExp[] = [
  /\bpyramid\s+scheme\b/i,
  /\bponzi\b/i,
  /\bget\s+rich\s+quick\b/i,
  /\bmoney\s+laundering\b/i,
  /\bcash\s+flipping\b/i,
  /\bno\s+experience\s+\$\d{4,}\s*(?:per\s+day|daily)\b/i,
  /(?:تسويق\s*هرمي|غسيل\s*أموال|ربح\s*سريع\s*مضمون|ثراء\s*سريع)/i,
];

const SUSPICIOUS_LINK_PATTERNS: RegExp[] = [
  /\bhttps?:\/\/(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd|cutt\.ly|rb\.gy|ow\.ly|shorturl\.at)\/[^\s)]+/i,
  /\bhttps?:\/\/(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:\/[^\s)]*)?/i,
  /\b(?:https?:\/\/)?(?:t\.me|telegram\.me|wa\.me|chat\.whatsapp\.com)\/[^\s)]+/i,
];

export type ModerationFlagCode =
  | 'PAYMENT_FROM_APPLICANT'
  | 'SUSPICIOUS_LINK'
  | 'BANNED_SCAM_CONTENT';

export interface ContentModerationResult {
  passed: boolean;
  flagged: boolean;
  flags: ModerationFlagCode[];
  reasons: string[];
}

/**
 * Inspects job title, description, requirements, and screening questions for:
 * 1. Requests for payment/fees from applicants
 * 2. Suspicious shortened/IP/off-platform chat links
 * 3. Banned scam keywords
 */
export function moderateJobContent(input: {
  title?: string;
  description?: string;
  requirements?: string[];
  screeningQuestions?: string[];
}): ContentModerationResult {
  const combined = [
    input.title || '',
    input.description || '',
    ...(input.requirements || []),
    ...(input.screeningQuestions || []),
  ].join('\n');

  const flags = new Set<ModerationFlagCode>();
  const reasons: string[] = [];

  for (const pattern of PAYMENT_REQUEST_PATTERNS) {
    if (pattern.test(combined)) {
      flags.add('PAYMENT_FROM_APPLICANT');
      reasons.push('Job posting appears to request payment or fees from applicants.');
      break;
    }
  }

  for (const pattern of SUSPICIOUS_LINK_PATTERNS) {
    if (pattern.test(combined)) {
      flags.add('SUSPICIOUS_LINK');
      reasons.push('Job posting contains suspicious shortened, raw-IP, or external chat links.');
      break;
    }
  }

  for (const pattern of BANNED_SCAM_PATTERNS) {
    if (pattern.test(combined)) {
      flags.add('BANNED_SCAM_CONTENT');
      reasons.push('Job posting contains prohibited or scam-related keywords.');
      break;
    }
  }

  const flagList = Array.from(flags);
  return {
    passed: flagList.length === 0,
    flagged: flagList.length > 0,
    flags: flagList,
    reasons,
  };
}

// ============================================================================
// Safe CSV Export for Job Applicants
// ============================================================================

function escapeCsvCell(value: unknown): string {
  const raw = value === null || value === undefined ? '' : String(value).replace(/\r?\n/g, ' ');
  // Prevent CSV formula injection in Excel/Sheets (=, +, -, @, tab, CR)
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  if (/[",]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function generateApplicantsCsv(
  rows: Array<{
    applicationId: string;
    candidateName: string;
    candidateEmail: string;
    candidatePhone?: string;
    status: string;
    score: number | null;
    matchedSkills: string[];
    missingSkills: string[];
    appliedAt: string;
    answers: Array<{ question: string; answer: string }>;
    notes?: string;
  }>
): string {
  const headers = [
    'Application ID',
    'Candidate Name',
    'Candidate Email',
    'Phone',
    'Status',
    'Match Score (%)',
    'Matched Skills',
    'Missing Skills',
    'Applied At',
    'Screening Answers',
    'HR Notes',
  ];

  const lines: string[] = [headers.map(escapeCsvCell).join(',')];

  for (const row of rows) {
    const formattedAnswers = (row.answers || [])
      .map((a) => `${a.question}: ${a.answer}`)
      .join(' | ');

    lines.push(
      [
        row.applicationId,
        row.candidateName,
        row.candidateEmail,
        row.candidatePhone || '',
        row.status,
        row.score !== null && row.score !== undefined ? String(row.score) : '',
        (row.matchedSkills || []).join('; '),
        (row.missingSkills || []).join('; '),
        row.appliedAt,
        formattedAnswers,
        row.notes || '',
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  // Prepend UTF-8 BOM so Excel opens Arabic & international characters properly
  return `\uFEFF${lines.join('\r\n')}`;
}

// ============================================================================
// Candidate Email Templates (Resend) — Hides HR Email Unless Opted In
// ============================================================================

export type CandidateEmailTemplateType =
  | 'interview'
  | 'shortlisted'
  | 'rejected'
  | 'custom';

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildCandidateOutreachEmail(input: {
  template: CandidateEmailTemplateType;
  candidateName: string;
  jobTitle: string;
  orgName: string;
  customSubject?: string;
  customMessage?: string;
  revealHrEmail?: boolean;
  hrEmail?: string;
}): {
  subject: string;
  html: string;
} {
  const safeCandidate = escapeHtml(sanitizeProfileText(input.candidateName || 'Candidate', 100));
  const safeJob = escapeHtml(sanitizeProfileText(input.jobTitle || 'Role', 140));
  const safeOrg = escapeHtml(sanitizeProfileText(input.orgName || 'Hiring Team', 120));
  const safeCustomMsg = escapeHtml(sanitizeProfileText(input.customMessage || '', 3000)).replace(
    /\n/g,
    '<br/>'
  );

  let defaultSubject = `Update on your application for ${sanitizeProfileText(input.jobTitle, 120)} at ${sanitizeProfileText(input.orgName, 100)}`;
  let bodyHeading = `Application Update — ${safeJob}`;
  let defaultBodyHtml = '';

  if (input.template === 'interview') {
    defaultSubject = `Interview Invitation: ${sanitizeProfileText(input.jobTitle, 120)} at ${sanitizeProfileText(input.orgName, 100)}`;
    bodyHeading = `Interview Invitation — ${safeOrg}`;
    defaultBodyHtml = `<p>Dear ${safeCandidate},</p><p>Thank you for applying for the <strong>${safeJob}</strong> position at <strong>${safeOrg}</strong>. Our hiring team was impressed with your background and would like to invite you to an interview.</p>`;
  } else if (input.template === 'shortlisted') {
    defaultSubject = `Your application for ${sanitizeProfileText(input.jobTitle, 120)} has been shortlisted`;
    bodyHeading = `You've Been Shortlisted — ${safeOrg}`;
    defaultBodyHtml = `<p>Dear ${safeCandidate},</p><p>Good news! Your application for <strong>${safeJob}</strong> at <strong>${safeOrg}</strong> has been shortlisted by our recruitment team for further review.</p>`;
  } else if (input.template === 'rejected') {
    defaultSubject = `Update regarding your application for ${sanitizeProfileText(input.jobTitle, 120)}`;
    bodyHeading = `Application Status Update — ${safeOrg}`;
    defaultBodyHtml = `<p>Dear ${safeCandidate},</p><p>Thank you for taking the time to apply for <strong>${safeJob}</strong> at <strong>${safeOrg}</strong>. While we were impressed with your qualifications, we have decided to proceed with other candidates whose experience more closely aligns with our current needs.</p>`;
  } else {
    bodyHeading = `Message from ${safeOrg} Hiring Team`;
    defaultBodyHtml = `<p>Dear ${safeCandidate},</p><p>Regarding your application for <strong>${safeJob}</strong> at <strong>${safeOrg}</strong>:</p>`;
  }

  const subject = input.customSubject?.trim()
    ? sanitizeProfileText(input.customSubject.trim(), 160)
    : defaultSubject;

  const contactBlock =
    input.revealHrEmail && input.hrEmail
      ? `<div style="margin-top:20px;padding:12px 16px;background:#f0fdf4;border-left:4px solid #047857;border-radius:6px;font-size:13px;color:#065f46;">
          <strong>Direct Recruiter Contact:</strong> You may reply directly to <a href="mailto:${escapeHtml(input.hrEmail)}" style="color:#047857;">${escapeHtml(input.hrEmail)}</a>.
        </div>`
      : `<div style="margin-top:20px;padding:12px 16px;background:#f8fafc;border-radius:6px;font-size:12px;color:#64748b;">
          Sent securely via <strong>JobMatch AI</strong> on behalf of <strong>${safeOrg}</strong>.
        </div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#faf8f5;padding:24px;color:#0f172a;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:28px;">
    <h2 style="margin:0 0 16px;color:#047857;font-size:20px;">${bodyHeading}</h2>
    <div style="font-size:15px;line-height:1.6;color:#334155;">
      ${defaultBodyHtml}
      ${safeCustomMsg ? `<div style="margin-top:14px;padding:14px;background:#f8fafc;border-radius:8px;">${safeCustomMsg}</div>` : ''}
    </div>
    ${contactBlock}
  </div>
</body>
</html>`;

  return { subject, html };
}

