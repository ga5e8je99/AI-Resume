import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, validateCsrfOrigin } from '@/app/lib/auth';
import { applyRateLimit, parseBoundedJsonBody } from '@/lib/rate-limit';
import DataStore from '@/app/lib/datastore';

const MAX_BODY_BYTES = 24 * 1024;

const SaveJobSchema = z.object({
  job: z.object({
    id: z.string().trim().min(1).max(120),
    title: z.string().trim().min(1).max(180),
    company: z.string().trim().min(1).max(140),
    location: z.string().trim().max(140).optional().default('Global'),
    remote: z.boolean().optional().default(false),
    description: z.string().max(2500).optional().default(''),
    url: z.string().trim().url().max(600),
    source: z.string().trim().min(1).max(60),
    sourceBadge: z.string().trim().max(60).optional(),
    postedDate: z.string().trim().max(40).optional(),
    salary: z.string().trim().max(80).optional(),
    jobType: z.string().trim().max(60).optional(),
    tags: z.array(z.string().max(40)).max(15).optional(),
    matchScore: z.number().min(0).max(100).optional(),
  }),
  notes: z.string().trim().max(400).optional(),
});

const DeleteSavedJobSchema = z.object({
  jobId: z.string().trim().min(1).max(120),
});

export async function GET(req: NextRequest) {
  const { user, errorResponse } = requireAuth(req);
  if (!user || errorResponse) {
    return (
      errorResponse ||
      NextResponse.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 })
    );
  }

  const rl = await applyRateLimit(
    req,
    { limit: 60, ipLimit: 120, windowMs: 60 * 1000, keyPrefix: 'jobs_saved_get' },
    user.id
  );
  if (!rl.allowed && rl.errorResponse) return rl.errorResponse;

  const savedJobs = await DataStore.getUserSavedJobs(user.id);
  return NextResponse.json({
    success: true,
    savedJobs,
  });
}

export async function POST(req: NextRequest) {
  if (!validateCsrfOrigin(req)) {
    return NextResponse.json({ error: 'CSRF_REJECTED', message: 'Invalid request origin' }, { status: 403 });
  }

  const { user, errorResponse } = requireAuth(req);
  if (!user || errorResponse) {
    return (
      errorResponse ||
      NextResponse.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 })
    );
  }

  const rl = await applyRateLimit(
    req,
    { limit: 30, ipLimit: 60, windowMs: 60 * 1000, keyPrefix: 'jobs_saved_post' },
    user.id
  );
  if (!rl.allowed && rl.errorResponse) return rl.errorResponse;

  const parsed = await parseBoundedJsonBody(req, MAX_BODY_BYTES);
  if (!parsed.ok) return parsed.errorResponse;

  const validated = SaveJobSchema.safeParse(parsed.data);
  if (!validated.success) {
    return NextResponse.json(
      {
        error: 'INVALID_INPUT',
        message: 'Invalid job payload.',
        details: validated.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const savedItem = await DataStore.saveUserJob(
    user.id,
    validated.data.job,
    validated.data.notes
  );

  return NextResponse.json({
    success: true,
    savedJob: savedItem,
  });
}

export async function DELETE(req: NextRequest) {
  if (!validateCsrfOrigin(req)) {
    return NextResponse.json({ error: 'CSRF_REJECTED', message: 'Invalid request origin' }, { status: 403 });
  }

  const { user, errorResponse } = requireAuth(req);
  if (!user || errorResponse) {
    return (
      errorResponse ||
      NextResponse.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 })
    );
  }

  const rl = await applyRateLimit(
    req,
    { limit: 30, ipLimit: 60, windowMs: 60 * 1000, keyPrefix: 'jobs_saved_del' },
    user.id
  );
  if (!rl.allowed && rl.errorResponse) return rl.errorResponse;

  let jobId = req.nextUrl.searchParams.get('jobId') || '';
  if (!jobId) {
    const parsed = await parseBoundedJsonBody(req, 4096).catch(() => null);
    if (parsed && parsed.ok && parsed.data?.jobId) {
      jobId = String(parsed.data.jobId);
    }
  }

  const validated = DeleteSavedJobSchema.safeParse({ jobId });
  if (!validated.success) {
    return NextResponse.json(
      { error: 'INVALID_INPUT', message: 'Valid jobId is required.' },
      { status: 400 }
    );
  }

  const removed = await DataStore.removeUserSavedJob(user.id, validated.data.jobId);
  return NextResponse.json({
    success: true,
    removed,
  });
}

