import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { applyRateLimit } from '@/lib/rate-limit';
import { APPLICATION_STATUSES, type ApplicationStatus } from '@/lib/hr';
import { generateApplicantsCsv } from '@/lib/hr/moderation';

const APPLICANTS_RL = {
  keyPrefix: 'api_employer_job_applicants',
  limit: 45,
  ipLimit: 90,
  windowMs: 60 * 1000,
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  const { user, errorResponse } = requireAuth(req);
  if (errorResponse || !user) return errorResponse!;

  const rl = await applyRateLimit(req, APPLICANTS_RL, user.id);
  if (!rl.allowed) return rl.errorResponse!;

  const { jobId } = await context.params;
  const cleanJobId = (jobId || '').trim();
  const job = await DataStore.getEmployerJobById(cleanJobId);

  if (!job) {
    return NextResponse.json(
      { ok: false, error: 'JOB_NOT_FOUND', message: 'Job posting not found.' },
      { status: 404, headers: rl.headers }
    );
  }

  // Strict ownership check (IDOR protection)
  const isMember = await DataStore.isOrganizationMember(job.orgId, user.id);
  if (!isMember) {
    return NextResponse.json(
      {
        ok: false,
        error: 'FORBIDDEN',
        message: 'You are not a member of the organization that owns this job.',
      },
      { status: 403, headers: rl.headers }
    );
  }

  const sp = req.nextUrl.searchParams;
  const rawStatus = sp.get('status')?.trim() || 'all';
  const statusFilter: ApplicationStatus | 'all' = (
    APPLICATION_STATUSES as readonly string[]
  ).includes(rawStatus)
    ? (rawStatus as ApplicationStatus)
    : 'all';

  const rawSortBy = sp.get('sortBy')?.trim() || 'date';
  const sortBy: 'score' | 'date' | 'status' =
    rawSortBy === 'score' || rawSortBy === 'status' ? rawSortBy : 'date';
  const sortOrder: 'asc' | 'desc' = sp.get('sortOrder')?.trim() === 'asc' ? 'asc' : 'desc';

  const applicants = await DataStore.getJobApplicantsForHr(cleanJobId, job.orgId, user.id, {
    status: statusFilter,
    sortBy,
    sortOrder,
  });

  if (sp.get('format') === 'csv') {
    const csvContent = generateApplicantsCsv(
      applicants.map((a) => ({
        applicationId: a.id,
        candidateName: a.candidateName,
        candidateEmail: a.candidateEmail,
        candidatePhone: a.candidatePhone || '',
        status: a.status,
        score: a.computedScore,
        matchedSkills: a.analysis?.matchedSkills || [],
        missingSkills: a.analysis?.missingSkills || [],
        appliedAt: a.createdAt,
        answers: a.answers || [],
        notes: a.notes || '',
      }))
    );

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        ...rl.headers,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="applicants-${job.slug || cleanJobId}.csv"`,
      },
    });
  }

  return NextResponse.json(
    {
      ok: true,
      job,
      applicants,
      count: applicants.length,
    },
    { status: 200, headers: rl.headers }
  );
}

