import React from 'react';
import Navbar from '@/app/components/Navbar';
import BrandedLoader from '@/components/brand/BrandedLoader';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ResumeGenerateLoading() {
  return (
    <div
      role="status"
      aria-label="Loading AI Resume Generator"
      aria-live="polite"
      className="min-h-screen bg-bg text-text-primary flex flex-col justify-between"
    >
      <span className="sr-only">Loading AI Resume Generator...</span>
      <Navbar />
      <main className="flex-1 max-w-[1200px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Banner Skeleton */}
        <div className="p-6 rounded-xl border border-border bg-surface flex flex-col md:flex-row items-center justify-between gap-6 shadow-subtle">
          <div className="space-y-2 max-w-lg w-full">
            <Skeleton variant="text" width="40%" height={24} />
            <Skeleton variant="text" width="80%" height={14} />
          </div>
          <div className="flex gap-2">
            <Skeleton variant="rectangular" width={110} height={36} className="rounded-md" />
          </div>
        </div>

        {/* Centered Branded Loader in Content Panel */}
        <div className="rounded-xl border border-border bg-surface p-12 flex flex-col items-center justify-center shadow-card">
          <BrandedLoader size="lg" />
        </div>
      </main>
    </div>
  );
}
