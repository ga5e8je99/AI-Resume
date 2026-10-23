import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';

// GET /api/analyses - List all saved ATS analyses for user
export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const analyses = await DataStore.getUserAnalyses(authUser.userId);
    return NextResponse.json({ analyses });
  } catch (error: any) {
    console.error('Error fetching analyses:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch analyses' },
      { status: 500 }
    );
  }
}

// POST /api/analyses - Save a new ATS analysis
export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to save analysis.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      resumeFileName,
      targetRole,
      targetJobDescription,
      overallScore,
      grade,
      rankPercentile,
      matchLabel,
      subScores,
      result,
    } = body;

    if (overallScore === undefined || !result) {
      return NextResponse.json(
        { error: 'Missing analysis result data' },
        { status: 400 }
      );
    }

    const newAnalysis = await DataStore.createUserAnalysis(authUser.userId, {
      resumeFileName: resumeFileName || 'Uploaded_Resume.pdf',
      targetRole: targetRole || 'General Role',
      targetJobDescription: targetJobDescription || '',
      overallScore,
      grade: grade || 'B',
      rankPercentile: rankPercentile || 'Top 25%',
      matchLabel: matchLabel || 'Good Match',
      subScores: subScores || result.subScores,
      result,
    });

    return NextResponse.json(
      {
        message: 'Analysis saved successfully',
        analysis: newAnalysis,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error saving analysis:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save analysis' },
      { status: 500 }
    );
  }
}
