import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'AI Cover Letter Generator',
    description:
      'Generate personalized, recruiter-targeted cover letters matching your background to job descriptions in English and Arabic.',
    path: '/cover-letter',
  });
}

export default function CoverLetterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
