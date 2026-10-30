import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/resumes/[id] - Get resume details by ID
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resume = await DataStore.getResumeById(id);
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    if (resume.userId && resume.userId !== authUser.userId && authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to view this resume.' }, { status: 403 });
    }

    return NextResponse.json({ resume });
  } catch (error: any) {
    console.error('Error fetching resume:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch resume' },
      { status: 500 }
    );
  }
}

// PUT /api/resumes/[id] - Update an existing resume
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, templateId, theme, data } = body;

    const updated = await DataStore.updateUserResume(id, authUser.userId, {
      title,
      templateId,
      theme,
      data,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Resume updated successfully',
      resume: updated,
    });
  } catch (error: any) {
    console.error('Error updating resume:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update resume' },
      { status: 500 }
    );
  }
}

// DELETE /api/resumes/[id] - Delete a resume
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await DataStore.deleteUserResume(id, authUser.userId);

    return NextResponse.json({
      message: 'Resume deleted successfully',
      id,
    });
  } catch (error: any) {
    console.error('Error deleting resume:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete resume' },
      { status: 500 }
    );
  }
}
