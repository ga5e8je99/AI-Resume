import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'ATS Resume Builder',
    description:
      'Build single-column, recruiter-tested ATS resumes with real-time scoring, live preview, and PDF/Word export.',
    path: '/builder',
    noIndex: true,
  });
}

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
