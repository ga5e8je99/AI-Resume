import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function CoverLetterLoading() {
  return (
    <div
      role="status"
      aria-label="Loading Cover Letter Builder"
      aria-live="polite"
      className="min-h-screen bg-bg text-text-primary flex flex-col"
    >
      <span className="sr-only">Loading cover letter builder, please wait...</span>
      <header className="h-16 bg-surface border-b border-border px-4 sm:px-8 flex items-center justify-between">
        <Skeleton variant="text" width={140} height={20} />
        <div className="flex items-center gap-3">
          <Skeleton variant="rectangular" width={90} height={34} className="rounded-md" />
          <Skeleton variant="circular" width={36} height={36} />
        </div>
      </header>

      <main className="max-w-[1160px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Hero banner skeleton */}
        <div className="p-8 rounded-xl bg-surface border border-border space-y-4 shadow-subtle">
          <Skeleton variant="text" width="40%" height={28} />
          <Skeleton variant="text" width="60%" height={16} />
          <div className="flex gap-3 pt-2">
            <Skeleton variant="rectangular" width={140} height={40} className="rounded-md" />
            <Skeleton variant="rectangular" width={120} height={40} className="rounded-md" />
          </div>
        </div>

        {/* Stepper skeleton */}
        <div className="flex items-center justify-between px-4 py-3 bg-surface rounded-lg border border-border">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton variant="circular" width={24} height={24} />
              <Skeleton variant="text" width={80} height={14} className="hidden sm:block" />
            </div>
          ))}
        </div>

        {/* Form skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg bg-surface border border-border space-y-4 shadow-subtle">
            <Skeleton variant="text" width="40%" height={18} />
            <Skeleton variant="rectangular" height={100} className="rounded-md" />
            <Skeleton variant="rectangular" height={120} className="rounded-md" />
          </div>
          <div className="p-6 rounded-lg bg-surface border border-border space-y-4 shadow-subtle">
            <Skeleton variant="text" width="50%" height={18} />
            <Skeleton variant="rectangular" height={240} className="rounded-md" />
          </div>
        </div>
      </main>
    </div>
  );
}
