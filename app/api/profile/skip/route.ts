import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, validateCsrfOrigin } from '@/app/lib/auth';
import DataStore from '@/app/lib/datastore';
import { applyRateLimit } from '@/lib/rate-limit';
import { sanitizeProfileText } from '@/lib/profile';

const PROFILE_SKIP_RATE_LIMIT = {
  prefix: 'api_profile_skip',
  limit: 15,
  windowMs: 60 * 1000,
};

const skipPayloadSchema = z
  .object({
    reason: z
      .string()
      .max(120)
      .transform((v) => sanitizeProfileText(v, 120))
      .optional(),
  })
  .strict()
  .optional();

export async function POST(req: NextRequest) {
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

  const rl = await applyRateLimit(req, PROFILE_SKIP_RATE_LIMIT, user.id);
  if (!rl.allowed) {
    return rl.errorResponse!;
  }

  try {
    const rawText = await req.text();
    if (rawText.trim()) {
      const parsedJson = JSON.parse(rawText);
      const parsedBody = skipPayloadSchema.safeParse(parsedJson);
      if (!parsedBody.success) {
        return NextResponse.json(
          {
            ok: false,
            error: 'VALIDATION_ERROR',
            message: parsedBody.error.issues[0]?.message || 'Invalid skip payload.',
          },
          { status: 400, headers: rl.headers }
        );
      }
    }
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: 'INVALID_JSON',
        message: 'Invalid JSON request payload.',
      },
      { status: 400, headers: rl.headers }
    );
  }

  const profile = await DataStore.skipUserOnboarding(user.id);
  if (!profile) {
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
      skipped: true,
      profile,
    },
    { status: 200, headers: rl.headers }
  );
}

