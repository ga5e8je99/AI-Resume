import { sanitizeProfileText } from '@/lib/profile';
import type { EmployerJobRecord, OrganizationRecord } from '@/lib/hr';

export const MAX_RESUME_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_RESUME_EXTENSIONS = new Set(['.pdf', '.docx', '.doc', '.txt']);

export const ALLOWED_RESUME_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'application/octet-stream', // Allowed only when extension + magic bytes match
]);

export interface FileValidationResult {
  valid: boolean;
  extension?: string;
  error?:
    | 'EMPTY_FILE'
    | 'FILE_TOO_LARGE'
    | 'UNSUPPORTED_FILE_TYPE'
    | 'MALICIOUS_FILE_CONTENT'
    | 'INVALID_FILE_SIGNATURE';
  message?: string;
  reason?: string;
}

/**
 * Validates an uploaded CV/resume file's size, extension, MIME type, and binary/text content signature.
 */
export function validateUploadedResumeFile(input: {
  name: string;
  size: number;
  type?: string;
  buffer?: Buffer | Uint8Array | string | null;
  bytes?: Buffer | Uint8Array | string | null;
}): FileValidationResult {
  const fileName = (input.name || '').trim().toLowerCase();
  const size = Number(input.size);

  if (!Number.isFinite(size) || size <= 0) {
    return {
      valid: false,
      error: 'EMPTY_FILE',
      message: 'Uploaded file is empty.',
      reason: 'Uploaded file is empty.',
    };
  }

  if (size > MAX_RESUME_UPLOAD_BYTES) {
    return {
      valid: false,
      error: 'FILE_TOO_LARGE',
      message: 'Resume file size cannot exceed 5 MB.',
      reason: 'Resume file size cannot exceed 5 MB.',
    };
  }

  const dotIdx = fileName.lastIndexOf('.');
  const ext = dotIdx >= 0 ? fileName.slice(dotIdx) : '';
  if (!ALLOWED_RESUME_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: 'UNSUPPORTED_FILE_TYPE',
      message: 'Only PDF, DOCX, DOC, and TXT resume files are allowed.',
      reason: 'Only PDF, DOCX, DOC, and TXT resume files are allowed.',
    };
  }

  // Reject double extensions hiding executables (e.g. resume.pdf.exe or resume.exe.pdf)
  if (/\.(exe|bat|cmd|sh|js|vbs|ps1|scr|msi|com|php|py|dll)\b/i.test(fileName)) {
    return {
      valid: false,
      error: 'MALICIOUS_FILE_CONTENT',
      message: 'Executable or script file names are not permitted.',
      reason: 'Executable or script file names are not permitted.',
    };
  }

  const mime = (input.type || '').trim().toLowerCase();
  if (mime && !ALLOWED_RESUME_MIME_TYPES.has(mime)) {
    return {
      valid: false,
      error: 'UNSUPPORTED_FILE_TYPE',
      message: `Unsupported MIME type: ${mime}`,
      reason: `Unsupported MIME type: ${mime}`,
    };
  }

  const rawBuf = input.buffer ?? input.bytes;
  if (rawBuf) {
    const buf =
      typeof rawBuf === 'string'
        ? Buffer.from(rawBuf, 'utf-8')
        : Buffer.from(rawBuf);

    if (buf.length > MAX_RESUME_UPLOAD_BYTES) {
      return {
        valid: false,
        error: 'FILE_TOO_LARGE',
        message: 'Resume file size cannot exceed 5 MB.',
        reason: 'Resume file size cannot exceed 5 MB.',
      };
    }

    // Check for executable headers: Windows MZ (0x4D 0x5A) or Linux ELF (0x7F 'E' 'L' 'F')
    if (
      (buf.length >= 2 && buf[0] === 0x4d && buf[1] === 0x5a) ||
      (buf.length >= 4 &&
        buf[0] === 0x7f &&
        buf[1] === 0x45 &&
        buf[2] === 0x4c &&
        buf[3] === 0x46)
    ) {
      return {
        valid: false,
        error: 'MALICIOUS_FILE_CONTENT',
        message: 'Executable binary content detected and rejected.',
        reason: 'Executable binary content detected and rejected.',
      };
    }

    const headAscii = buf.subarray(0, Math.min(512, buf.length)).toString('utf-8');

    // Reject shell scripts or raw HTML/JS payloads disguised as resumes
    if (
      headAscii.startsWith('#!/') ||
      /<\s*(?:script|iframe|object|embed)\b/i.test(headAscii)
    ) {
      return {
        valid: false,
        error: 'MALICIOUS_FILE_CONTENT',
        message: 'Script content detected inside uploaded file.',
        reason: 'Script content detected inside uploaded file.',
      };
    }

    // Magic-byte verification for PDF (%PDF-) if binary PDF header is expected
    if (ext === '.pdf' && buf.length >= 5) {
      const pdfHeader = buf.subarray(0, 5).toString('ascii');
      if (pdfHeader !== '%PDF-') {
        return {
          valid: false,
          error: 'INVALID_FILE_SIGNATURE',
          message: 'File does not have a valid PDF signature (%PDF-).',
          reason: 'File does not have a valid PDF signature (%PDF-).',
        };
      }
    }

    // Magic-byte verification for DOCX (PK\x03\x04 ZIP header)
    if (ext === '.docx' && buf.length >= 4) {
      if (buf[0] !== 0x50 || buf[1] !== 0x4b) {
        return {
          valid: false,
          error: 'INVALID_FILE_SIGNATURE',
          message: 'File does not have a valid DOCX container signature.',
          reason: 'File does not have a valid DOCX container signature.',
        };
      }
    }
  }

  return { valid: true, extension: ext };
}

