import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { DataStore } from '@/app/lib/datastore';
import { buildJobPostingJsonLd } from '@/lib/hr/applyValidation';
import HireJobClient from './HireJobClient';

export async function generateMetadata(context: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await context.params;
  const cleanSlug = String(slug || '').trim().toLowerCase();
  const job = await DataStore.getEmployerJobBySlug(cleanSlug);
  if (!job || job.status !== 'published') {
    return {
      title: 'Job Not Found | JobMatch AI',
    };
  }
  const org = await DataStore.getOrganizationById(job.orgId);
  const orgName = org?.name || 'Hiring Company';
  const snippet = job.description.replace(/\s+/g, ' ').slice(0, 155);

  return {
    title: `${job.title} at ${orgName} | Direct Apply — JobMatch AI`,
    description: snippet,
    openGraph: {
      title: `${job.title} at ${orgName}`,
      description: snippet,
      type: 'website',
    },
  };
}

export default async function HireJobPage(context: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await context.params;
  const cleanSlug = String(slug || '').trim().toLowerCase();
  const job = await DataStore.getEmployerJobBySlug(cleanSlug);
  if (!job || job.status !== 'published') {
    notFound();
  }

  const org = await DataStore.getOrganizationById(job.orgId);
  if (!org) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jobmatch.ai';
  const jsonLd = buildJobPostingJsonLd(job, org, baseUrl);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HireJobClient
        job={{
          id: job.id,
          slug: job.slug,
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          skills: job.skills,
          location: job.location,
          remote: job.remote,
          employmentType: job.employmentType,
          seniority: job.seniority,
          salary: job.salary?.visible
            ? {
                min: job.salary.min ?? undefined,
                max: job.salary.max ?? undefined,
                currency: job.salary.currency,
                visible: job.salary.visible,
              }
            : undefined,
          screeningQuestions: (job.screeningQuestions || []).map((q, idx) =>
            typeof q === 'string'
              ? { id: `q_${idx}`, question: q, required: false }
              : q
          ),
          status: job.status,
          publishedAt: job.publishedAt ?? undefined,
          expiresAt: job.expiresAt ?? undefined,
        }}
        organization={{
          id: org.id,
          name: org.name,
          website: org.website,
          logo: org.logo,
          industry: org.industry,
          size: org.size,
          country: org.country,
          verified: Boolean(org.verified),
        }}
      />
    </>
  );
}
