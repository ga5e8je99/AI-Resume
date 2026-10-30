import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Learn how JobMatch AI protects your career data, handles in-browser resume scanning, and secures generative AI interactions.',
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | JobMatch AI',
    description:
      'Learn how JobMatch AI protects your career data, handles in-browser resume scanning, and secures generative AI interactions.',
    url: 'https://ai-resume-rho.vercel.app/privacy',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | JobMatch AI',
    description:
      'Learn how JobMatch AI protects your career data, handles in-browser resume scanning, and secures generative AI interactions.',
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
