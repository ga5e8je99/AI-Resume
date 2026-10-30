import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ATS Resume Builder',
  description:
    'Build single-column, recruiter-tested ATS resumes with real-time scoring, live preview, and PDF/Word export.',
  alternates: {
    canonical: '/builder',
  },
  openGraph: {
    title: 'ATS Resume Builder | JobMatch AI',
    description:
      'Build single-column, recruiter-tested ATS resumes with real-time scoring, live preview, and PDF/Word export.',
    url: 'https://ai-resume-rho.vercel.app/builder',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ATS Resume Builder | JobMatch AI',
    description:
      'Build single-column, recruiter-tested ATS resumes with real-time scoring, live preview, and PDF/Word export.',
  },
};

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
