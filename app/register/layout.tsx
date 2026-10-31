import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Create an Account',
    description:
      'Join JobMatch AI to build recruiter-ready resumes, run unlimited ATS checks, and generate tailored cover letters.',
    path: '/register',
  });
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
