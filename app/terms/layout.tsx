import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Read the JobMatch AI Terms of Service covering resume builder usage, AI cover letter disclaimers, subscriptions, and refund policies.',
  alternates: {
    canonical: '/terms',
  },
  openGraph: {
    title: 'Terms of Service | JobMatch AI',
    description:
      'Read the JobMatch AI Terms of Service covering resume builder usage, AI cover letter disclaimers, subscriptions, and refund policies.',
    url: 'https://ai-resume-rho.vercel.app/terms',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service | JobMatch AI',
    description:
      'Read the JobMatch AI Terms of Service covering resume builder usage, AI cover letter disclaimers, subscriptions, and refund policies.',
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
