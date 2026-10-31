import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function BuilderLoading() {
  return (
    <div
      role="status"
      aria-label="Preparing resume builder workspace"
      aria-live="polite"
      className="min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-paper text-ink flex flex-col"
    >
      <span className="sr-only">Preparing resume builder workspace...</span>

      {/* 1. Top Builder Workspace Toolbar Skeleton (Matches app/builder/page.tsx h-14 header) */}
      <header className="sticky top-0 z-40 bg-surface border-b border-line-strong w-full">
        <div className="max-w-[1720px] w-full mx-auto px-2 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton variant="rectangular" width={96} height={32} className="rounded-md" />
            <div className="h-4 w-px bg-surface-2" />
            <Skeleton variant="text" width={160} height={18} />
            <Skeleton variant="rectangular" width={84} height={22} className="rounded-md hidden md:block" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton variant="rectangular" width={100} height={32} className="rounded-md hidden sm:block" />
            <Skeleton variant="rectangular" width={88} height={32} className="rounded-md" />
            <Skeleton variant="rectangular" width={76} height={32} className="rounded-md hidden sm:block" />
            <Skeleton variant="rectangular" width={110} height={32} className="rounded-md" />
            <Skeleton variant="circular" width={32} height={32} />
          </div>
        </div>
      </header>

      {/* 2. Main Split Workspace Skeleton (Matches max-w-[1720px] 12-col split) */}
      <main
        id="main-content"
        className="max-w-[1720px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 pb-24 lg:pb-6 flex-1 flex flex-col min-w-0"
      >
        {/* Mobile Tab Switcher (<1024px) */}
        <div className="lg:hidden mb-4 bg-surface-2 p-1 rounded-xl border border-line-strong grid grid-cols-2 gap-1">
          <Skeleton variant="rectangular" height={34} className="rounded-lg" />
          <Skeleton variant="rectangular" height={34} className="rounded-lg" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 min-w-0">
          {/* Left Column: Form Editor (6 cols on desktop) */}
          <div className="lg:col-span-6 space-y-4 min-w-0">
            {/* Quick Template & Color Switcher Bar */}
            <div className="hidden lg:flex items-center justify-between gap-3 p-3 bg-surface border border-line-strong rounded-xl">
              <Skeleton variant="text" width={160} height={16} />
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 me-2">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} variant="circular" width={16} height={16} />
                  ))}
                </div>
                <Skeleton variant="rectangular" width={110} height={28} className="rounded-md" />
              </div>
            </div>

            {/* Expanded Personal Info Section Skeleton */}
            <div className="bg-surface border border-line-strong rounded-xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-line-strong">
                <div className="flex items-center gap-2.5">
                  <Skeleton variant="circular" width={28} height={28} />
                  <Skeleton variant="text" width={150} height={18} />
                </div>
                <Skeleton variant="circular" width={20} height={20} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton variant="text" width="40%" height={12} />
                    <Skeleton variant="rectangular" height={36} className="rounded-md" />
                  </div>
                ))}
              </div>
            </div>

            {/* Accordion Collapsed Sections Skeletons (Summary, Experience, Education, Skills, Projects) */}
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-surface border border-line-strong rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Skeleton variant="circular" width={28} height={28} />
                  <Skeleton variant="text" width={140 + (i % 3) * 30} height={16} />
                </div>
                <Skeleton variant="circular" width={18} height={18} />
              </div>
            ))}
          </div>

          {/* Right Column: Live Sticky A4 Resume Preview Skeleton (6 cols on desktop) */}
          <div className="lg:col-span-6 hidden lg:block lg:sticky lg:top-20 min-w-0">
            <div className="w-full max-w-[794px] mx-auto aspect-[1/1.414] bg-surface rounded-lg border border-line-strong p-8 sm:p-10 space-y-6 shadow-card">
              {/* Resume Document Header */}
              <div className="border-b border-line-strong pb-5 space-y-2.5">
                <Skeleton variant="text" width="50%" height={28} />
                <Skeleton variant="text" width="35%" height={16} />
                <div className="flex flex-wrap gap-3 pt-1">
                  <Skeleton variant="text" width={110} height={12} />
                  <Skeleton variant="text" width={120} height={12} />
                  <Skeleton variant="text" width={100} height={12} />
                </div>
              </div>

              {/* Professional Summary Block */}
              <div className="space-y-2">
                <Skeleton variant="text" width={140} height={14} />
                <Skeleton variant="text" width="100%" height={11} />
                <Skeleton variant="text" width="94%" height={11} />
                <Skeleton variant="text" width="82%" height={11} />
              </div>

              {/* Work Experience Block */}
              <div className="space-y-4">
                <Skeleton variant="text" width={150} height={14} />
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton variant="text" width="45%" height={14} />
                      <Skeleton variant="text" width="22%" height={12} />
                    </div>
                    <Skeleton variant="text" width="30%" height={12} />
                    <Skeleton variant="text" width="96%" height={11} />
                    <Skeleton variant="text" width="90%" height={11} />
                    <Skeleton variant="text" width="84%" height={11} />
                  </div>
                ))}
              </div>

              {/* Education & Skills Block */}
              <div className="space-y-3 pt-2">
                <Skeleton variant="text" width={120} height={14} />
                <div className="flex flex-wrap gap-2">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} variant="rectangular" width={72} height={22} className="rounded" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
