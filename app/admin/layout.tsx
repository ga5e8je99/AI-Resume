import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Admin Console',
    description: 'JobMatch AI administration console.',
    path: '/admin',
    noIndex: true,
  });
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}

