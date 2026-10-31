import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Reset Password',
    description: 'Set a new password for your JobMatch AI account.',
    path: '/reset-password',
    noIndex: true,
  });
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}

