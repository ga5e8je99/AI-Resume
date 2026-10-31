import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { requireAuth } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { extractProfileFromResumeData, extractProfileFromText } from '@/lib/jobs/extractor';
import { applyRateLimit, parseBoundedJsonBody } from '@/lib/rate-limit';

const MAX_EXTRACT_PROFILE_BODY_BYTES = 150 * 1024; // 150KB max request payload
const MAX_EXTRACT_PROFILE_TEXT_CHARS = 50000;      // 50,000 chars max resume text

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce authentication (returns 401 if unauthenticated)
    const { user, errorResponse } = requireAuth(req);
    if (!user || errorResponse) {
      return (
        errorResponse ||
        NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'Authentication required' },
          { status: 401 }
        )
      );
    }

    // 2. Rate limiting per authenticated user + per IP
    const rateLimit = await applyRateLimit(
      req,
      { limit: 30, ipLimit: 60, windowMs: 60 * 1000, keyPrefix: 'extract_profile' },
      user.id
    );
    if (!rateLimit.allowed && rateLimit.errorResponse) {
      return rateLimit.errorResponse;
    }

    // 3. Enforce max body size (150KB) and parse JSON safely
    const parsed = await parseBoundedJsonBody(req, MAX_EXTRACT_PROFILE_BODY_BYTES);
    if (!parsed.ok) {
      return parsed.errorResponse;
    }
    const body = parsed.data;

    const { resumeId, text, resumeData } = body || {};

    if (typeof text === 'string' && text.length > MAX_EXTRACT_PROFILE_TEXT_CHARS) {
      return NextResponse.json(
        {
          error: 'INPUT_TOO_LONG',
          message: `Resume text exceeds maximum allowed length of ${MAX_EXTRACT_PROFILE_TEXT_CHARS} characters.`,
        },
        { status: 400 }
      );
    }

    let profile = null;

    // 4. If resumeId is provided, verify ownership (return 404 if not found or not owned by user.id)
    if (resumeId !== undefined && resumeId !== null && String(resumeId).trim() !== '') {
      const resume = await DataStore.getResumeById(String(resumeId).trim());
      if (!resume || String(resume.userId) !== String(user.id)) {
        return NextResponse.json(
          { error: 'RESUME_NOT_FOUND', message: 'Resume not found' },
          { status: 404 }
        );
      }

      if (resume.data) {
        profile = extractProfileFromResumeData(resume.data);
      }
    }

    if (!profile && resumeData) {
      profile = extractProfileFromResumeData(resumeData);
    }

    if (!profile && text && typeof text === 'string') {
      profile = extractProfileFromText(text);
    }

    if (!profile) {
      profile = extractProfileFromResumeData({
        personalInfo: { jobTitle: 'Software Engineer', location: 'Cairo, Egypt' },
        skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'SQL', 'Git'],
        experience: [{ title: 'Software Engineer' }],
      });
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error('[ExtractProfile] Error extracting profile for job match:', error);
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'EXTRACT_FAILED', message: error?.message || 'Failed to extract profile' },
      { status: 500 }
    );
  }
}
