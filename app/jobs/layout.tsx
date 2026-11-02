import React from 'react';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Job Search & Optional CV Match',
    description:
      'Search open roles across global and regional job boards with optional ATS resume matching.',
    path: '/jobs',
  });
}

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
