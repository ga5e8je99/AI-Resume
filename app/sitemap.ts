import type { MetadataRoute } from 'next';
import { SITE_URL, getCanonicalUrl, getLanguageAlternates } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const publicRoutes = [
    { path: '/', changeFrequency: 'weekly' as const, priority: 1.0 },
    { path: '/pricing', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/jobs', changeFrequency: 'daily' as const, priority: 0.9 },
    { path: '/cover-letter', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/review', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/resume/generate', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/login', changeFrequency: 'monthly' as const, priority: 0.5 },
    { path: '/register', changeFrequency: 'monthly' as const, priority: 0.5 },
    { path: '/forgot-password', changeFrequency: 'monthly' as const, priority: 0.3 },
    { path: '/privacy', changeFrequency: 'monthly' as const, priority: 0.4 },
    { path: '/terms', changeFrequency: 'monthly' as const, priority: 0.4 },
  ];

  const lastModified = new Date('2026-10-31');

  return publicRoutes.map((route) => ({
    url: getCanonicalUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    alternates: {
      languages: getLanguageAlternates(route.path),
    },
  }));
}
