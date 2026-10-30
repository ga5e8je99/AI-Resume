import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { extractProfileFromResumeData, extractProfileFromText } from '@/lib/jobs/extractor';

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthenticatedUser(req);
    // Profile extraction can be called by logged-in users or during exploration
    const body = await req.json().catch(() => ({}));
    const { resumeId, text, resumeData } = body;

    let profile = null;

    if (resumeId) {
      const resume = await DataStore.getResumeById(resumeId);
      if (resume && resume.data) {
        profile = extractProfileFromResumeData(resume.data);
      }
    }

    if (!profile && resumeData) {
      profile = extractProfileFromResumeData(resumeData);
    }

    if (!profile && text && typeof text === 'string') {
      profile = extractProfileFromText(text);
    }

    if (!profile) {
      // Default fallback profile
      profile = extractProfileFromResumeData({
        personalInfo: { jobTitle: 'Software Engineer', location: 'Cairo, Egypt' },
        skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'SQL', 'Git'],
        experience: [{ title: 'Software Engineer' }],
      });
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error('Error extracting profile for job match:', error);
    return NextResponse.json(
      { error: 'EXTRACT_FAILED', message: error?.message || 'Failed to extract profile' },
      { status: 500 }
    );
  }
}
