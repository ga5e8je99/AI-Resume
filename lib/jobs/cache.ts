import * as Sentry from '@sentry/nextjs';
import JobCache from '@/app/models/JobCache';
import DataStore, { isMongoAvailable } from '@/app/lib/datastore';
import { Job, JobProviderAttribution, ProviderStatusEntry } from './types';

const CACHE_TTL_HOURS = 6;

export interface JobCacheKeyParams {
  query: string;
  location?: string;
  remote?: boolean;
  country?: string;
}

export interface CachedJobData {
  jobs: Job[];
  totalFound: number;
  attributions: JobProviderAttribution[];
  sourcesQueried?: string[];
  providerStatus?: ProviderStatusEntry[];
}

/**
 * Strips any user-specific scoring or skill matching fields so the cache
 * stores strictly raw job listings.
 */
export function stripUserMatchDataFromJob(job: Job): Job {
  const {
    matchScore: _matchScore,
    matchReasons: _matchReasons,
    missingSkills: _missingSkills,
    matchedSkills: _matchedSkills,
    ...rawJob
  } = job;
  return rawJob;
}

function sanitizeCachedPayload(data: any): CachedJobData | null {
  if (!data || !Array.isArray(data.jobs)) {
    return null;
  }
  const rawJobs = data.jobs.map((job: Job) => stripUserMatchDataFromJob(job));
  return {
    jobs: rawJobs,
    totalFound: typeof data.totalFound === 'number' ? data.totalFound : rawJobs.length,
    attributions: Array.isArray(data.attributions) ? data.attributions : [],
    sourcesQueried: Array.isArray(data.sourcesQueried) ? data.sourcesQueried : [],
    ...(Array.isArray(data.providerStatus) ? { providerStatus: data.providerStatus } : {}),
  };
}

/**
 * Builds a normalized, unique cache key strictly from { query, location, remote, country }
 * without any user-specific data.
 */
export function buildCacheKey(params: JobCacheKeyParams): string {
  const q = (params.query || '').toLowerCase().trim();
  const loc = (params.location || '').toLowerCase().trim();
  const rem = params.remote ? 'remote' : 'all';
  const c = (params.country || 'global').toLowerCase().trim();
  return `job_search:${q}:${loc}:${rem}:${c}`;
}

/**
 * Retrieves cached raw job search results if present and unexpired (< 6h)
 */
export async function getCachedJobResults(params: JobCacheKeyParams): Promise<CachedJobData | null> {
  const cacheKey = buildCacheKey({
    query: params.query,
    location: params.location,
    remote: params.remote,
    country: params.country,
  });

  // 1. Try MongoDB
  const mongoUp = await isMongoAvailable();
  if (mongoUp) {
    try {
      const entry = await JobCache.findOne({ cacheKey }).lean();
      if (entry && entry.data) {
        if (new Date(entry.expiresAt).getTime() > Date.now()) {
          return sanitizeCachedPayload(entry.data);
        }
      }
    } catch (err) {
      Sentry.captureException(err, {
        tags: { component: 'JobCache' },
        extra: { context: 'getCachedJobResults MongoDB read failed; falling back to DataStore', cacheKey },
      });
    }
  }

  // 2. Fall back to DataStore
  try {
    const localData = await DataStore.getJobCache(cacheKey);
    return sanitizeCachedPayload(localData);
  } catch (err) {
    Sentry.captureException(err, {
      tags: { component: 'JobCache' },
      extra: { context: 'getCachedJobResults DataStore fallback read failed', cacheKey },
    });
    return null;
  }
}

/**
 * Stores raw job search results in cache with 6-hour expiration (stripped of user-specific match data)
 */
export async function setCachedJobResults(
  params: JobCacheKeyParams,
  data: CachedJobData | { jobs: any[]; totalFound?: number; attributions?: any[]; sourcesQueried?: string[] }
): Promise<void> {
  const keyParams: JobCacheKeyParams = {
    query: params.query,
    location: params.location,
    remote: params.remote,
    country: params.country,
  };
  const cacheKey = buildCacheKey(keyParams);
  const rawPayload = sanitizeCachedPayload(data) || {
    jobs: [],
    totalFound: 0,
    attributions: [],
    sourcesQueried: [],
  };
  const now = Date.now();
  const expiresAt = new Date(now + CACHE_TTL_HOURS * 3600 * 1000);

  // 1. Try MongoDB
  const mongoUp = await isMongoAvailable();
  if (mongoUp) {
    try {
      await JobCache.findOneAndUpdate(
        { cacheKey },
        {
          cacheKey,
          query: keyParams.query || '',
          location: keyParams.location || '',
          remote: Boolean(keyParams.remote),
          country: keyParams.country || 'global',
          data: rawPayload,
          expiresAt,
        },
        { upsert: true, new: true }
      );
      return;
    } catch (err) {
      Sentry.captureException(err, {
        tags: { component: 'JobCache' },
        extra: { context: 'setCachedJobResults MongoDB write failed; falling back to DataStore', cacheKey },
      });
    }
  }

  // 2. Fall back to DataStore
  try {
    await DataStore.setJobCache(cacheKey, rawPayload, CACHE_TTL_HOURS);
  } catch (err) {
    Sentry.captureException(err, {
      tags: { component: 'JobCache' },
      extra: { context: 'setCachedJobResults DataStore fallback write failed', cacheKey },
    });
  }
}
