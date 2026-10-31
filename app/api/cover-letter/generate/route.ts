import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, validateCsrfOrigin } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { CoverLetterService } from '@/app/lib/coverLetterService';
import { AICoverLetterClient } from '@/app/lib/aiCoverLetterClient';
import { GenerateCoverLetterRequest } from '@/app/cover-letter/types';
import { applyRateLimit, parseBoundedJsonBody, DEFAULT_MAX_AI_BODY_BYTES } from '@/lib/rate-limit';
import { requireCredits, consumeCredit, CreditCheckResult } from '@/lib/credit-guard';

export const maxDuration = 60;

// POST /api/cover-letter/generate - Synthesize an AI-tailored cover letter with server-side AI and robust fallback
export async function POST(req: NextRequest) {
  try {
    // 1. CSRF Protection for browser calls
    if (!validateCsrfOrigin(req)) {
      return NextResponse.json(
        { success: false, error: 'Cross-origin request blocked (CSRF protection)' },
        { status: 403 }
      );
    }

    // 2. Authentication & AI Generation Credit Guard
    const authUser = getAuthenticatedUser(req);
    if (!authUser?.userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'يرجى تسجيل الدخول أو تجربة وضع الديمو لتوليد خطابات التقديم بالذكاء الاصطناعي (Please sign in or use Demo mode to generate AI cover letters)',
          loginUrl: '/login',
        },
        { status: 401 }
      );
    }

    const creditCheck = await requireCredits(authUser.userId, req);
    if (!creditCheck.allowed && creditCheck.errorResponse) {
      return creditCheck.errorResponse;
    }

    // 3. Rate Limiting: 40 AI generations per minute per user + per IP
    const rateLimit = await applyRateLimit(
      req,
      { limit: 40, ipLimit: 80, windowMs: 60 * 1000, keyPrefix: 'gen' },
      authUser?.userId
    );
    if (!rateLimit.allowed && rateLimit.errorResponse) {
      return rateLimit.errorResponse;
    }

    // 4. Enforce maximum body size (100KB) and parse JSON safely
    const parsed = await parseBoundedJsonBody<GenerateCoverLetterRequest>(
      req,
      DEFAULT_MAX_AI_BODY_BYTES
    );
    if (!parsed.ok) {
      return parsed.errorResponse;
    }
    const body = parsed.data;

    // 2. Contract Validation
    const validation = CoverLetterService.validateRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // 3. If jobUrl is provided and jobDescription is not, fetch from URL
    let resolvedDescription = (body.jobDescription || '').trim();
    if (!resolvedDescription && body.jobUrl) {
      try {
        resolvedDescription = await CoverLetterService.fetchJobDescriptionFromUrl(body.jobUrl.trim());
      } catch (fetchErr: unknown) {
        const msg = fetchErr instanceof Error ? fetchErr.message : 'Failed to fetch job description from the provided URL';
        return NextResponse.json(
          {
            success: false,
            error: msg,
          },
          { status: 422 }
        );
      }
    }

    // 4. Fallback check for minimum text length
    if (resolvedDescription.length < 25) {
      return NextResponse.json(
        {
          success: false,
          error: 'الوصف الوظيفي المسترجع غير كافٍ لتوليد الخطاب. يرجى توفير نص أطول أو لصقه يدوياً.',
        },
        { status: 400 }
      );
    }

    // 5. IDOR & Authorization Protection: Validate resume ownership if resumeId is provided
    let resumeData: Record<string, unknown> | null = null;
    if (body.resumeId && typeof body.resumeId === 'string') {
      const cleanResumeId = body.resumeId.trim();
      const authUser = getAuthenticatedUser(req);
      const resume = await DataStore.getResumeById(cleanResumeId);

      if (resume) {
        if (resume.userId && (!authUser || resume.userId !== authUser.userId)) {
          return NextResponse.json(
            {
              success: false,
              error: 'غير مصرح لك بالوصول إلى بيانات هذه السيرة الذاتية (Access denied to the specified resume)',
            },
            { status: 403 }
          );
        }
        resumeData = resume;
      }
    }

    // 6. Synthesize Cover Letter via AI integration client (with domain fallback)
    const synthesizedBody: GenerateCoverLetterRequest = {
      ...body,
      jobDescription: resolvedDescription,
      language: body.language || CoverLetterService.detectLanguage(resolvedDescription),
    };

    const aiResult = await AICoverLetterClient.generateCoverLetter(synthesizedBody, resumeData);

    // 7. Atomic Credit Deduction (Only on successful generation)
    let creditsLeft: number | undefined;
    if (authUser?.userId && creditCheck && !creditCheck.unlimited) {
      const consumeResult = await consumeCredit(authUser.userId);
      creditsLeft = consumeResult.remaining;
    } else if (creditCheck?.unlimited) {
      creditsLeft = Infinity;
    }

    return NextResponse.json({
      success: true,
      coverLetter: aiResult.coverLetter,
      extractedKeywords: aiResult.coverLetter.extractedKeywords,
      provider: aiResult.provider,
      aiGenerated: aiResult.aiGenerated,
      creditsLeft,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error generating cover letter:', errorMsg);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء معالجة الطلب. يرجى المحاولة مرة أخرى لاحقاً.' },
      { status: 500 }
    );
  }
}
