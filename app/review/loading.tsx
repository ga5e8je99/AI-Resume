import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ReviewLoading() {
  return (
    <main
      id="main-content"
      role="status"
      aria-label="Loading ATS Scanner"
      aria-live="polite"
      className="max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex-1 min-h-[calc(100dvh-4rem)] bg-paper text-ink"
    >
      <span className="sr-only">Loading ATS scanner and diagnostic report...</span>

      {/* Score banner skeleton */}
      <div className="p-6 rounded-xl bg-surface border border-line-strong flex flex-col md:flex-row items-center justify-between gap-6 shadow-subtle">
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
          <div key={i} className="p-5 rounded-lg bg-surface border border-line-strong space-y-3 shadow-subtle">
            <Skeleton variant="text" width="60%" height={18} />
            <Skeleton variant="rectangular" height={8} className="rounded-full" />
            <Skeleton variant="text" width="100%" height={12} />
            <Skeleton variant="text" width="80%" height={12} />
          </div>
        ))}
      </div>
    </main>
  );
}
