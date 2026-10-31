import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Component Lab',
    description: 'JobMatch AI internal design system component playground.',
    path: '/dev/ui',
    noIndex: true,
  });
}

export default function DevUiLayout({ children }: { children: React.ReactNode }) {
  return children;
}

