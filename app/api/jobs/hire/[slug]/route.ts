import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/app/lib/datastore';
import { applyRateLimit } from '@/app/lib/rateLimit';
import { getAuthenticatedUser } from '@/app/lib/auth';
import { buildJobPostingJsonLd } from '@/lib/hr/applyValidation';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const rl = await applyRateLimit(request, {
      limit: 60,
      windowMs: 60 * 1000,
      keyPrefix: 'hire_job_get',
    });
    if (!rl.allowed) return rl.errorResponse!;

    const { slug } = await context.params;
    const cleanSlug = String(slug || '').trim().toLowerCase();
    if (!cleanSlug) {
      return NextResponse.json({ ok: false, error: 'INVALID_SLUG' }, { status: 400 });
    }

    const job = await DataStore.getEmployerJobBySlug(cleanSlug);
    if (!job) {
      return NextResponse.json({ ok: false, error: 'JOB_NOT_FOUND' }, { status: 404 });
    }

    const org = await DataStore.getOrganizationById(job.orgId);
    if (!org) {
      return NextResponse.json({ ok: false, error: 'ORG_NOT_FOUND' }, { status: 404 });
    }

    const authUser = getAuthenticatedUser(request);
    const isMemberOrAdmin =
      authUser &&
      (authUser.role === 'admin' ||
        (await DataStore.isOrganizationMember(org.id, authUser.userId)));

    if (job.status !== 'published' && !isMemberOrAdmin) {
      return NextResponse.json({ ok: false, error: 'JOB_NOT_AVAILABLE' }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jobmatch.ai';
    const jsonLd = buildJobPostingJsonLd(job, org, baseUrl);

    let alreadyApplied = false;
    if (authUser?.userId) {
      const existingApps = await DataStore.listCandidateApplications(authUser.userId);
      alreadyApplied = existingApps.some((a) => a.jobId === job.id);
    }

    return NextResponse.json({
      ok: true,
      job: {
        id: job.id,
        slug: job.slug,
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        skills: job.skills,
        location: job.location,
        remote: job.remote,
        employmentType: job.employmentType,
        seniority: job.seniority,
        salary: job.salary?.visible ? job.salary : undefined,
        screeningQuestions: (job.screeningQuestions || []).map((q, idx) =>
          typeof q === 'string'
            ? { id: `q_${idx}`, question: q, required: false }
            : q
        ),
        status: job.status,
        publishedAt: job.publishedAt,
        expiresAt: job.expiresAt,
      },
      organization: {
        id: org.id,
        name: org.name,
        website: org.website,
        logo: org.logo,
        industry: org.industry,
        size: org.size,
        country: org.country,
        verified: Boolean(org.verified),
      },
      jsonLd,
      alreadyApplied,
    });
  } catch (err) {
    console.error('[GET /api/jobs/hire/[slug]] Error:', err);
    return NextResponse.json({ ok: false, error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
