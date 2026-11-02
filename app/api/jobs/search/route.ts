import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
import { requireAuth } from '@/app/lib/auth';
import {
  requireCredits,
  consumeCredit,
  refundCredit,
  CreditConsumeResult,
  isUserEmailVerified,
} from '@/lib/credit-guard';
import { applyRateLimit, parseBoundedJsonBody } from '@/lib/rate-limit';
import { searchAllProviders, ALL_PROVIDERS } from '@/lib/jobs/providers';
import {
  rankJobs,
  deduplicateJobs,
  filterAndSortJobs,
  paginateJobsWithCursor,
} from '@/lib/jobs/matcher';
import { generateSmartLinks } from '@/lib/jobs/smart-links';
import {
  getCachedJobResults,
  setCachedJobResults,
  stripUserMatchDataFromJob,
  JobCacheKeyParams,
} from '@/lib/jobs/cache';
import {
  JobSearchParams,
  ProviderStatusEntry,
  JobEmploymentTypeFilter,
  JobDatePostedFilter,
  JobSortByOption,
} from '@/lib/jobs/types';
import { JOB_MATCH_FREE_QUOTA } from '@/lib/plans';
import DataStore from '@/app/lib/datastore';

export const maxDuration = 60;
const MAX_JOB_SEARCH_BODY_BYTES = 50 * 1024; // 50KB max request payload

const JobSearchInputSchema = z.object({
  query: z.string().trim().min(1).max(150),
  location: z.string().trim().max(120).optional().default(''),
  remote: z.boolean().optional().default(false),
  country: z.string().trim().max(20).optional().default('eg'),
  skills: z.array(z.string().max(60)).max(35).optional().default([]),
  seniority: z
    .enum(['junior', 'mid', 'senior', 'lead', 'any'])
    .optional()
    .default('any'),
  employmentType: z
    .enum(['any', 'all', 'full-time', 'part-time', 'contract', 'internship'])
    .optional()
    .default('any'),
  datePosted: z.enum(['any', 'all', '24h', '7d', '30d']).optional().default('any'),
  minSalary: z.number().min(0).max(10_000_000).optional(),
  maxSalary: z.number().min(0).max(10_000_000).optional(),
  source: z.string().trim().max(60).optional().default('all'),
  sortBy: z
    .enum(['relevance', 'newest', 'match', 'score', 'date'])
    .optional(),
  cursor: z.string().max(240).nullable().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  page: z.number().int().min(1).max(50).optional().default(1),
  includeMatch: z.boolean().optional(),
  mode: z.enum(['free', 'match']).optional(),
});

