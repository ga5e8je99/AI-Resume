import { SmartLinkPlatform } from './types';

export interface SmartLinkOptions {
  query: string;
  location?: string;
  remote?: boolean;
  country?: string;
}

/**
 * Generates the top 10 smart search platform deep links in priority order for Egypt/MENA + global audience.
 * No scraping is performed; these deep links take the candidate directly to the platform's official search results.
 */
export function generateSmartLinks(options: SmartLinkOptions): SmartLinkPlatform[] {
  const query = (options.query || '').trim() || 'Software Engineer';
  const location = (options.location || '').trim();
  const remote = Boolean(options.remote);

  // 1. LinkedIn Jobs
  let linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}`;
  if (location) {
    linkedinUrl += `&location=${encodeURIComponent(location)}`;
  }
  if (remote) {
    linkedinUrl += `&f_WT=2`; // LinkedIn Remote filter flag
  }

  // 2. Indeed
  let indeedUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}`;
  if (location) {
    indeedUrl += `&l=${encodeURIComponent(location)}`;
  }
  if (remote) {
    indeedUrl += `&sc=0kf%3Aattr(DS3S6)%3B`; // Indeed Remote filter
  }

  // 3. Glassdoor
  let glassdoorUrl = `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(query)}`;
  if (location) {
    glassdoorUrl += `&locKeyword=${encodeURIComponent(location)}`;
  }

  // 4. Wuzzuf (Leading platform in Egypt & MENA)
  const wuzzufQuery = location ? `${query} ${location}` : query;
  const wuzzufUrl = `https://wuzzuf.net/search/jobs/?q=${encodeURIComponent(wuzzufQuery)}&a=hpb`;

  // 5. Bayt (Largest MENA & Middle East job platform)
  let baytUrl = `https://www.bayt.com/en/international/jobs/?keyword=${encodeURIComponent(query)}`;
  if (location) {
    baytUrl += `&location=${encodeURIComponent(location)}`;
  }

  // 6. Naukrigulf (Dominant Gulf job platform: UAE, Saudi, Bahrain, Qatar)
  const naukriQuery = encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'));
  const naukrigulfUrl = `https://www.naukrigulf.com/${naukriQuery}-jobs`;

  // 7. GulfTalent (Gulf / MENA executive & professional recruitment)
  let gulftalentUrl = `https://www.gulftalent.com/jobs/search?pos_title=${encodeURIComponent(query)}`;
  if (location) {
    gulftalentUrl += `&country=${encodeURIComponent(location)}`;
  }

  // 8. Google Jobs (Google search deep link with interactive jobs card)
  const googleQuery = `${query}${location ? ' ' + location : ''}${remote ? ' remote' : ''} jobs`;
  const googleJobsUrl = `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}&ibp=htl;jobs`;

  // 9. ZipRecruiter
  let ziprecruiterUrl = `https://www.ziprecruiter.com/candidate/search?search=${encodeURIComponent(query)}`;
  if (location) {
    ziprecruiterUrl += `&location=${encodeURIComponent(location)}`;
  }

  // 10. Monster
  let monsterUrl = `https://www.monster.com/jobs/search?q=${encodeURIComponent(query)}`;
  if (location) {
    monsterUrl += `&where=${encodeURIComponent(location)}`;
  }

  return [
    {
      id: 'linkedin',
      name: 'LinkedIn Jobs',
      region: 'Global',
      priority: 1,
      iconName: 'Linkedin',
      description: 'World’s premier professional network with tens of thousands of active postings.',
      url: linkedinUrl,
    },
    {
      id: 'indeed',
      name: 'Indeed',
      region: 'Global',
      priority: 2,
      iconName: 'Search',
      description: 'The world’s largest job aggregator with massive global job inventory.',
      url: indeedUrl,
    },
    {
      id: 'glassdoor',
      name: 'Glassdoor',
      region: 'Global',
      priority: 3,
      iconName: 'Building',
      description: 'Verified salaries, company culture reviews, and direct job listings.',
      url: glassdoorUrl,
    },
    {
      id: 'wuzzuf',
      name: 'Wuzzuf',
      region: 'Egypt / MENA',
      priority: 4,
      iconName: 'Globe',
      description: 'Egypt and MENA’s premier hiring platform connecting top talent with regional employers.',
      url: wuzzufUrl,
    },
    {
      id: 'bayt',
      name: 'Bayt',
      region: 'Egypt / MENA',
      priority: 5,
      iconName: 'Briefcase',
      description: 'The Middle East’s leading employment platform with regional corporate listings.',
      url: baytUrl,
    },
    {
      id: 'naukrigulf',
      name: 'Naukrigulf',
      region: 'Gulf',
      priority: 6,
      iconName: 'Compass',
      description: 'Top job portal for Dubai, UAE, Saudi Arabia, Qatar, and Gulf opportunities.',
      url: naukrigulfUrl,
    },
    {
      id: 'gulftalent',
      name: 'GulfTalent',
      region: 'Gulf',
      priority: 7,
      iconName: 'Award',
      description: 'Premier recruitment portal for professional and managerial roles across the Middle East.',
      url: gulftalentUrl,
    },
    {
      id: 'google_jobs',
      name: 'Google Jobs',
      region: 'Global',
      priority: 8,
      iconName: 'Sparkles',
      description: 'Direct interactive Google search jobs engine indexing across the entire web.',
      url: googleJobsUrl,
    },
    {
      id: 'ziprecruiter',
      name: 'ZipRecruiter',
      region: 'Global',
      priority: 9,
      iconName: 'Zap',
      description: 'Popular US & international marketplace connecting applicants with active employers.',
      url: ziprecruiterUrl,
    },
    {
      id: 'monster',
      name: 'Monster',
      region: 'Global',
      priority: 10,
      iconName: 'Layers',
      description: 'Veteran global job board with wide industry coverage and verified company pages.',
      url: monsterUrl,
    },
  ];
}
