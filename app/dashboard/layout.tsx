import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Dashboard',
    description:
      'Manage your saved resumes, academic CVs, ATS diagnostic reviews, and AI cover letters.',
    path: '/dashboard',
    noIndex: true,
  });
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}

