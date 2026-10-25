/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, validateCsrfOrigin } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { CoverLetterService } from '@/app/lib/coverLetterService';
import { applyRateLimit } from '@/app/lib/rateLimit';

// GET /api/cover-letters - List all saved cover letters for the authenticated user with pagination and search
export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in to view your cover letters.' },
        { status: 401 }
      );
    }

    // Rate limiting: 100 requests per minute per user/IP
    const rateLimit = applyRateLimit(
      req,
      { limit: 100, windowMs: 60 * 1000, keyPrefix: 'cl_list' },
      authUser.userId
    );
    if (!rateLimit.allowed && rateLimit.errorResponse) {
      return rateLimit.errorResponse;
    }

    const { searchParams } = new URL(req.url);
    const rawPage = parseInt(searchParams.get('page') || '1', 10);
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10);
    const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
    const limit = isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 100);

    const statusParam = searchParams.get('status') || 'all';
    const validStatuses = ['all', 'draft', 'saved', 'archived'];
    const status = validStatuses.includes(statusParam) ? statusParam : 'all';

    const search = CoverLetterService.sanitizeText(searchParams.get('search') || '').slice(0, 100);
    const isArchivedParam = searchParams.get('isArchived');
    const isArchived = isArchivedParam !== null ? isArchivedParam === 'true' : undefined;
    const summary = searchParams.get('summary') === 'true';

    const result = await DataStore.getUserCoverLetters(authUser.userId, {
      page,
      limit,
      status,
      search,
      isArchived,
      summaryOnly: summary,
    });

    return NextResponse.json(
      {
        success: true,
        coverLetters: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      },
      { headers: rateLimit.headers }
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error fetching cover letters:', errorMsg);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cover letters' },
      { status: 500 }
    );
  }
}

// POST /api/cover-letters - Save a new cover letter draft or document
export async function POST(req: NextRequest) {
  try {
    // 1. CSRF Origin Verification
    if (!validateCsrfOrigin(req)) {
      return NextResponse.json(
        { success: false, error: 'Cross-origin request blocked (CSRF protection)' },
        { status: 403 }
      );
    }

    // 2. Authentication Verification
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in to save your cover letter.' },
        { status: 401 }
      );
    }

    // 3. Rate limiting: 60 saves per minute per user
    const rateLimit = applyRateLimit(
      req,
      { limit: 60, windowMs: 60 * 1000, keyPrefix: 'cl_save' },
      authUser.userId
    );
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

    // 3. Input Validation
    const validation = CoverLetterService.validateSavePayload(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // 4. IDOR Protection: Verify ownership of linkedResumeId if provided
    let verifiedResumeId: string | undefined = undefined;
    if (body.linkedResumeId && typeof body.linkedResumeId === 'string') {
      const cleanResumeId = body.linkedResumeId.trim();
      if (cleanResumeId) {
        const resume = await DataStore.getResumeById(cleanResumeId);
        if (resume) {
          if (resume.userId && resume.userId !== authUser.userId) {
            return NextResponse.json(
              {
                success: false,
                error: 'غير مصرح لك بربط هذه السيرة الذاتية (Access denied: resume does not belong to you)',
              },
              { status: 403 }
            );
          }
          verifiedResumeId = cleanResumeId;
        }
      }
    }

    const companyName = (body.recipient?.companyName || body.companyName || '').trim().slice(0, 120);
    const jobTitle = (body.recipient?.jobTitle || body.jobTitle || '').trim().slice(0, 120);
    const defaultTitle = body.title?.trim() || (companyName ? `Cover Letter - ${companyName}` : 'My Cover Letter');

    const newCoverLetter = await DataStore.createUserCoverLetter(authUser.userId, {
      title: defaultTitle.slice(0, 150),
      companyName,
      jobTitle,
      jobDescription: (body.jobDescription || '').slice(0, 30000),
      extractedKeywords: Array.isArray(body.extractedKeywords) ? body.extractedKeywords.slice(0, 20) : [],
      tone: body.tone || 'formal',
      language: body.language || 'ar',
      status: body.status || 'saved',
      isArchived: Boolean(body.isArchived || false),
      sender: body.sender || {},
      recipient: body.recipient || {},
      content: body.content || {},
      templateId: body.templateId || 'compact',
      linkedResumeId: verifiedResumeId,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Cover letter saved successfully',
        coverLetter: newCoverLetter,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error saving cover letter:', errorMsg);
    return NextResponse.json(
      { success: false, error: 'Failed to save cover letter' },
      { status: 500 }
    );
  }
}
