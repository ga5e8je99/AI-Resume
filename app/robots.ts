import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard',
          '/dashboard/',
          '/payment/',
          '/builder',
          '/builder/',
          '/cv-builder',
          '/cv-builder/',
          '/admin',
          '/admin/',
          '/reset-password/',
          '/preview-template',
          '/dev/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