// ============================================================================
// Schema.org JobPosting Structured Data (JSON-LD)
// ============================================================================

const EMPLOYMENT_TYPE_SCHEMA_MAP: Record<string, string> = {
  'full-time': 'FULL_TIME',
  'part-time': 'PART_TIME',
  contract: 'CONTRACTOR',
  internship: 'INTERN',
};

export function buildJobPostingJsonLd(
  jobOrObj:
    | EmployerJobRecord
    | { job: EmployerJobRecord; org: OrganizationRecord | null; baseUrl?: string },
  maybeOrg?: OrganizationRecord | null,
  maybeBaseUrl = 'https://jobmatch.ai'
): Record<string, any> {
  const isWrapper =
    jobOrObj && typeof jobOrObj === 'object' && 'job' in jobOrObj && jobOrObj.job;
  const job: EmployerJobRecord = isWrapper
    ? (jobOrObj as { job: EmployerJobRecord }).job
    : (jobOrObj as EmployerJobRecord);
  const org: OrganizationRecord | null = isWrapper
    ? (jobOrObj as { org: OrganizationRecord | null }).org
    : (maybeOrg ?? null);
  const baseUrl: string = isWrapper
    ? (jobOrObj as { baseUrl?: string }).baseUrl || 'https://jobmatch.ai'
    : maybeBaseUrl;
  const datePosted = job.publishedAt || job.createdAt || new Date().toISOString();
  const validThrough =
    job.expiresAt ||
    new Date(new Date(datePosted).getTime() + 45 * 24 * 3600 * 1000).toISOString();

  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    identifier: {
      '@type': 'PropertyValue',
      name: org?.name || 'JobMatch AI Employer',
      value: job.id,
    },
    datePosted,
    validThrough,
    employmentType: EMPLOYMENT_TYPE_SCHEMA_MAP[job.employmentType] || 'FULL_TIME',
    directApply: true,
    url: `${baseUrl}/jobs/hire/${job.slug}`,
    hiringOrganization: {
      '@type': 'Organization',
      name: org?.name || 'Verified Employer',
      ...(org?.website ? { sameAs: org.website } : {}),
      ...(org?.logo ? { logo: org.logo } : {}),
    },
  };

  if (job.remote) {
    jsonLd.jobLocationType = 'TELECOMMUTE';
  }

  if (job.location) {
    jsonLd.jobLocation = {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location,
        ...(org?.country ? { addressCountry: org.country } : {}),
      },
    };
  }

  if (
    job.salary?.visible &&
    (typeof job.salary.min === 'number' || typeof job.salary.max === 'number')
  ) {
    jsonLd.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: job.salary.currency || 'USD',
      value: {
        '@type': 'QuantitativeValue',
        ...(typeof job.salary.min === 'number' ? { minValue: job.salary.min } : {}),
        ...(typeof job.salary.max === 'number' ? { maxValue: job.salary.max } : {}),
        unitText: 'YEAR',
      },
    };
  }

  return jsonLd;
}

// ============================================================================
// Transactional Emails for Application Submission (Candidate + HR)
// ============================================================================

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildApplicationSubmittedEmails(input: {
  candidateName: string;
  jobTitle: string;
  jobSlug: string;
  jobId: string;
  orgName: string;
  baseUrl?: string;
}): {
  candidateEmail: { subject: string; html: string };
  hrEmail: { subject: string; html: string };
} {
  const base = input.baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://jobmatch.ai';
  const safeCandidate = escapeHtml(sanitizeProfileText(input.candidateName || 'Candidate', 100));
  const safeJob = escapeHtml(sanitizeProfileText(input.jobTitle || 'Role', 140));
  const safeOrg = escapeHtml(sanitizeProfileText(input.orgName || 'Organization', 120));

  const candidateEmail = {
    subject: `Application Confirmed: ${sanitizeProfileText(input.jobTitle, 120)} at ${sanitizeProfileText(input.orgName, 100)}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#faf8f5;padding:24px;color:#0f172a;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:28px;">
    <h2 style="margin:0 0 12px;color:#047857;font-size:20px;">Application Received</h2>
    <p style="font-size:15px;line-height:1.6;color:#334155;">
      Hi <strong>${safeCandidate}</strong>,
    </p>
    <p style="font-size:15px;line-height:1.6;color:#334155;">
      Your application for <strong>${safeJob}</strong> at <strong>${safeOrg}</strong> has been securely submitted.
    </p>
    <p style="font-size:14px;line-height:1.6;color:#475569;">
      You can track your application status or withdraw your application at any time from your dashboard:
      <a href="${base}/applications" style="color:#047857;font-weight:600;">My Applications</a>.
    </p>
  </div>
</body>
</html>`,
  };

  const hrEmail = {
    subject: `New Applicant for ${sanitizeProfileText(input.jobTitle, 120)}: ${sanitizeProfileText(input.candidateName, 100)}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#faf8f5;padding:24px;color:#0f172a;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:28px;">
    <h2 style="margin:0 0 12px;color:#047857;font-size:20px;">New Job Application Received</h2>
    <p style="font-size:15px;line-height:1.6;color:#334155;">
      <strong>${safeCandidate}</strong> has applied for <strong>${safeJob}</strong> at <strong>${safeOrg}</strong>.
    </p>
    <p style="font-size:14px;line-height:1.6;color:#475569;">
      Review their CV snapshot, screening answers, and match score in your Employer Dashboard:
      <a href="${base}/employer/jobs/${escapeHtml(input.jobId)}/applicants" style="color:#047857;font-weight:600;">View Applicants</a>.
    </p>
  </div>
</body>
</html>`,
  };

  return { candidateEmail, hrEmail };
}

