import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/lib/auth';
import { requireCredits, consumeCredit } from '@/lib/credit-guard';
import { applyRateLimit } from '@/app/lib/rateLimit';
import { searchAllProviders } from '@/lib/jobs/providers';
import { generateSmartLinks } from '@/lib/jobs/smart-links';
import { getCachedJobResults, setCachedJobResults } from '@/lib/jobs/cache';
import { JobSearchParams } from '@/lib/jobs/types';
import DataStore from '@/app/lib/datastore';

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication & Identification
    const authUser = getAuthenticatedUser(req);
    if (!authUser || !authUser.userId) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Please sign in or create a free account to search matching jobs.',
          loginUrl: '/login?returnUrl=/jobs',
        },
        { status: 401 }
      );
    }

    const userId = authUser.userId;

    // 2. Rate Limiting per user / IP
    const rateLimit = applyRateLimit(
      req,
      { limit: 40, windowMs: 60 * 1000, keyPrefix: 'job_search' },
      userId
    );
    if (!rateLimit.allowed && rateLimit.errorResponse) {
      return rateLimit.errorResponse;
    }

    // 3. Quota & Credit Check
    const creditCheck = await requireCredits(userId, req, { feature: 'job_match' });
    if (!creditCheck.allowed && creditCheck.errorResponse) {
      return creditCheck.errorResponse;
    }

    // 4. Request Payload Validation
    const body = await req.json().catch(() => ({}));
    const query = typeof body.query === 'string' ? body.query.trim().slice(0, 100) : '';
    const location = typeof body.location === 'string' ? body.location.trim().slice(0, 80) : '';
    const remote = Boolean(body.remote);
    const country = typeof body.country === 'string' ? body.country.trim().slice(0, 10) : 'eg';
    const skills = Array.isArray(body.skills)
      ? body.skills.filter((s: any) => typeof s === 'string').map((s: string) => s.trim().slice(0, 40)).slice(0, 20)
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

    const searchParams: JobSearchParams = {
      query,
      location,
      remote,
      country,
      skills,
      seniority,
      page: typeof body.page === 'number' ? body.page : 1,
    };

    // 5. Smart search links for the 10 platforms (always fresh)
    const smartLinks = generateSmartLinks({
      query,
      location,
      remote,
      country,
    });

    // 6. Check 6-Hour Cache
    const cachedData = await getCachedJobResults(searchParams);
    let searchResult: any = null;
    let isFromCache = false;

    if (cachedData && Array.isArray(cachedData.jobs)) {
      searchResult = cachedData;
      isFromCache = true;
    } else {
      // 7. Parallel search across official and open API providers
      searchResult = await searchAllProviders(searchParams);

      // Save to cache with 6-hour TTL
      await setCachedJobResults(searchParams, searchResult);

      // 8. Atomic Credit / Quota Deduction (only after successful execution)
      await consumeCredit(userId, { feature: 'job_match' });
    }

    // 9. Fetch fresh user state to return quota info
    const updatedUser = await DataStore.findUserById(userId);
    const freeUsed = updatedUser?.jobMatchFreeUsed ?? 0;
    const creditsRemaining = updatedUser?.aiCredits ?? 0;

    return NextResponse.json({
      success: true,
      cached: isFromCache,
      jobs: searchResult.jobs || [],
      totalFound: searchResult.totalFound || (searchResult.jobs ? searchResult.jobs.length : 0),
      attributions: searchResult.attributions || [],
      smartLinks,
      sourcesQueried: searchResult.sourcesQueried || [],
      quota: {
        isPro: creditCheck.unlimited,
        isDemo: creditCheck.isDemo,
        freeUsed,
        freeRemaining: Math.max(0, 3 - freeUsed),
        creditsRemaining,
      },
    });
  } catch (error: any) {
    console.error('Error during job search:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: error?.message || 'An error occurred while matching jobs. Please try again.',
      },
      { status: 500 }
    );
  }
}
