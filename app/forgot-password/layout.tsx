import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Forgot Password',
    description: 'Reset your JobMatch AI account password securely via email.',
    path: '/forgot-password',
  });
}

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}

