import { Job, JobProvider, JobSearchParams } from '../types';

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

  async search(params: JobSearchParams): Promise<Job[]> {
    if (!this.isEnabled()) {
      return [];
    }

    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    const query = (params.query || '').trim();
    if (!query) return [];

    const country = (params.country || 'gb').toLowerCase();
    const page = params.page || 1;

    try {
      let url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?app_id=${appId}&app_key=${appKey}&what=${encodeURIComponent(query)}&results_per_page=20`;
      if (params.location) {
        url += `&where=${encodeURIComponent(params.location)}`;
      }

      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) {
        return [];
      }

      const data = await res.json();
      const results = Array.isArray(data.results) ? data.results : [];

      return results.map((item: any) => ({
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
        salary: item.salary_min ? `$${Math.round(item.salary_min).toLocaleString()} - $${Math.round(item.salary_max || item.salary_min).toLocaleString()}` : undefined,
        tags: item.category?.label ? [item.category.label] : [],
        jobType: item.contract_time || 'Full-time',
      }));
    } catch {
      return [];
    }
  }
}

export const adzunaProvider = new AdzunaProvider();
