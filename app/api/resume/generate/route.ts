import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, validateCsrfOrigin } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { ResumeService, GenerateResumeRequest } from '@/app/lib/resumeService';
import { AIResumeClient } from '@/app/lib/aiResumeClient';
import { CoverLetterService } from '@/app/lib/coverLetterService';
import { applyRateLimit } from '@/app/lib/rateLimit';
import { requireCredits, consumeCredit } from '@/lib/credit-guard';
import { RESUME_GENERATION_CREDIT_COST } from '@/lib/plans';

// POST /api/resume/generate - Generate structured ATS Resume or CV using AI with plans & credits enforcement
export async function POST(req: NextRequest) {
  try {
    // 1. CSRF Protection for browser requests
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
          error: 'Please sign in or use Demo mode to generate an AI Resume/CV (يرجى تسجيل الدخول أو استخدام الحساب التجريبي لتوليد السيرة الذاتية بالذكاء الاصطناعي)',
          loginUrl: '/login',
        },
        { status: 401 }
      );
    }

    // Check credits for 'resume_generation' (costs 2 credits on PAYG, 1 free taste on Free tier, unlimited on Pro/Demo)
    const creditCheck = await requireCredits(authUser.userId, req, {
      feature: 'resume_generation',
      cost: RESUME_GENERATION_CREDIT_COST,
    });

    if (!creditCheck.allowed && creditCheck.errorResponse) {
      return creditCheck.errorResponse;
    }

    // 3. Rate Limiting: 30 requests per minute per user
    const rateLimit = applyRateLimit(
      req,
      { limit: 30, windowMs: 60 * 1000, keyPrefix: 'res_gen' },
      authUser.userId
    );
    if (!rateLimit.allowed && rateLimit.errorResponse) {
      return rateLimit.errorResponse;
    }

    let body: GenerateResumeRequest;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request payload' },
        { status: 400 }
      );
    }

    // 4. Contract Validation
    const validation = ResumeService.validateRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // 5. If jobUrl is provided without jobDescription, fetch job description from URL
    let resolvedDescription = (body.jobDescription || '').trim();
    if (!resolvedDescription && (body as any).jobUrl) {
      try {
        resolvedDescription = await CoverLetterService.fetchJobDescriptionFromUrl((body as any).jobUrl.trim());
      } catch (fetchErr: unknown) {
        const msg = fetchErr instanceof Error ? fetchErr.message : 'Failed to fetch job description from URL';
        return NextResponse.json({ success: false, error: msg }, { status: 422 });
      }
    }

    // 6. IDOR & Resume ownership validation if starting from existing resume ID
    let originalData = body.originalResumeData;
    if ((body as any).originalResumeId && typeof (body as any).originalResumeId === 'string') {
      const cleanId = (body as any).originalResumeId.trim();
      const existing = await DataStore.getResumeById(cleanId);
      if (existing) {
        if (existing.userId && existing.userId !== authUser.userId) {
          return NextResponse.json(
            { success: false, error: 'Access denied to the specified resume' },
            { status: 403 }
          );
        }
        originalData = existing.data;
      }
    }

    // 7. Synthesize Resume / CV via AI Client (with automatic ATS fallback)
    const synthesizedReq: GenerateResumeRequest = {
      ...body,
      jobDescription: resolvedDescription,
      originalResumeData: originalData,
      outputLanguage: body.outputLanguage || 'en',
      documentType: body.documentType || 'resume',
      templateChoice: body.templateChoice || 'compact',
    };

    const aiResult = await AIResumeClient.generateResume(synthesizedReq);

    // 8. Persist as a regular resume in DataStore so user can immediately edit, preview, and export in Builder
    const docTypeLabel = synthesizedReq.documentType === 'cv' ? 'CV' : 'Resume';
    const resumeTitle = `${synthesizedReq.targetJobTitle} - ${docTypeLabel} (AI)`;

    const savedResume = await DataStore.createUserResume(authUser.userId, {
      title: resumeTitle,
      templateId: synthesizedReq.templateChoice || 'compact',
      theme: {
        accentColor: '#0F5C4D',
        fontFamily: synthesizedReq.outputLanguage === 'ar' ? 'var(--font-arabic), sans-serif' : 'var(--font-sans), sans-serif',
        fontSize: 'base',
        documentLanguage: synthesizedReq.outputLanguage || 'en',
      },
      data: aiResult.resume,
    });

    // 9. Atomic Credit Deduction (Only on successful generation)
    let creditsLeft: number | undefined;
    if (authUser.userId && creditCheck && !creditCheck.unlimited) {
      const consumeResult = await consumeCredit(authUser.userId, {
        feature: 'resume_generation',
        cost: RESUME_GENERATION_CREDIT_COST,
      });
      creditsLeft = consumeResult.remaining;
    } else if (creditCheck?.unlimited) {
      creditsLeft = Infinity;
    }

    return NextResponse.json({
      success: true,
      resume: aiResult.resume,
      savedResumeId: savedResume.id,
      keywordCoverage: aiResult.keywordCoverage,
      provider: aiResult.provider,
      aiGenerated: aiResult.aiGenerated,
      documentType: aiResult.documentType,
      outputLanguage: aiResult.outputLanguage,
      creditsLeft,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error generating AI resume:', errorMsg);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred while generating your resume. Please try again.' },
      { status: 500 }
    );
  }
}
