import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Privacy Policy',
    description:
      'Learn how JobMatch AI protects your career data, handles in-browser resume scanning, and secures generative AI interactions.',
    path: '/privacy',
  });
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
