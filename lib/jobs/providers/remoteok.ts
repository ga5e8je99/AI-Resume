import { Job, JobProvider, JobSearchParams, ProviderSearchResult } from '../types';

const PROVIDER_TIMEOUT_MS = 8000;

export class RemoteOKProvider implements JobProvider {
  name = 'RemoteOK';
  attribution = {
    name: 'RemoteOK',
    url: 'https://remoteok.com',
    text: 'Remote positions aggregated via RemoteOK Public Feed',
  };

  isEnabled(): boolean {
    return true; // Open public feed
  }

  async search(params: JobSearchParams): Promise<ProviderSearchResult> {
    const startMs = Date.now();
    const query = (params.query || '').trim();
    if (!query) {
      return { jobs: [], status: 'ok', tookMs: Date.now() - startMs };
    }

    try {
      // RemoteOK accepts tag or general search
      const tag = query.toLowerCase().split(/\s+/)[0];
      const url = `https://remoteok.com/api?tag=${encodeURIComponent(tag)}`;

      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'JobMatchAI/1.0 (Job Aggregator; contact@jobmatch.ai)',
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
      if (!Array.isArray(data)) {
        return {
          jobs: [],
          status: 'ok',
          tookMs: Date.now() - startMs,
        };
      }

      // First element is legal / license disclaimer object
      const rawJobs = data.filter((item: any) => item && item.position && item.company);

      const jobs: Job[] = rawJobs.slice(0, 20).map((item: any) => {
        let salaryStr: string | undefined;
        if (item.salary_min || item.salary_max) {
          salaryStr = `$${(item.salary_min || 0).toLocaleString()} - $${(item.salary_max || 0).toLocaleString()}`;
        }

        return {
          id: `remoteok_${item.id || Math.random().toString(36).slice(2)}`,
          title: item.position || 'Untitled Remote Role',
          company: item.company || 'Tech Company',
          location: item.location || 'Remote (Worldwide)',
          remote: true,
          description: (item.description || '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 400),
          url: item.url
            ? item.url.startsWith('http')
              ? item.url
              : `https://remoteok.com${item.url}`
            : 'https://remoteok.com',
          source: 'RemoteOK',
          sourceBadge: 'RemoteOK',
          postedDate: item.date
            ? new Date(item.date).toISOString().split('T')[0]
            : undefined,
          salary: salaryStr,
          tags: Array.isArray(item.tags) ? item.tags : [],
          jobType: 'Full-time Remote',
        };
      });

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
            : err?.message || 'RemoteOK fetch failed',
        tookMs: Date.now() - startMs,
      };
    }
  }
}

export const remoteOKProvider = new RemoteOKProvider();
