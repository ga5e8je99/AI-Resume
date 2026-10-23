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
    const templateFilter = searchParams.get('template')?.trim() || '';

    const resumes = await DataStore.getResumes(query, templateFilter);
    return NextResponse.json({ resumes, count: resumes.length });
  } catch (error: any) {
    console.error('Admin resumes error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch resumes' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = verifyAdmin(req);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.reason || 'Admin access required' }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const resumeId = searchParams.get('id');

    if (!resumeId) {
      return NextResponse.json({ error: 'Resume id is required' }, { status: 400 });
    }

    await DataStore.deleteResume(resumeId);
    return NextResponse.json({ message: 'Resume deleted successfully' });
  } catch (error: any) {
    console.error('Delete resume error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete resume' }, { status: 500 });
  }
}
