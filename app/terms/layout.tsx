import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Terms of Service',
    description:
      'Read the JobMatch AI Terms of Service covering resume builder usage, AI cover letter disclaimers, subscriptions, and refund policies.',
    path: '/terms',
  });
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
