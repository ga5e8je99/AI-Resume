import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Sign In',
    description:
      'Sign in to your JobMatch AI account to access saved resumes, diagnostic reports, and cover letter drafts.',
    path: '/login',
  });
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
