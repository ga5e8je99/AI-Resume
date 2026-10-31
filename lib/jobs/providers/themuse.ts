import { Job, JobProvider, JobSearchParams, ProviderSearchResult } from '../types';

const PROVIDER_TIMEOUT_MS = 8000;

export class TheMuseProvider implements JobProvider {
  name = 'The Muse';
  attribution = {
    name: 'The Muse',
    url: 'https://www.themuse.com',
    text: 'Job listings curated via The Muse Open Career Platform',
  };

  isEnabled(): boolean {
    return true; // Open public API
  }

  async search(params: JobSearchParams): Promise<ProviderSearchResult> {
    const startMs = Date.now();
    const query = (params.query || '').toLowerCase().trim();
    if (!query) {
      return { jobs: [], status: 'ok', tookMs: Date.now() - startMs };
    }

    try {
      const page = params.page || 1;
      const url = `https://www.themuse.com/api/public/jobs?page=${page}&descending=true`;

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
      const results = Array.isArray(data.results) ? data.results : [];

      // Filter results matching candidate query tokens
      const queryTokens = query.split(/\s+/).filter((t) => t.length > 2);
      const filtered = results.filter((item: any) => {
        const title = (item.name || '').toLowerCase();
        const cats = Array.isArray(item.categories)
          ? item.categories.map((c: any) => (c.name || '').toLowerCase()).join(' ')
          : '';
        return queryTokens.some((t) => title.includes(t) || cats.includes(t)) || title.includes(query);
      });

      const listToMap = filtered.length > 0 ? filtered : results.slice(0, 5);

      const jobs: Job[] = listToMap.slice(0, 15).map((item: any) => {
        const locations = Array.isArray(item.locations)
          ? item.locations.map((l: any) => l.name).join(', ')
          : 'Flexible';
        const isRemote =
          locations.toLowerCase().includes('flexible') ||
          locations.toLowerCase().includes('remote');

        return {
          id: `themuse_${item.id || Math.random().toString(36).slice(2)}`,
          title: item.name || 'Professional Role',
          company: item.company?.name || 'Company',
          location: locations,
          remote: isRemote,
          description: (item.contents || '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 400),
          url: item.refs?.landing_page || 'https://www.themuse.com',
          source: 'The Muse',
          sourceBadge: 'The Muse',
          postedDate: item.publication_date
            ? new Date(item.publication_date).toISOString().split('T')[0]
            : undefined,
          tags: Array.isArray(item.categories) ? item.categories.map((c: any) => c.name) : [],
          jobType:
            Array.isArray(item.levels) && item.levels.length > 0
              ? item.levels[0].name
              : 'Full-time',
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
            : err?.message || 'The Muse fetch failed',
        tookMs: Date.now() - startMs,
      };
    }
  }
}

export const theMuseProvider = new TheMuseProvider();
