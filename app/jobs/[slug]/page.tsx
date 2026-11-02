import React from 'react';
import type { Metadata } from 'next';
import {
  POPULAR_SEO_JOB_QUERIES,
  resolveSeoJobQueryBySlug,
} from '@/lib/jobs/seo-queries';
import { generateSmartLinks } from '@/lib/jobs/smart-links';
import JobSeoClientView from './JobSeoClientView';

interface JobSeoPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return POPULAR_SEO_JOB_QUERIES.map((entry) => ({
    slug: entry.slug,
  }));
}

export async function generateMetadata({
  params,
}: JobSeoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = resolveSeoJobQueryBySlug(slug);

  return {
    title: `${entry.title} | JobMatch AI`,
    description: entry.summary,
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `${entry.title} | JobMatch AI`,
      description: entry.summary,
      type: 'website',
    },
  };
}

export default async function JobSeoSlugPage({ params }: JobSeoPageProps) {
  const { slug } = await params;
  const entry = resolveSeoJobQueryBySlug(slug);
  const smartLinks = generateSmartLinks({
    query: entry.query,
    location: entry.location,
    remote: entry.remote,
  });

  return <JobSeoClientView entry={entry} smartLinks={smartLinks} />;
}

