import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Resume & CV Generator | JobMatch AI',
  description:
    'Generate recruiter-tested ATS resumes and detailed CVs natively tailored to any job opening with action verbs and zero hallucinations.',
  alternates: {
    canonical: '/resume/generate',
  },
  openGraph: {
    title: 'AI Resume & CV Generator | JobMatch AI',
    description:
      'Generate recruiter-tested ATS resumes and detailed CVs natively tailored to any job opening with action verbs and zero hallucinations.',
    url: 'https://ai-resume-rho.vercel.app/resume/generate',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Resume & CV Generator | JobMatch AI',
    description:
      'Generate recruiter-tested ATS resumes and detailed CVs natively tailored to any job opening with action verbs and zero hallucinations.',
  },
};

export default function ResumeGenerateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
