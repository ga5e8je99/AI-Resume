import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Cover Letter Generator',
  description:
    'Generate personalized, recruiter-targeted cover letters matching your background to job descriptions in English and Arabic.',
  alternates: {
    canonical: '/cover-letter',
  },
  openGraph: {
    title: 'AI Cover Letter Generator | JobMatch AI',
    description:
      'Generate personalized, recruiter-targeted cover letters matching your background to job descriptions in English and Arabic.',
    url: 'https://ai-resume-rho.vercel.app/cover-letter',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Cover Letter Generator | JobMatch AI',
    description:
      'Generate personalized, recruiter-targeted cover letters matching your background to job descriptions in English and Arabic.',
  },
};

export default function CoverLetterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
