import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';

export async function GET(req: NextRequest) {
  try {
    const auth = verifyAdmin(req);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.reason || 'Admin access required' }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim() || '';

    const analyses = await DataStore.getAnalyses(query);
    return NextResponse.json({ analyses, count: analyses.length });
  } catch (error: any) {
    console.error('Admin analyses error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch analyses' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = verifyAdmin(req);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.reason || 'Admin access required' }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const analysisId = searchParams.get('id');

    if (!analysisId) {
      return NextResponse.json({ error: 'Analysis id is required' }, { status: 400 });
    }

    await DataStore.deleteAnalysis(analysisId);
    return NextResponse.json({ message: 'Analysis deleted successfully' });
  } catch (error: any) {
    console.error('Delete analysis error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete analysis' }, { status: 500 });
  }
}
