import { Job, JobProvider, JobSearchParams, ProviderSearchResult } from '../types';

const PROVIDER_TIMEOUT_MS = 8000;

export class RemotiveProvider implements JobProvider {
  name = 'Remotive';
  attribution = {
    name: 'Remotive',
    url: 'https://remotive.com',
    text: 'Powered by Remotive Remote Jobs API',
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
      const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=25`;
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'JobMatchAI/1.0 (JobMatch Aggregator)',
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
      const rawJobs = Array.isArray(data.jobs) ? data.jobs : [];

      const jobs: Job[] = rawJobs.slice(0, 20).map((item: any) => ({
        id: `remotive_${item.id || item.slug || Math.random().toString(36).slice(2)}`,
        title: item.title || 'Untitled Role',
        company: item.company_name || 'Hiring Company',
        location: item.candidate_required_location || 'Worldwide Remote',
        remote: true,
        description: (item.description || '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 400),
        url: item.url || 'https://remotive.com',
        source: 'Remotive',
        sourceBadge: 'Remotive',
        postedDate: item.publication_date
          ? new Date(item.publication_date).toISOString().split('T')[0]
          : undefined,
        salary: item.salary || undefined,
        tags: Array.isArray(item.tags) ? item.tags : [],
        jobType: item.job_type || 'Full-time',
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
            : err?.message || 'Remotive fetch failed',
        tookMs: Date.now() - startMs,
      };
    }
  }
}

export const remotiveProvider = new RemotiveProvider();
