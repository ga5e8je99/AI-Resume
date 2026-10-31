import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'AI Resume & CV Generator',
    description:
      'Generate recruiter-tested ATS resumes and detailed CVs natively tailored to any job opening with action verbs and zero hallucinations.',
    path: '/resume/generate',
  });
}

export default function ResumeGenerateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
