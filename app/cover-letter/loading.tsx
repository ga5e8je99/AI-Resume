import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function CoverLetterLoading() {
  return (
    <main
      id="main-content"
      role="status"
      aria-label="Loading Cover Letter Builder"
      aria-live="polite"
      className="flex-1 max-w-[1160px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 min-h-[calc(100dvh-4rem)] bg-paper text-ink"
    >
      <span className="sr-only">Loading cover letter builder, please wait...</span>

      {/* 1. Breadcrumbs & Page Title Header (Matches app/cover-letter/page.tsx) */}
      <div className="space-y-1.5">
        <Skeleton variant="text" width={140} height={14} />
        <Skeleton variant="text" width={280} height={28} />
        <Skeleton variant="text" width={420} height={14} />
      </div>

      {/* 2. CoverLetterHero Banner Skeleton */}
      <div className="p-5 sm:p-6 rounded-[12px] bg-surface border border-line-strong flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2 max-w-xl flex-1">
          <Skeleton variant="rectangular" width={130} height={22} className="rounded-full" />
          <Skeleton variant="text" width="75%" height={24} />
          <Skeleton variant="text" width="90%" height={14} />
        </div>
        <Skeleton variant="rectangular" width={140} height={38} className="rounded-md shrink-0" />
      </div>

      {/* 3. Mobile Navigation Tabs (<1024px) */}
      <div className="lg:hidden grid grid-cols-3 gap-1 p-1 bg-surface-2 border border-line-strong rounded-[8px]">
        <Skeleton variant="rectangular" height={32} className="rounded-[6px]" />
        <Skeleton variant="rectangular" height={32} className="rounded-[6px]" />
        <Skeleton variant="rectangular" height={32} className="rounded-[6px]" />
      </div>

      {/* 4. Two-Column 12-Col Grid: Input Form (5 cols) & Interactive Letter Sheet (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-5">
          <div className="bg-surface border border-line-strong rounded-[12px] p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-line-strong pb-3">
              <Skeleton variant="text" width={140} height={16} />
              <Skeleton variant="text" width={60} height={14} />
            </div>

            {/* Job Title & Company Name (2 cols) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Skeleton variant="text" width={90} height={12} />
                <Skeleton variant="rectangular" height={38} className="rounded-[6px]" />
              </div>
              <div className="space-y-1.5">
                <Skeleton variant="text" width={100} height={12} />
                <Skeleton variant="rectangular" height={38} className="rounded-[6px]" />
              </div>
            </div>

            {/* Output Language Selector (6 languages grid) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton variant="text" width={160} height={12} />
                <Skeleton variant="text" width={50} height={12} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} variant="rectangular" height={36} className="rounded-[8px]" />
                ))}
              </div>
            </div>

            {/* Tone Selector Cards */}
            <div className="space-y-2">
              <Skeleton variant="text" width={120} height={12} />
              <div className="grid grid-cols-3 gap-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} variant="rectangular" height={64} className="rounded-[8px]" />
                ))}
              </div>
            </div>

            {/* Job Description Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton variant="text" width={140} height={12} />
                <Skeleton variant="rectangular" width={150} height={26} className="rounded-[6px]" />
              </div>
              <Skeleton variant="rectangular" height={104} className="rounded-[6px]" />
            </div>

            {/* Sender Info */}
            <div className="p-3 bg-surface-2 rounded-[8px] border border-line-strong space-y-2">
              <Skeleton variant="text" width={110} height={12} />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Skeleton variant="rectangular" height={34} className="rounded-[6px]" />
                <Skeleton variant="rectangular" height={34} className="rounded-[6px]" />
                <Skeleton variant="rectangular" height={34} className="rounded-[6px]" />
              </div>
            </div>

            {/* Submit Generate Button */}
            <Skeleton variant="rectangular" height={44} className="rounded-[8px] w-full" />
          </div>
        </div>

        {/* Right Column: Letter Preview Sheet */}
        <div className="lg:col-span-7 hidden lg:block">
          <div className="bg-surface border border-line-strong rounded-[12px] p-8 sm:p-12 min-h-[520px] space-y-6">
            <div className="flex items-center justify-between border-b border-line-strong pb-4">
              <div className="space-y-1.5">
                <Skeleton variant="text" width={180} height={20} />
                <Skeleton variant="text" width={130} height={12} />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton variant="rectangular" width={84} height={32} className="rounded-md" />
                <Skeleton variant="rectangular" width={84} height={32} className="rounded-md" />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Skeleton variant="text" width="35%" height={14} />
              <Skeleton variant="text" width="98%" height={13} />
              <Skeleton variant="text" width="95%" height={13} />
              <Skeleton variant="text" width="90%" height={13} />
            </div>

            <div className="space-y-3">
              <Skeleton variant="text" width="96%" height={13} />
              <Skeleton variant="text" width="92%" height={13} />
              <Skeleton variant="text" width="97%" height={13} />
              <Skeleton variant="text" width="84%" height={13} />
            </div>

            <div className="space-y-2 pt-4">
              <Skeleton variant="text" width={110} height={13} />
              <Skeleton variant="text" width={150} height={15} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
