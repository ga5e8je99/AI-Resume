import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Academic & Executive CV Builder',
    description:
      'Design multi-page academic, scientific, and executive CVs with dedicated sections for publications, grants, and research.',
    path: '/cv-builder',
    noIndex: true,
  });
}

export default function CvBuilderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
