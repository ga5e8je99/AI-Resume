import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';

// GET /api/resumes - List all resumes for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to view your resumes.' },
        { status: 401 }
      );
    }

    const resumes = await DataStore.getUserResumes(authUser.userId);
    return NextResponse.json({ resumes });
  } catch (error: any) {
    console.error('Error fetching resumes:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch resumes' },
      { status: 500 }
    );
  }
}

// POST /api/resumes - Create a new resume
export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to save your resume.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, templateId, theme, data } = body;

    if (!data) {
      return NextResponse.json(
        { error: 'Resume data is required' },
        { status: 400 }
      );
    }

    const resumeTitle =
      title ||
      (data.personalInfo?.fullName
        ? `${data.personalInfo.fullName} - Resume`
        : 'My Professional Resume');

    const newResume = await DataStore.createUserResume(authUser.userId, {
      title: resumeTitle,
      templateId: templateId || 'compact',
      theme: theme || {
        accentColor: '#2563eb',
        fontFamily: 'var(--font-sans), sans-serif',
        fontSize: 'base',
      },
      data,
    });

    return NextResponse.json(
      {
        message: 'Resume saved successfully',
        resume: newResume,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating resume:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save resume' },
      { status: 500 }
    );
  }
}
