import { Job, JobProvider, JobSearchParams, ProviderSearchResult } from '../types';

const PROVIDER_TIMEOUT_MS = 8000;

export class AdzunaProvider implements JobProvider {
  name = 'Adzuna';
  attribution = {
    name: 'Adzuna',
    url: 'https://www.adzuna.com',
    text: 'Jobs powered by Adzuna Global Job Search API',
  };

  isEnabled(): boolean {
    return Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
  }

  async search(params: JobSearchParams): Promise<ProviderSearchResult> {
    const startMs = Date.now();
    if (!this.isEnabled()) {
      return {
        jobs: [],
        status: 'skipped',
        error: 'ADZUNA_APP_ID or ADZUNA_APP_KEY is not configured',
        tookMs: Date.now() - startMs,
      };
    }

    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    const query = (params.query || '').trim();
    if (!query) {
      return { jobs: [], status: 'ok', tookMs: Date.now() - startMs };
    }

    const country = (params.country || 'gb').toLowerCase();
    const page = params.page || 1;

    try {
      let url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?app_id=${appId}&app_key=${appKey}&what=${encodeURIComponent(query)}&results_per_page=20`;
      if (params.location) {
        url += `&where=${encodeURIComponent(params.location)}`;
      }

      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
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
      const results = Array.isArray(data.results) ? data.results : [];

      const jobs: Job[] = results.map((item: any) => ({
        id: `adzuna_${item.id || Math.random().toString(36).slice(2)}`,
        title: item.title ? item.title.replace(/<\/?[^>]+(>|$)/g, '') : 'Untitled Role',
        company: item.company?.display_name || 'Hiring Employer',
        location: item.location?.display_name || 'Global',
        remote: item.location?.display_name?.toLowerCase().includes('remote') || false,
        description: (item.description || '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 400),
        url: item.redirect_url || 'https://www.adzuna.com',
        source: 'Adzuna',
        sourceBadge: 'Adzuna',
        postedDate: item.created ? new Date(item.created).toISOString().split('T')[0] : undefined,
        salary: item.salary_min
          ? `$${Math.round(item.salary_min).toLocaleString()} - $${Math.round(
              item.salary_max || item.salary_min
            ).toLocaleString()}`
          : undefined,
        tags: item.category?.label ? [item.category.label] : [],
        jobType: item.contract_time || 'Full-time',
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
            : err?.message || 'Adzuna fetch failed',
        tookMs: Date.now() - startMs,
      };
    }
  }
}

export const adzunaProvider = new AdzunaProvider();
