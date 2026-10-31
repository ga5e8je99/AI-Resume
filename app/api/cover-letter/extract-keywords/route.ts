import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/lib/auth';
import { CoverLetterService } from '@/app/lib/coverLetterService';
import {
  applyRateLimit,
  parseBoundedJsonBody,
  DEFAULT_MAX_AI_BODY_BYTES,
  DEFAULT_MAX_AI_INPUT_CHARS,
} from '@/lib/rate-limit';

// POST /api/cover-letter/extract-keywords - Extract keywords and detect language from text or job URL
export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthenticatedUser(req);

    // Rate Limiting: 60 requests per minute per user + per IP
    const rateLimit = await applyRateLimit(
      req,
      { limit: 60, ipLimit: 120, windowMs: 60 * 1000, keyPrefix: 'kw_extract' },
      authUser?.userId
    );
    if (!rateLimit.allowed && rateLimit.errorResponse) {
      return rateLimit.errorResponse;
    }

    const parsed = await parseBoundedJsonBody(req, DEFAULT_MAX_AI_BODY_BYTES);
    if (!parsed.ok) {
      return parsed.errorResponse;
    }
    const body = parsed.data;

    let text = typeof (body?.text ?? body?.jobDescription) === 'string'
      ? (body?.text || body?.jobDescription || '').trim()
      : '';
    const jobUrl = typeof (body?.url ?? body?.jobUrl) === 'string'
      ? (body?.url || body?.jobUrl || '').trim()
      : '';

    if (text.length > DEFAULT_MAX_AI_INPUT_CHARS) {
      return NextResponse.json(
        {
          success: false,
          error: 'INPUT_TOO_LONG',
          message: `Input text exceeds maximum allowed length of ${DEFAULT_MAX_AI_INPUT_CHARS} characters.`,
        },
        { status: 400 }
      );
    }

    if (jobUrl.length > 2048) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_URL',
          message: 'Job URL exceeds maximum allowed length of 2,048 characters.',
        },
        { status: 400 }
      );
    }

    if (!text && !jobUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'يرجى تقديم النص أو رابط الوظيفة لاستخراج الكلمات المفتاحية (Text or job URL is required)',
        },
        { status: 400 }
      );
    }

    if (!text && jobUrl) {
      try {
        text = await CoverLetterService.fetchJobDescriptionFromUrl(jobUrl);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'تعذر استخراج المحتوى من الرابط';
        return NextResponse.json(
          {
            success: false,
            error: msg,
          },
          { status: 422 }
        );
      }
    }

    if (text.length > 40000) {
      text = text.slice(0, 40000);
    }

    const limit = Math.min(25, Math.max(3, Number(body?.limit) || 10));
    const keywords = CoverLetterService.extractKeywords(text, limit);
    const detectedLanguage = CoverLetterService.detectLanguage(text);

    return NextResponse.json({
      success: true,
      keywords,
      count: keywords.length,
      detectedLanguage,
      snippet: text.slice(0, 200),
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error extracting keywords:', errorMsg);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء استخراج الكلمات المفتاحية' },
      { status: 500 }
    );
  }
}
