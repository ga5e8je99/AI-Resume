/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { CoverLetterService } from '@/app/lib/coverLetterService';
import { applyRateLimit } from '@/app/lib/rateLimit';

// POST /api/cover-letter/extract-keywords - Extract keywords and detect language from text or job URL
export async function POST(req: NextRequest) {
  try {
    // Rate Limiting: 60 requests per minute per IP
    const rateLimit = applyRateLimit(req, { limit: 60, windowMs: 60 * 1000, keyPrefix: 'kw_extract' });
    if (!rateLimit.allowed && rateLimit.errorResponse) {
      return rateLimit.errorResponse;
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request payload' },
        { status: 400 }
      );
    }

    let text = (body?.text || body?.jobDescription || '').trim();
    const jobUrl = (body?.url || body?.jobUrl || '').trim();

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
