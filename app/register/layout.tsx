import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create an Account',
  description:
    'Join JobMatch AI to build recruiter-ready resumes, run unlimited ATS checks, and generate tailored cover letters.',
  alternates: {
    canonical: '/register',
  },
  openGraph: {
    title: 'Create an Account | JobMatch AI',
    description:
      'Join JobMatch AI to build recruiter-ready resumes, run unlimited ATS checks, and generate tailored cover letters.',
    url: 'https://ai-resume-rho.vercel.app/register',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Create an Account | JobMatch AI',
    description:
      'Join JobMatch AI to build recruiter-ready resumes, run unlimited ATS checks, and generate tailored cover letters.',
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
