import type { Metadata } from 'next';
import LandingPageClient from './components/landing/LandingPageClient';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'JobMatch AI - A Resume That Gets Read | Editorial ATS Resume & CV Builder',
    description:
      'ATS-friendly templates, 6 languages with native Arabic RTL, Word & PDF export, and private in-browser diagnostics. Build resumes and cover letters engineered to pass automated screening.',
    path: '/',
    ogTitle: 'JobMatch AI - A Resume That Gets Read',
    ogDescription:
      'ATS-friendly templates, 6 languages with native Arabic RTL, Word & PDF export, and private in-browser diagnostics. Free in-browser scanning.',
  });
}

export default function Home() {
  return <LandingPageClient />;
}
