import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://ai-resume-rho.vercel.app';
  const routes = [
    { path: '', changeFrequency: 'weekly' as const, priority: 1.0 },
    { path: '/builder', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/cv-builder', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/review', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/cover-letter', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/pricing', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/login', changeFrequency: 'monthly' as const, priority: 0.5 },
    { path: '/register', changeFrequency: 'monthly' as const, priority: 0.5 },
    { path: '/privacy', changeFrequency: 'monthly' as const, priority: 0.4 },
    { path: '/terms', changeFrequency: 'monthly' as const, priority: 0.4 },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date('2026-10-25'),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
