import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ReviewLoading() {
  return (
    <div
      role="status"
      aria-label="Loading ATS Scanner"
      aria-live="polite"
      className="min-h-screen bg-bg text-text-primary flex flex-col"
    >
      <span className="sr-only">Loading ATS scanner and diagnostic report...</span>
      <header className="h-16 bg-surface border-b border-border px-4 sm:px-8 flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton variant="text" width={110} height={12} />
          <Skeleton variant="text" width={180} height={18} />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton variant="rectangular" width={100} height={34} className="rounded-md" />
          <Skeleton variant="circular" width={36} height={36} />
        </div>
      </header>

      <main className="max-w-[1280px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Score banner skeleton */}
        <div className="p-6 rounded-xl bg-surface border border-border flex flex-col md:flex-row items-center justify-between gap-6 shadow-subtle">
          <div className="flex items-center gap-6">
            <Skeleton variant="circular" width={96} height={96} />
            <div className="space-y-2">
              <Skeleton variant="text" width={180} height={24} />
              <Skeleton variant="text" width={260} height={14} />
              <Skeleton variant="text" width={140} height={12} />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton variant="rectangular" width={120} height={40} className="rounded-md" />
            <Skeleton variant="rectangular" width={120} height={40} className="rounded-md" />
          </div>
        </div>

        {/* Diagnostic breakdown cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-5 rounded-lg bg-surface border border-border space-y-3 shadow-subtle">
              <Skeleton variant="text" width="60%" height={18} />
              <Skeleton variant="rectangular" height={8} className="rounded-full" />
              <Skeleton variant="text" width="100%" height={12} />
              <Skeleton variant="text" width="80%" height={12} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
