import type { Metadata } from 'next';
import LandingPageClient from './components/landing/LandingPageClient';

export const metadata: Metadata = {
  title: 'JobMatch AI - A Resume That Gets Read | Editorial ATS Resume & CV Builder',
  description:
    'ATS-friendly templates, 6 languages with native Arabic RTL, Word & PDF export, and private in-browser diagnostics. Build resumes and cover letters engineered to pass automated screening.',
  alternates: {
    canonical: 'https://ai-resume-rho.vercel.app',
    languages: {
      en: 'https://ai-resume-rho.vercel.app/?lang=en',
      ar: 'https://ai-resume-rho.vercel.app/?lang=ar',
      fr: 'https://ai-resume-rho.vercel.app/?lang=fr',
      de: 'https://ai-resume-rho.vercel.app/?lang=de',
      es: 'https://ai-resume-rho.vercel.app/?lang=es',
      tr: 'https://ai-resume-rho.vercel.app/?lang=tr',
      'x-default': 'https://ai-resume-rho.vercel.app',
    },
  },
  openGraph: {
    title: 'JobMatch AI - A Resume That Gets Read',
    description:
      'ATS-friendly templates, 6 languages with native Arabic RTL, Word & PDF export, and private in-browser diagnostics. Free in-browser scanning.',
    url: 'https://ai-resume-rho.vercel.app',
    siteName: 'JobMatch AI',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'JobMatch AI - Editorial Resume & CV Builder',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JobMatch AI - A Resume That Gets Read',
    description:
      'Editorial ATS-friendly resume builder, diagnostic scanner, and AI cover letter generator with native Arabic & English support.',
    images: ['/og-image.png'],
  },
};

export default function Home() {
  return <LandingPageClient />;
}