async function handleJobSearchRequest(req: NextRequest, rawInput: Record<string, any>) {
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

    // Determine whether CV Match scoring is requested (default true on POST unless includeMatch: false or mode: 'free')
    const includeMatch =
      rawInput.includeMatch === false || rawInput.mode === 'free' ? false : true;

    // 3. Quota & Credit Check
    // When includeMatch is true: enforce full job_match quota/credit check.
    // When includeMatch is false (free search without CV): verify user exists & email is verified, but do NOT require/deduct job_match credits.
    let isPro = false;
    let isDemo = false;

    if (includeMatch) {
      const creditCheck = await requireCredits(userId, req, { feature: 'job_match' });
      if (!creditCheck.allowed && creditCheck.errorResponse) {
        return creditCheck.errorResponse;
      }
      isPro = creditCheck.unlimited;
      isDemo = creditCheck.isDemo;
    } else {
      const dbUser = await DataStore.findUserById(userId);
      if (!dbUser) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'Authentication required' },
          { status: 401 }
        );
      }
      if (!isUserEmailVerified(dbUser)) {
        return NextResponse.json(
          {
            error: 'EMAIL_NOT_VERIFIED',
            message:
              'Please verify your email address before using job search. Check your inbox or resend the verification email.',
            resendUrl: '/api/auth/resend-verification',
          },
          { status: 403 }
        );
      }
      isPro = dbUser.plan === 'pro' || dbUser.plan === 'enterprise';
      isDemo = Boolean(dbUser.isDemo);
    }

    // 4. Input Length & Schema Validation
    if (typeof rawInput.query === 'string' && rawInput.query.trim().length > 150) {
      return NextResponse.json(
        { error: 'INPUT_TOO_LONG', message: 'Search query cannot exceed 150 characters.' },
        { status: 400 }
      );
    }
    if (typeof rawInput.location === 'string' && rawInput.location.trim().length > 120) {
      return NextResponse.json(
        { error: 'INPUT_TOO_LONG', message: 'Location cannot exceed 120 characters.' },
        { status: 400 }
      );
    }

    const rawQuery = typeof rawInput.query === 'string' ? rawInput.query.trim() : '';
    if (!rawQuery) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'Target job title or search query is required.' },
        { status: 400 }
      );
    }

    const normalizedCandidateInput = {
      query: rawQuery.slice(0, 100),
      location: typeof rawInput.location === 'string' ? rawInput.location.trim().slice(0, 80) : '',
      remote: Boolean(rawInput.remote),
      country:
        typeof rawInput.country === 'string' && rawInput.country.trim()
          ? rawInput.country.trim().slice(0, 10)
          : 'eg',
      skills: Array.isArray(rawInput.skills)
        ? rawInput.skills
            .filter((s: any) => typeof s === 'string')
            .map((s: string) => s.trim().slice(0, 40))
            .filter(Boolean)
            .slice(0, 30)
        : [],
      seniority: ['junior', 'mid', 'senior', 'lead', 'any'].includes(rawInput.seniority)
        ? rawInput.seniority
        : 'any',
      employmentType: [
        'any',
        'all',
        'full-time',
        'part-time',
        'contract',
        'internship',
      ].includes(rawInput.employmentType)
        ? (rawInput.employmentType as JobEmploymentTypeFilter)
        : 'any',
      datePosted: ['any', 'all', '24h', '7d', '30d'].includes(rawInput.datePosted)
        ? (rawInput.datePosted as JobDatePostedFilter)
        : 'any',
      minSalary:
        typeof rawInput.minSalary === 'number' && Number.isFinite(rawInput.minSalary) && rawInput.minSalary > 0
          ? rawInput.minSalary
          : undefined,
      maxSalary:
        typeof rawInput.maxSalary === 'number' && Number.isFinite(rawInput.maxSalary) && rawInput.maxSalary > 0
          ? rawInput.maxSalary
          : undefined,
      source:
        typeof rawInput.source === 'string' && rawInput.source.trim()
          ? rawInput.source.trim().slice(0, 40)
          : 'all',
      sortBy: ['relevance', 'newest', 'match', 'score', 'date'].includes(rawInput.sortBy)
        ? (rawInput.sortBy as JobSortByOption)
        : undefined,
      cursor: typeof rawInput.cursor === 'string' ? rawInput.cursor.trim() : null,
      limit:
        typeof rawInput.limit === 'number' && Number.isFinite(rawInput.limit)
          ? Math.max(1, Math.min(100, Math.floor(rawInput.limit)))
          : undefined,
      page:
        typeof rawInput.page === 'number' && Number.isFinite(rawInput.page)
          ? Math.max(1, Math.min(50, Math.floor(rawInput.page)))
          : 1,
      includeMatch,
    };

    const validated = JobSearchInputSchema.safeParse(normalizedCandidateInput);
    if (!validated.success) {
      return NextResponse.json(
        {
          error: 'INVALID_INPUT',
          message: 'Invalid job search parameters.',
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      query,
      location,
      remote,
      country,
      skills,
      seniority,
      employmentType,
      datePosted,
      minSalary,
      maxSalary,
      source,
      sortBy,
      cursor,
      limit,
      page,
    } = validated.data;

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
      employmentType,
      datePosted,
      minSalary,
      maxSalary,
      source,
      sortBy,
      cursor,
      limit,
      page,
      includeMatch,
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

    // Fetch internal published EmployerJob postings ("Direct" badge)
    const directJobs = await DataStore.searchPublishedEmployerJobsAsDirectJobs({
      query,
      location,
      remote,
    });

    if (cachedRawData && Array.isArray(cachedRawData.jobs)) {
      rawSearchResult = cachedRawData;
      isFromCache = true;
    } else {
      // 7. Parallel search across official and open API providers (with 8s timeout per provider)
      const federated = await searchAllProviders(cacheKeyParams);

      if (federated.allFailed && directJobs.length === 0) {
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
      if (!federated.allFailed) {
        await setCachedJobResults(cacheKeyParams, rawSearchResult);
      }
    }

    const providerStatus: ProviderStatusEntry[] = Array.isArray(rawSearchResult.providerStatus)
      ? rawSearchResult.providerStatus
      : ALL_PROVIDERS.map((p) => ({
          provider: p.name,
          status: p.isEnabled() ? 'ok' : 'skipped',
          count: 0,
          tookMs: 0,
        }));

    // 8. Deduplicate & Process Jobs (merging internal "Direct" jobs with external provider jobs)
    const combinedRawJobs = [...directJobs, ...(rawSearchResult.jobs || [])];
    const baseJobs = deduplicateJobs(combinedRawJobs);
    let processedJobs = baseJobs.map((j) => stripUserMatchDataFromJob(j));

    if (includeMatch) {
      processedJobs = rankJobs(processedJobs, userMatchParams);
    }

    // Apply server-side filters & sorting if requested
    const hasExplicitFiltersOrSort =
      (employmentType && employmentType !== 'any' && employmentType !== 'all') ||
      (datePosted && datePosted !== 'any' && datePosted !== 'all') ||
      typeof minSalary === 'number' ||
      typeof maxSalary === 'number' ||
      (source && source !== 'all' && source !== 'any') ||
      Boolean(sortBy) ||
      !includeMatch;

    const effectiveSortBy: JobSortByOption =
      sortBy || (includeMatch ? 'match' : 'relevance');

    const filteredAndSorted = hasExplicitFiltersOrSort
      ? filterAndSortJobs(processedJobs, {
          ...userMatchParams,
          // Keep seniority as a soft scoring signal in default match mode unless explicitly filtering in free mode
          seniority: !includeMatch ? seniority : 'any',
          sortBy: effectiveSortBy,
        })
      : processedJobs;

    // 9. Cursor Pagination
    const useExplicitPagination = Boolean(cursor) || typeof limit === 'number';
    const paginated = paginateJobsWithCursor(
      filteredAndSorted,
      cursor,
      limit ?? 50
    );

    // 10. Quota / Credit Deduction ONLY when CV Match is enabled AND on initial search (not subsequent cursor load-more)
    const isLoadMorePage = Boolean(cursor);
    if (includeMatch && !isLoadMorePage) {
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
    }

    // 11. Resolve updated quota state to return { freeRemaining, creditsRemaining, charged }
    const updatedUser = await DataStore.findUserById(userId);
    const freeUsed =
      typeof consumed?.freeUsed === 'number'
        ? consumed.freeUsed
        : updatedUser?.jobMatchFreeUsed ?? 0;
    const freeRemaining =
      typeof consumed?.freeRemaining === 'number'
        ? consumed.freeRemaining
        : Math.max(0, JOB_MATCH_FREE_QUOTA - freeUsed);
    const creditsRemaining =
      typeof consumed?.creditsRemaining === 'number'
        ? consumed.creditsRemaining
        : updatedUser?.aiCredits ?? 0;
    const charged = Boolean(consumed?.charged);

    return NextResponse.json({
      success: true,
      cached: isFromCache,
      includeMatch,
      jobs: useExplicitPagination ? paginated.items : filteredAndSorted,
      totalFound: filteredAndSorted.length,
      nextCursor: paginated.nextCursor,
      hasMore: paginated.hasMore,
      attributions: rawSearchResult.attributions || [],
      smartLinks,
      sourcesQueried: rawSearchResult.sourcesQueried || [],
      providerStatus,
      freeRemaining,
      creditsRemaining,
      charged,
      quota: {
        isPro,
        isDemo,
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

export async function POST(req: NextRequest) {
  const parsed = await parseBoundedJsonBody(req, MAX_JOB_SEARCH_BODY_BYTES);
  if (!parsed.ok) {
    return parsed.errorResponse;
  }
  return handleJobSearchRequest(req, parsed.data || {});
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const query = sp.get('query') || sp.get('q') || '';
  const location = sp.get('location') || '';
  const remote = sp.get('remote') === 'true' || sp.get('remote') === '1';
  const country = sp.get('country') || 'eg';
  const seniority = sp.get('seniority') || 'any';
  const employmentType = sp.get('employmentType') || 'any';
  const datePosted = sp.get('datePosted') || 'any';
  const minSalaryRaw = sp.get('minSalary');
  const maxSalaryRaw = sp.get('maxSalary');
  const source = sp.get('source') || 'all';
  const sortBy = sp.get('sortBy') || 'relevance';
  const cursor = sp.get('cursor') || null;
  const limitRaw = sp.get('limit');
  const includeMatch = sp.get('includeMatch') === 'true';

  return handleJobSearchRequest(req, {
    query,
    location,
    remote,
    country,
    seniority,
    employmentType,
    datePosted,
    minSalary: minSalaryRaw ? Number(minSalaryRaw) : undefined,
    maxSalary: maxSalaryRaw ? Number(maxSalaryRaw) : undefined,
    source,
    sortBy,
    cursor,
    limit: limitRaw ? Number(limitRaw) : undefined,
    includeMatch,
  });
}
