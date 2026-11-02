import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, validateCsrfOrigin } from '@/app/lib/auth';
import { applyRateLimit, parseBoundedJsonBody } from '@/lib/rate-limit';
import DataStore from '@/app/lib/datastore';

const MAX_BODY_BYTES = 8 * 1024;

const JobClickSchema = z.object({
  jobId: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(180),
  company: z.string().trim().min(1).max(140),
  source: z.string().trim().min(1).max(60),
  url: z.string().trim().url().max(600),
});

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
    { limit: 60, ipLimit: 120, windowMs: 60 * 1000, keyPrefix: 'jobs_click' },
    user.id
  );
  if (!rl.allowed && rl.errorResponse) return rl.errorResponse;

  const parsed = await parseBoundedJsonBody(req, MAX_BODY_BYTES);
  if (!parsed.ok) return parsed.errorResponse;

  const validated = JobClickSchema.safeParse(parsed.data);
  if (!validated.success) {
    return NextResponse.json(
      {
        error: 'INVALID_INPUT',
        message: 'Invalid job click payload.',
        details: validated.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const clickRecord = await DataStore.recordJobClick({
    userId: user.id,
    ...validated.data,
  });

  return NextResponse.json({
    success: true,
    click: clickRecord,
  });
}

