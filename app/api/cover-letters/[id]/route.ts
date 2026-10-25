/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, validateCsrfOrigin } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';

interface Params {
  params: Promise<{ id: string }>;
}

function isValidId(id: string): boolean {
  return typeof id === 'string' && id.trim().length > 0 && id.length <= 64 && /^[\w-]+$/.test(id);
}

// GET /api/cover-letters/[id] - Get specific cover letter (strictly verifies ownership)
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json(
        { success: false, error: 'معرّف الخطاب غير صالح (Invalid cover letter ID format)' },
        { status: 400 }
      );
    }

    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // IDOR Protection: Query strictly scopes to authUser.userId
    const coverLetter = await DataStore.getUserCoverLetterById(id, authUser.userId);
    if (!coverLetter) {
      return NextResponse.json(
        { success: false, error: 'Cover letter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, coverLetter });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error fetching cover letter:', errorMsg);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cover letter' },
      { status: 500 }
    );
  }
}

// PATCH /api/cover-letters/[id] - Partial update
export async function PATCH(req: NextRequest, { params }: Params) {
  return handleUpdate(req, params);
}

// PUT /api/cover-letters/[id] - Update existing cover letter
export async function PUT(req: NextRequest, { params }: Params) {
  return handleUpdate(req, params);
}

async function handleUpdate(req: NextRequest, paramsPromise: Promise<{ id: string }>) {
  try {
    // 1. CSRF Protection
    if (!validateCsrfOrigin(req)) {
      return NextResponse.json(
        { success: false, error: 'Cross-origin request blocked (CSRF protection)' },
        { status: 403 }
      );
    }

    const { id } = await paramsPromise;
    if (!isValidId(id)) {
      return NextResponse.json(
        { success: false, error: 'معرّف الخطاب غير صالح (Invalid cover letter ID format)' },
        { status: 400 }
      );
    }

    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
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

    // 2. Validate update fields if present
    if (body.title && typeof body.title === 'string' && body.title.length > 150) {
      return NextResponse.json(
        { success: false, error: 'العنوان لا يمكن أن يتجاوز 150 حرفاً' },
        { status: 400 }
      );
    }
    if (body.companyName && typeof body.companyName === 'string' && body.companyName.length > 120) {
      return NextResponse.json(
        { success: false, error: 'اسم الشركة لا يمكن أن يتجاوز 120 حرفاً' },
        { status: 400 }
      );
    }
    if (body.status && !['draft', 'saved', 'archived'].includes(body.status)) {
      return NextResponse.json(
        { success: false, error: 'حالة الخطاب غير صالحة (status must be draft, saved, or archived)' },
        { status: 400 }
      );
    }
    if (body.tone && !['formal', 'technical', 'leadership', 'enthusiastic'].includes(body.tone)) {
      return NextResponse.json(
        { success: false, error: 'نبرة الخطاب غير صالحة' },
        { status: 400 }
      );
    }
    if (body.language && !['ar', 'en'].includes(body.language)) {
      return NextResponse.json(
        { success: false, error: 'اللغة المحددة غير صالحة' },
        { status: 400 }
      );
    }

    // 3. IDOR Protection: Verify ownership of linkedResumeId if updated
    if (body.linkedResumeId !== undefined) {
      if (body.linkedResumeId && typeof body.linkedResumeId === 'string') {
        const cleanResumeId = body.linkedResumeId.trim();
        const resume = await DataStore.getResumeById(cleanResumeId);
        if (resume && resume.userId && resume.userId !== authUser.userId) {
          return NextResponse.json(
            { success: false, error: 'غير مصرح لك بربط هذه السيرة الذاتية (Access denied to the specified resume)' },
            { status: 403 }
          );
        }
      }
    }

    // 4. Update strictly scoped to authUser.userId
    const updated = await DataStore.updateUserCoverLetter(id, authUser.userId, body);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Cover letter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cover letter updated successfully',
      coverLetter: updated,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error updating cover letter:', errorMsg);
    return NextResponse.json(
      { success: false, error: 'Failed to update cover letter' },
      { status: 500 }
    );
  }
}

// DELETE /api/cover-letters/[id] - Delete specific cover letter (strictly verifies ownership)
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    // 1. CSRF Protection
    if (!validateCsrfOrigin(req)) {
      return NextResponse.json(
        { success: false, error: 'Cross-origin request blocked (CSRF protection)' },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json(
        { success: false, error: 'معرّف الخطاب غير صالح (Invalid cover letter ID format)' },
        { status: 400 }
      );
    }

    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // 2. IDOR Protection: Delete is strictly bounded to authUser.userId
    const deleted = await DataStore.deleteUserCoverLetter(id, authUser.userId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Cover letter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cover letter deleted successfully',
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error deleting cover letter:', errorMsg);
    return NextResponse.json(
      { success: false, error: 'Failed to delete cover letter' },
      { status: 500 }
    );
  }
}
