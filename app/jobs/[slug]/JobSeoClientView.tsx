'use client';

import React from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Search,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Compass,
  ArrowRight,
} from 'lucide-react';
import Footer from '@/app/components/Footer';
import { useLanguage } from '@/app/context/LanguageContext';
import { Button } from '@/components/ui/Button';
import { SeoJobQueryEntry, POPULAR_SEO_JOB_QUERIES } from '@/lib/jobs/seo-queries';
import { SmartLinkPlatform } from '@/lib/jobs/types';

interface JobSeoClientViewProps {
  entry: SeoJobQueryEntry;
  smartLinks: SmartLinkPlatform[];
}

export default function JobSeoClientView({
  entry,
  smartLinks,
}: JobSeoClientViewProps) {
  const { t, isRtl } = useLanguage();

  const searchHref = `/jobs?query=${encodeURIComponent(entry.query)}${
    entry.location ? `&location=${encodeURIComponent(entry.location)}` : ''
  }${entry.remote ? '&remote=true' : ''}`;

  return (
    <div
      className="min-h-[100dvh] bg-paper text-ink flex flex-col justify-between selection:bg-surface-2 selection:text-ink overflow-x-clip"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <main
        id="main-content"
        className="max-w-[1040px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 w-full space-y-8"
      >
        {/* Hero Header */}
        <section className="rounded-2xl border border-line-strong bg-surface p-6 sm:p-8 shadow-subtle space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-surface-2 text-accent border border-line-strong">
            <Briefcase className="w-3.5 h-3.5" />
            <span>{t('jobs_seo_badge')}</span>
          </div>

          <div className="space-y-2.5">
            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-ink tracking-tight">
              {entry.title}
            </h1>
            <p className="text-sm sm:text-base text-ink-2 leading-relaxed max-w-3xl">
              {entry.summary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href={searchHref}>
              <Button
                size="lg"
                variant="primary"
                startIcon={<Search className="w-4 h-4" />}
                endIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
              >
                <span>
                  {t('jobs_seo_cta_search').replace('{role}', entry.query)}
                </span>
              </Button>
            </Link>

            <Link href="/review">
              <Button
                size="lg"
                variant="outline"
                className="border-line-strong bg-paper"
              >
                <span>{t('onboarding_cta_build_resume')}</span>
              </Button>
            </Link>
          </div>
        </section>

        {/* Key Skills & Resume Tips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top ATS Keywords & Skills */}
          <section className="rounded-xl border border-line-strong bg-surface p-6 space-y-4">
            <h2 className="text-base font-serif font-bold text-ink flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>{t('jobs_seo_skills_heading')}</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {entry.topSkills.map((skill) => (
                <Link
                  key={skill}
                  href={`/jobs?query=${encodeURIComponent(
                    `${entry.query} ${skill}`
                  )}`}
                  className="text-xs font-mono px-3 py-1.5 rounded-lg bg-paper border border-line-strong text-ink hover:border-accent hover:text-accent transition-colors"
                >
                  {skill}
                </Link>
              ))}
            </div>
          </section>

          {/* Honest Resume & Application Tips */}
          <section className="rounded-xl border border-line-strong bg-surface p-6 space-y-4">
            <h2 className="text-base font-serif font-bold text-ink flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span>{t('jobs_seo_tips_heading')}</span>
            </h2>
            <ul className="space-y-2.5 text-xs sm:text-sm text-ink-2">
              {entry.resumeTips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Direct Smart Search Links across 10 Job Platforms */}
        <section className="rounded-xl border border-line-strong bg-surface p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-serif font-bold text-ink flex items-center gap-2">
              <Compass className="w-4 h-4 text-accent" />
              <span>{t('jobs_platforms_title')}</span>
            </h2>
            <p className="text-xs text-ink-2">{t('jobs_platforms_desc')}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {smartLinks.map((platform) => (
              <a
                key={platform.id}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-lg border border-line-strong bg-paper p-3 hover:border-accent/50 hover:bg-surface-2 transition-all flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-xs text-ink group-hover:text-accent transition-colors truncate">
                    {t('jobs_search_on_platform').replace('{platform}', platform.name)}
                  </span>
                  <ExternalLink className="w-3 h-3 text-ink-2 group-hover:text-accent transition-colors shrink-0" />
                </div>
                <span className="text-[10px] font-mono text-ink-2">
                  {platform.region}
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Browse Other Popular Searches */}
        <section className="rounded-xl border border-line-strong bg-surface p-6 space-y-3">
          <h2 className="text-sm font-serif font-bold text-ink">
            {t('jobs_seo_browse_other')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SEO_JOB_QUERIES.filter((q) => q.slug !== entry.slug).map((item) => (
              <Link
                key={item.slug}
                href={`/jobs/${item.slug}`}
                className="text-xs font-mono px-3 py-1.5 rounded-lg bg-surface-2 border border-line-strong text-ink-2 hover:text-accent hover:border-accent/40 transition-colors"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

