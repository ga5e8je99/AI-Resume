import type { Metadata } from 'next';

export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://ai-resume-rho.vercel.app';

export const SUPPORTED_LANGS = ['en', 'ar', 'fr', 'de', 'es', 'tr'] as const;

export function getCanonicalUrl(path: string): string {
  const normalizedPath =
    path === '/' || path === '' ? '/' : path.startsWith('/') ? path : `/${path}`;
  return normalizedPath === '/' ? SITE_URL : `${SITE_URL}${normalizedPath}`;
}

export function getLanguageAlternates(path: string): Record<string, string> {
  const normalizedPath =
    path === '/' || path === '' ? '/' : path.startsWith('/') ? path : `/${path}`;
  const canonicalUrl = getCanonicalUrl(normalizedPath);
  const queryBase = normalizedPath === '/' ? `${SITE_URL}/` : canonicalUrl;

  const languages: Record<string, string> = {};
  for (const lang of SUPPORTED_LANGS) {
    languages[lang] = `${queryBase}?lang=${lang}`;
  }
  languages['x-default'] = canonicalUrl;
  return languages;
}

export interface PageSeoConfig {
  title: string;
  description: string;
  path: string;
  ogTitle?: string;
  ogDescription?: string;
  noIndex?: boolean;
}

export function buildPageMetadata({
  title,
  description,
  path,
  ogTitle,
  ogDescription,
  noIndex = false,
}: PageSeoConfig): Metadata {
  const canonicalUrl = getCanonicalUrl(path);
  const resolvedOgTitle =
    ogTitle || (title.includes('JobMatch AI') ? title : `${title} | JobMatch AI`);
  const resolvedOgDescription = ogDescription || description;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: getLanguageAlternates(path),
    },
    openGraph: {
      title: resolvedOgTitle,
      description: resolvedOgDescription,
      url: canonicalUrl,
      siteName: 'JobMatch AI',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: resolvedOgTitle,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: resolvedOgTitle,
      description: resolvedOgDescription,
      images: ['/og-image.png'],
    },
    ...(noIndex
      ? {
          robots: {
            index: false,
            follow: false,
            googleBot: {
              index: false,
              follow: false,
            },
          },
        }
      : {}),
  };
}

