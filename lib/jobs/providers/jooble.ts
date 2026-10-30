import { Job, JobProvider, JobSearchParams } from '../types';

export class JoobleProvider implements JobProvider {
  name = 'Jooble';
  attribution = {
    name: 'Jooble',
    url: 'https://jooble.org',
    text: 'Jobs delivered via Jooble Search Engine API',
  };

  isEnabled(): boolean {
    return Boolean(process.env.JOOBLE_API_KEY);
  }

  async search(params: JobSearchParams): Promise<Job[]> {
    if (!this.isEnabled()) {
      return [];
    }

    const apiKey = process.env.JOOBLE_API_KEY;
    const query = (params.query || '').trim();
    if (!query) return [];

    try {
      const url = `https://jooble.org/api/${apiKey}`;
      const body = {
        keywords: query,
        location: params.location || '',
        page: params.page || 1,
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) {
        return [];
      }

      const data = await res.json();
      const rawJobs = Array.isArray(data.jobs) ? data.jobs : [];

      return rawJobs.map((item: any) => ({
        id: `jooble_${item.id || Math.random().toString(36).slice(2)}`,
        title: item.title ? item.title.replace(/<\/?[^>]+(>|$)/g, '') : 'Untitled Role',
        company: item.company || 'Hiring Employer',
        location: item.location || 'Global',
        remote: item.location?.toLowerCase().includes('remote') || false,
        description: (item.snippet || '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 400),
        url: item.link || 'https://jooble.org',
        source: 'Jooble',
        sourceBadge: 'Jooble',
        postedDate: item.updated ? new Date(item.updated).toISOString().split('T')[0] : undefined,
        salary: item.salary || undefined,
        jobType: item.type || 'Full-time',
      }));
    } catch {
      return [];
    }
  }
}

export const joobleProvider = new JoobleProvider();
