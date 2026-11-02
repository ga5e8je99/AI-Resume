import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/lib/auth';
import { applyRateLimit } from '@/lib/rate-limit';
import { profileSuggestQuerySchema, suggestProfileItems } from '@/lib/profile';

const PROFILE_SUGGEST_RATE_LIMIT = {
  prefix: 'api_profile_suggest',
  limit: 60,
  windowMs: 60 * 1000,
};

export async function GET(req: NextRequest) {
  const authUser = getAuthenticatedUser(req);
  const rl = await applyRateLimit(req, PROFILE_SUGGEST_RATE_LIMIT, authUser?.userId);
  if (!rl.allowed) {
    return rl.errorResponse!;
  }

  const searchParams = req.nextUrl.searchParams;
  const rawQuery = {
    type: searchParams.get('type') ?? '',
    q: searchParams.get('q') ?? '',
    lang: searchParams.get('lang') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  };

  const parsed = profileSuggestQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'VALIDATION_ERROR',
        message:
          parsed.error.issues[0]?.message ||
          'Invalid query parameters. Expected type=role|skill.',
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 400, headers: rl.headers }
    );
  }

  const result = suggestProfileItems({
    type: parsed.data.type,
    query: parsed.data.q,
    lang: parsed.data.lang,
    limit: parsed.data.limit,
  });

  return NextResponse.json(
    {
      ok: true,
      ...result,
    },
    { status: 200, headers: rl.headers }
  );
}

