import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { requireAuth } from '@/app/lib/auth';
import { requireCredits, consumeCredit, refundCredit, CreditConsumeResult } from '@/lib/credit-guard';
import { applyRateLimit, parseBoundedJsonBody } from '@/lib/rate-limit';
import { searchAllProviders, ALL_PROVIDERS } from '@/lib/jobs/providers';
import { rankJobs } from '@/lib/jobs/matcher';
import { generateSmartLinks } from '@/lib/jobs/smart-links';
import { getCachedJobResults, setCachedJobResults, JobCacheKeyParams } from '@/lib/jobs/cache';
import { JobSearchParams, ProviderStatusEntry } from '@/lib/jobs/types';
import { JOB_MATCH_FREE_QUOTA } from '@/lib/plans';
import DataStore from '@/app/lib/datastore';

export const maxDuration = 60;
const MAX_JOB_SEARCH_BODY_BYTES = 50 * 1024; // 50KB max request payload

export async function POST(req: NextRequest) {
  let userId = '';
  let consumed: CreditConsumeResult | null = null;

  try {
    // 1. Authentication & Identification
    const { user, errorResponse } = requireAuth(req);
    if (!user || errorResponse) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Please sign in or create a free account to search matching jobs.',
          loginUrl: '/login?returnUrl=/jobs',
        },
        { status: 401 }
      );
    }

    userId = user.id;

    // 2. Rate Limiting per user + per IP (with Retry-After header on 429)
    const rateLimit = await applyRateLimit(
      req,
      { limit: 40, ipLimit: 80, windowMs: 60 * 1000, keyPrefix: 'job_search' },
      userId
    );
    if (!rateLimit.allowed && rateLimit.errorResponse) {
      return rateLimit.errorResponse;
    }

    // 3. Quota & Credit Check (returns 401 if user not in DB, 402 if out of credits)
    const creditCheck = await requireCredits(userId, req, { feature: 'job_match' });
    if (!creditCheck.allowed && creditCheck.errorResponse) {
      return creditCheck.errorResponse;
    }

    // 4. Request Payload Size & Input Length Validation
    const parsed = await parseBoundedJsonBody(req, MAX_JOB_SEARCH_BODY_BYTES);
    if (!parsed.ok) {
      return parsed.errorResponse;
    }
    const body = parsed.data;

    if (typeof body.query === 'string' && body.query.trim().length > 150) {
      return NextResponse.json(
        { error: 'INPUT_TOO_LONG', message: 'Search query cannot exceed 150 characters.' },
        { status: 400 }
      );
    }
    if (typeof body.location === 'string' && body.location.trim().length > 120) {
      return NextResponse.json(
        { error: 'INPUT_TOO_LONG', message: 'Location cannot exceed 120 characters.' },
        { status: 400 }
      );
    }

    const query = typeof body.query === 'string' ? body.query.trim().slice(0, 100) : '';
    const location = typeof body.location === 'string' ? body.location.trim().slice(0, 80) : '';
    const remote = Boolean(body.remote);
    const country = typeof body.country === 'string' ? body.country.trim().slice(0, 10) : 'eg';
    const skills = Array.isArray(body.skills)
      ? body.skills
          .filter((s: any) => typeof s === 'string')
          .map((s: string) => s.trim().slice(0, 40))
          .slice(0, 20)
      : [];
    const seniority = ['junior', 'mid', 'senior', 'lead', 'any'].includes(body.seniority)
      ? body.seniority
      : 'any';

    if (!query) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'Target job title or search query is required.' },
        { status: 400 }
      );
    }

    const cacheKeyParams: JobCacheKeyParams = {
      query,
      location,
      remote,
      country,
    };

    const userMatchParams: JobSearchParams = {
      query,
      location,
      remote,
      country,
      skills,
      seniority,
      page: typeof body.page === 'number' ? body.page : 1,
    };

    // 5. Smart search links for the 10 platforms (always fresh)
    const smartLinks = generateSmartLinks(cacheKeyParams);

    // 6. Check 6-Hour Raw Jobs Cache (keyed strictly by { query, location, remote, country })
    const cachedRawData = await getCachedJobResults(cacheKeyParams);
    let rawSearchResult: {
      jobs: any[];
      totalFound: number;
      attributions: any[];
      sourcesQueried?: string[];
      providerStatus?: ProviderStatusEntry[];
    };
    let isFromCache = false;

    if (cachedRawData && Array.isArray(cachedRawData.jobs)) {
      rawSearchResult = cachedRawData;
      isFromCache = true;
    } else {
      // 7. Parallel search across official and open API providers (with 8s timeout per provider)
      const federated = await searchAllProviders(cacheKeyParams);

      // Requirement 2 & 4: If ALL active providers failed -> return 502 with clear message and DO NOT deduct credit
      if (federated.allFailed) {
        return NextResponse.json(
          {
            error: 'ALL_PROVIDERS_FAILED',
            message:
              'All external job sources are temporarily unavailable. Please try again in a moment.',
            providerStatus: federated.providerStatus,
            smartLinks,
            charged: false,
          },
          { status: 502 }
        );
      }

      rawSearchResult = federated;

      // Save strictly raw jobs to cache with 6-hour TTL
      await setCachedJobResults(cacheKeyParams, rawSearchResult);
    }

    const providerStatus: ProviderStatusEntry[] = Array.isArray(rawSearchResult.providerStatus)
      ? rawSearchResult.providerStatus
      : ALL_PROVIDERS.map((p) => ({
          provider: p.name,
          status: p.isEnabled() ? 'ok' : 'skipped',
          count: 0,
          tookMs: 0,
        }));

    // 8. Run matcher per user (after cache hit OR miss) with the user's own skills & seniority
    const rankedJobs = rankJobs(rawSearchResult.jobs || [], userMatchParams);

    // 9. Atomic Quota / Credit Deduction on successful search (regardless of cache hit or miss)
    consumed = await consumeCredit(userId, { feature: 'job_match' });
    if (!consumed.success) {
      return NextResponse.json(
        {
          error: 'NO_CREDITS',
          upgradeUrl: '/pricing',
          message:
            consumed.error ||
            `You have used all ${JOB_MATCH_FREE_QUOTA} free Job Match searches. Upgrade to Pro for unlimited searches or purchase Pay-As-You-Go credits.`,
        },
        { status: 402 }
      );
    }

    // 10. Resolve updated quota state to return { freeRemaining, creditsRemaining, charged }
    const updatedUser = await DataStore.findUserById(userId);
    const freeUsed =
      typeof consumed.freeUsed === 'number'
        ? consumed.freeUsed
        : updatedUser?.jobMatchFreeUsed ?? 0;
    const freeRemaining =
      typeof consumed.freeRemaining === 'number'
        ? consumed.freeRemaining
        : Math.max(0, JOB_MATCH_FREE_QUOTA - freeUsed);
    const creditsRemaining =
      typeof consumed.creditsRemaining === 'number'
        ? consumed.creditsRemaining
        : updatedUser?.aiCredits ?? 0;
    const charged = Boolean(consumed.charged);

    return NextResponse.json({
      success: true,
      cached: isFromCache,
      jobs: rankedJobs,
      totalFound: rankedJobs.length,
      attributions: rawSearchResult.attributions || [],
      smartLinks,
      sourcesQueried: rawSearchResult.sourcesQueried || [],
      providerStatus,
      freeRemaining,
      creditsRemaining,
      charged,
      quota: {
        isPro: creditCheck.unlimited,
        isDemo: creditCheck.isDemo,
        freeUsed,
        freeRemaining,
        creditsRemaining,
        charged,
      },
    });
  } catch (error: any) {
    console.error('[JobSearch] Error during job search:', error);
    Sentry.captureException(error);

    if (userId && consumed?.deducted) {
      await refundCredit(userId, consumed, { feature: 'job_match' });
    }

    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error?.message || 'An error occurred while matching jobs. Please try again.',
      },
      { status: 500 }
    );
  }
}
