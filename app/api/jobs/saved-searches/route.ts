import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, validateCsrfOrigin } from '@/app/lib/auth';
import { applyRateLimit, parseBoundedJsonBody } from '@/lib/rate-limit';
import DataStore from '@/app/lib/datastore';

const MAX_BODY_BYTES = 16 * 1024;

const SavedSearchSchema = z.object({
  id: z.string().trim().max(120).optional(),
  name: z.string().trim().max(140).optional(),
  query: z.string().trim().min(1).max(120),
  location: z.string().trim().max(120).optional().default(''),
  country: z.string().trim().max(20).optional().default('eg'),
  remote: z.boolean().optional().default(false),
  employmentType: z
    .enum(['any', 'all', 'full-time', 'part-time', 'contract', 'internship'])
    .optional()
    .default('any'),
  datePosted: z.enum(['any', 'all', '24h', '7d', '30d']).optional().default('any'),
  seniority: z
    .enum(['junior', 'mid', 'senior', 'lead', 'any'])
    .optional()
    .default('any'),
  minSalary: z.number().min(0).max(10_000_000).nullable().optional(),
  maxSalary: z.number().min(0).max(10_000_000).nullable().optional(),
  source: z.string().trim().max(40).optional().default('all'),
  alertFrequency: z.enum(['none', 'daily', 'weekly']).optional().default('none'),
  alertEnabled: z.boolean().optional(),
});

const DeleteSavedSearchSchema = z.object({
  id: z.string().trim().min(1).max(120),
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
    { limit: 60, ipLimit: 120, windowMs: 60 * 1000, keyPrefix: 'jobs_saved_searches_get' },
    user.id
  );
  if (!rl.allowed && rl.errorResponse) return rl.errorResponse;

  const savedSearches = await DataStore.getUserSavedSearches(user.id);
  return NextResponse.json({
    success: true,
    savedSearches,
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
    { limit: 25, ipLimit: 50, windowMs: 60 * 1000, keyPrefix: 'jobs_saved_searches_post' },
    user.id
  );
  if (!rl.allowed && rl.errorResponse) return rl.errorResponse;

  const parsed = await parseBoundedJsonBody(req, MAX_BODY_BYTES);
  if (!parsed.ok) return parsed.errorResponse;

  const validated = SavedSearchSchema.safeParse(parsed.data);
  if (!validated.success) {
    return NextResponse.json(
      {
        error: 'INVALID_INPUT',
        message: 'Invalid saved search parameters.',
        details: validated.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const savedSearch = await DataStore.saveUserJobSearch(
    user.id,
    user.email,
    validated.data
  );

  return NextResponse.json({
    success: true,
    savedSearch,
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
    { limit: 30, ipLimit: 60, windowMs: 60 * 1000, keyPrefix: 'jobs_saved_searches_del' },
    user.id
  );
  if (!rl.allowed && rl.errorResponse) return rl.errorResponse;

  let searchId = req.nextUrl.searchParams.get('id') || '';
  if (!searchId) {
    const parsed = await parseBoundedJsonBody(req, 4096).catch(() => null);
    if (parsed && parsed.ok && parsed.data?.id) {
      searchId = String(parsed.data.id);
    }
  }

  const validated = DeleteSavedSearchSchema.safeParse({ id: searchId });
  if (!validated.success) {
    return NextResponse.json(
      { error: 'INVALID_INPUT', message: 'Valid saved search id is required.' },
      { status: 400 }
    );
  }

  const deleted = await DataStore.deleteUserSavedSearch(user.id, validated.data.id);
  return NextResponse.json({
    success: true,
    deleted,
  });
}

