import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'AI Job Match & Smart Job Search',
    description:
      'Discover live global and regional job openings scored against your resume skills, seniority, and target role with AI-powered match rankings.',
    path: '/jobs',
  });
}

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

