import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, validateCsrfOrigin } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { applyRateLimit, parseBoundedJsonBody } from '@/lib/rate-limit';
import { profileUpdateSchema } from '@/lib/profile';

const PROFILE_GET_RATE_LIMIT = {
  prefix: 'api_profile_get',
  limit: 60,
  windowMs: 60 * 1000,
};

const PROFILE_PUT_RATE_LIMIT = {
  prefix: 'api_profile_put',
  limit: 20,
  windowMs: 60 * 1000,
};

export async function GET(req: NextRequest) {
  const { user, errorResponse } = requireAuth(req);
  if (errorResponse || !user) {
    return errorResponse!;
  }

  const rl = await applyRateLimit(req, PROFILE_GET_RATE_LIMIT, user.id);
  if (!rl.allowed) {
    return rl.errorResponse!;
  }

  const requestedUserId = req.nextUrl.searchParams.get('userId')?.trim() || user.id;
  const profile = await DataStore.getUserProfile(requestedUserId, user.id);

  if (!profile) {
    return NextResponse.json(
      { ok: false, error: 'PROFILE_NOT_FOUND', message: 'User profile not found.' },
      { status: 404, headers: rl.headers }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      profile,
    },
    { status: 200, headers: rl.headers }
  );
}

export async function PUT(req: NextRequest) {
  if (!validateCsrfOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: 'CSRF_ORIGIN_MISMATCH', message: 'Invalid request origin.' },
      { status: 403 }
    );
  }

  const { user, errorResponse } = requireAuth(req);
  if (errorResponse || !user) {
    return errorResponse!;
  }

  const rl = await applyRateLimit(req, PROFILE_PUT_RATE_LIMIT, user.id);
  if (!rl.allowed) {
    return rl.errorResponse!;
  }

  const bodyResult = await parseBoundedJsonBody<Record<string, unknown>>(req, 350 * 1024);
  if (!bodyResult.ok) {
    return bodyResult.errorResponse;
  }

  const rawPayload = { ...(bodyResult.data || {}) };

  // Ownership check: prevent updating another user's profile
  if (
    typeof rawPayload.userId === 'string' &&
    rawPayload.userId.trim() !== '' &&
    rawPayload.userId.trim() !== user.id
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: 'FORBIDDEN',
        message: 'You can only update your own profile.',
      },
      { status: 403, headers: rl.headers }
    );
  }
  delete rawPayload.userId;

  const parsed = profileUpdateSchema.safeParse(rawPayload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'VALIDATION_ERROR',
        message: parsed.error.issues[0]?.message || 'Invalid profile data.',
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 400, headers: rl.headers }
    );
  }

  const updatedProfile = await DataStore.updateUserProfile(user.id, parsed.data);
  if (!updatedProfile) {
    return NextResponse.json(
      {
        ok: false,
        error: 'PROFILE_NOT_FOUND',
        message: 'User account not found.',
      },
      { status: 404, headers: rl.headers }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      profile: updatedProfile,
    },
    { status: 200, headers: rl.headers }
  );
}

