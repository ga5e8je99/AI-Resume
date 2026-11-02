import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Job Search & Optional CV Match | JobMatch AI',
  description:
    'Search open roles across global and regional job boards with optional ATS resume matching.',
  robots: {
    index: false,
    follow: true,
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return metadata;
}

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
