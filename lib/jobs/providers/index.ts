import { Job, JobProvider, JobSearchParams, JobProviderAttribution } from '../types';
import { remotiveProvider } from './remotive';
import { arbeitnowProvider } from './arbeitnow';
import { remoteOKProvider } from './remoteok';
import { theMuseProvider } from './themuse';
import { adzunaProvider } from './adzuna';
import { joobleProvider } from './jooble';
import { rankJobs } from '../matcher';

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
 * Executes a federated search across all active official & open API providers in parallel.
 * Fails gracefully if any provider times out or errors.
 */
export async function searchAllProviders(params: JobSearchParams): Promise<{
  jobs: Job[];
  attributions: JobProviderAttribution[];
  totalFound: number;
  sourcesQueried: string[];
}> {
  const enabledProviders = getEnabledProviders();
  const sourcesQueried = enabledProviders.map((p) => p.name);

  // Parallel fetch with settled promises
  const searchPromises = enabledProviders.map(async (provider) => {
    try {
      const results = await provider.search(params);
      return Array.isArray(results) ? results : [];
    } catch {
      return [] as Job[];
    }
  });

  const settled = await Promise.allSettled(searchPromises);
  const collectedJobs: Job[] = [];

  for (const outcome of settled) {
    if (outcome.status === 'fulfilled' && Array.isArray(outcome.value)) {
      collectedJobs.push(...outcome.value);
    }
  }

  // Deduplicate, score, and rank
  const ranked = rankJobs(collectedJobs, params);

  return {
    jobs: ranked,
    attributions: getProviderAttributions(),
    totalFound: ranked.length,
    sourcesQueried,
  };
}
