import { Job, JobProvider, JobSearchParams, ProviderSearchResult } from '../types';

const PROVIDER_TIMEOUT_MS = 8000;

export class ArbeitnowProvider implements JobProvider {
  name = 'Arbeitnow';
  attribution = {
    name: 'Arbeitnow',
    url: 'https://www.arbeitnow.com',
    text: 'Jobs provided via Arbeitnow Open Job Board API',
  };

  isEnabled(): boolean {
    return true; // Open public API, zero authentication required
  }

  async search(params: JobSearchParams): Promise<ProviderSearchResult> {
    const startMs = Date.now();
    const query = (params.query || '').trim();
    if (!query) {
      return { jobs: [], status: 'ok', tookMs: Date.now() - startMs };
    }

    try {
      const url = `https://www.arbeitnow.com/api/job-board-api?search=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'JobMatchAI/1.0',
        },
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      });

      if (!res.ok) {
        return {
          jobs: [],
          status: 'failed',
          error: `HTTP ${res.status}`,
          tookMs: Date.now() - startMs,
        };
      }

      const data = await res.json();
      const rawJobs = Array.isArray(data.data) ? data.data : [];

      const jobs: Job[] = rawJobs.slice(0, 20).map((item: any) => ({
        id: `arbeitnow_${item.slug || Math.random().toString(36).slice(2)}`,
        title: item.title || 'Untitled Role',
        company: item.company_name || 'Hiring Company',
        location: item.location || (item.remote ? 'Remote' : 'Europe / Global'),
        remote: Boolean(item.remote),
        description: (item.description || '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 400),
        url: item.url || 'https://www.arbeitnow.com',
        source: 'Arbeitnow',
        sourceBadge: 'Arbeitnow',
        postedDate: item.created_at
          ? new Date(item.created_at * 1000).toISOString().split('T')[0]
          : undefined,
        tags: Array.isArray(item.tags) ? item.tags : [],
        jobType:
          Array.isArray(item.job_types) && item.job_types.length > 0
            ? item.job_types[0]
            : 'Full-time',
      }));

      return {
        jobs,
        status: 'ok',
        tookMs: Date.now() - startMs,
      };
    } catch (err: any) {
      return {
        jobs: [],
        status: 'failed',
        error:
          err?.name === 'TimeoutError' || err?.name === 'AbortError'
            ? 'Provider timed out after 8000ms'
            : err?.message || 'Arbeitnow fetch failed',
        tookMs: Date.now() - startMs,
      };
    }
  }
}

export const arbeitnowProvider = new ArbeitnowProvider();
