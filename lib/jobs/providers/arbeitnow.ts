import { Job, JobProvider, JobSearchParams } from '../types';

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

  async search(params: JobSearchParams): Promise<Job[]> {
    const query = (params.query || '').trim();
    if (!query) return [];

    try {
      const url = `https://www.arbeitnow.com/api/job-board-api?search=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'JobMatchAI/1.0',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) {
        return [];
      }

      const data = await res.json();
      const rawJobs = Array.isArray(data.data) ? data.data : [];

      return rawJobs.slice(0, 20).map((item: any) => ({
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
        postedDate: item.created_at ? new Date(item.created_at * 1000).toISOString().split('T')[0] : undefined,
        tags: Array.isArray(item.tags) ? item.tags : [],
        jobType: Array.isArray(item.job_types) && item.job_types.length > 0 ? item.job_types[0] : 'Full-time',
      }));
    } catch {
      return [];
    }
  }
}

export const arbeitnowProvider = new ArbeitnowProvider();
