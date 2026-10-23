import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/analyses/[id] - Get single full analysis result
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analyses = await DataStore.getUserAnalyses(authUser.userId);
    const analysis = analyses.find((a: any) => a.id === id);

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    return NextResponse.json({ analysis });
  } catch (error: any) {
    console.error('Error fetching analysis:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
}

// DELETE /api/analyses/[id] - Delete a saved analysis
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const authUser = getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await DataStore.deleteUserAnalysis(id, authUser.userId);

    return NextResponse.json({
      message: 'Analysis deleted successfully',
      id,
    });
  } catch (error: any) {
    console.error('Error deleting analysis:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete analysis' },
      { status: 500 }
    );
  }
}
