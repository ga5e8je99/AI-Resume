import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ATS Resume Diagnostic & Job Match Review',
  description:
    'Run in-browser ATS scoring, detect missing industry keywords, and inspect formatting compliance for target roles.',
  alternates: {
    canonical: '/review',
  },
  openGraph: {
    title: 'ATS Resume Diagnostic & Job Match Review | JobMatch AI',
    description:
      'Run in-browser ATS scoring, detect missing industry keywords, and inspect formatting compliance for target roles.',
    url: 'https://ai-resume-rho.vercel.app/review',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ATS Resume Diagnostic & Job Match Review | JobMatch AI',
    description:
      'Run in-browser ATS scoring, detect missing industry keywords, and inspect formatting compliance for target roles.',
  },
};

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
