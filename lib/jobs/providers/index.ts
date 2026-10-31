import {
  Job,
  JobProvider,
  JobSearchParams,
  JobProviderAttribution,
  ProviderSearchResult,
  ProviderStatusEntry,
} from '../types';
import { remotiveProvider } from './remotive';
import { arbeitnowProvider } from './arbeitnow';
import { remoteOKProvider } from './remoteok';
import { theMuseProvider } from './themuse';
import { adzunaProvider } from './adzuna';
import { joobleProvider } from './jooble';
import { deduplicateJobs } from '../matcher';
import { stripUserMatchDataFromJob } from '../cache';

export const PROVIDER_TIMEOUT_MS = 8000;

export const ALL_PROVIDERS: JobProvider[] = [
  remotiveProvider,
  arbeitnowProvider,
  remoteOKProvider,
  theMuseProvider,
  adzunaProvider,
  joobleProvider,
];

export function getEnabledProviders(): JobProvider[] {
  return ALL_PROVIDERS.filter((p) => p.isEnabled());
}

export function getProviderAttributions(): JobProviderAttribution[] {
  return getEnabledProviders().map((p) => p.attribution);
}

/**
 * Executes a single provider search with an enforced 8-second timeout
 * and returns a normalized { jobs, status: 'ok' | 'failed' | 'skipped', error?, tookMs }.
 */
export async function executeProviderSearch(
  provider: JobProvider,
  params: JobSearchParams,
  timeoutMs: number = PROVIDER_TIMEOUT_MS
): Promise<ProviderSearchResult> {
  const startMs = Date.now();

  if (!provider.isEnabled()) {
    try {
      const skippedRes = await provider.search(params);
      if (skippedRes && typeof skippedRes === 'object' && !Array.isArray(skippedRes)) {
        return {
          jobs: [],
          status: 'skipped',
          error: skippedRes.error || 'Missing API key configuration',
          tookMs: typeof skippedRes.tookMs === 'number' ? skippedRes.tookMs : Date.now() - startMs,
        };
      }
    } catch {
      // Intentionally ignored: disabled provider threw when probed for custom skip reason; default skipped response returned below
    }
    return {
      jobs: [],
      status: 'skipped',
      error: 'Missing API key configuration',
      tookMs: Date.now() - startMs,
    };
  }

  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    const timeoutPromise = new Promise<ProviderSearchResult>((resolve) => {
      timer = setTimeout(() => {
        resolve({
          jobs: [],
          status: 'failed',
          error: `Provider timed out after ${timeoutMs}ms`,
          tookMs: Date.now() - startMs,
        });
      }, timeoutMs);
    });

    const rawResult: any = await Promise.race([provider.search(params), timeoutPromise]);
    if (timer) clearTimeout(timer);

    if (Array.isArray(rawResult)) {
      return {
        jobs: rawResult,
        status: 'ok',
        tookMs: Date.now() - startMs,
      };
    }

    if (rawResult && typeof rawResult === 'object') {
      return {
        jobs: Array.isArray(rawResult.jobs) ? rawResult.jobs : [],
        status: rawResult.status || 'ok',
        ...(rawResult.error ? { error: String(rawResult.error) } : {}),
        tookMs: typeof rawResult.tookMs === 'number' ? rawResult.tookMs : Date.now() - startMs,
      };
    }

    return {
      jobs: [],
      status: 'ok',
      tookMs: Date.now() - startMs,
    };
  } catch (err: any) {
    if (timer) clearTimeout(timer);
    return {
      jobs: [],
      status: 'failed',
      error: err?.message || 'Provider search failed',
      tookMs: Date.now() - startMs,
    };
  }
}

export interface FederatedJobSearchResult {
  jobs: Job[];
  attributions: JobProviderAttribution[];
  totalFound: number;
  sourcesQueried: string[];
  providerStatus: ProviderStatusEntry[];
  allFailed: boolean;
  hasPartialFailure: boolean;
}

/**
 * Executes a federated search across all job providers in parallel using Promise.allSettled
 * with an 8-second timeout per provider.
 */
export async function searchAllProviders(
  params: JobSearchParams,
  providersToRun: JobProvider[] = ALL_PROVIDERS,
  timeoutMs: number = PROVIDER_TIMEOUT_MS
): Promise<FederatedJobSearchResult> {
  const searchPromises = providersToRun.map((provider) =>
    executeProviderSearch(provider, params, timeoutMs)
  );

  const settled = await Promise.allSettled(searchPromises);
  const collectedJobs: Job[] = [];
  const providerStatus: ProviderStatusEntry[] = [];
  const sourcesQueried: string[] = [];

  for (let i = 0; i < settled.length; i++) {
    const provider = providersToRun[i];
    const outcome = settled[i];

    if (outcome.status === 'fulfilled') {
      const res = outcome.value;
      if (res.status !== 'skipped') {
        sourcesQueried.push(provider.name);
      }
      if (res.status === 'ok' && Array.isArray(res.jobs)) {
        collectedJobs.push(...res.jobs);
      }
      providerStatus.push({
        provider: provider.name,
        status: res.status,
        count: Array.isArray(res.jobs) ? res.jobs.length : 0,
        tookMs: res.tookMs,
        ...(res.error ? { error: res.error } : {}),
      });
    } else {
      sourcesQueried.push(provider.name);
      providerStatus.push({
        provider: provider.name,
        status: 'failed',
        count: 0,
        tookMs: timeoutMs,
        error: outcome.reason?.message || 'Provider promise rejected',
      });
    }
  }

  const activeProviders = providerStatus.filter((p) => p.status !== 'skipped');
  const allFailed =
    activeProviders.length > 0 && activeProviders.every((p) => p.status === 'failed');
  const hasPartialFailure =
    !allFailed && activeProviders.some((p) => p.status === 'failed');

  // Deduplicate raw jobs only (user-specific scoring happens per user after cache hit/miss)
  const rawDeduplicated = deduplicateJobs(collectedJobs).map((job) =>
    stripUserMatchDataFromJob(job)
  );

  return {
    jobs: rawDeduplicated,
    attributions: getProviderAttributions(),
    totalFound: rawDeduplicated.length,
    sourcesQueried,
    providerStatus,
    allFailed,
    hasPartialFailure,
  };
}
