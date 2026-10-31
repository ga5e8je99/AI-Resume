import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'ATS Resume Diagnostic & Job Match Review',
    description:
      'Run in-browser ATS scoring, detect missing industry keywords, and inspect formatting compliance for target roles.',
    path: '/review',
  });
}

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
