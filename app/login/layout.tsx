import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description:
    'Sign in to your JobMatch AI account to access saved resumes, diagnostic reports, and cover letter drafts.',
  alternates: {
    canonical: '/login',
  },
  openGraph: {
    title: 'Sign In | JobMatch AI',
    description:
      'Sign in to your JobMatch AI account to access saved resumes, diagnostic reports, and cover letter drafts.',
    url: 'https://ai-resume-rho.vercel.app/login',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign In | JobMatch AI',
    description:
      'Sign in to your JobMatch AI account to access saved resumes, diagnostic reports, and cover letter drafts.',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
