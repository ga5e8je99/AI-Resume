import React from 'react';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <main
      id="main-content"
      role="status"
      aria-label="Loading page content"
      aria-live="polite"
      className="max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 flex-1 min-h-[calc(100dvh-4rem)] bg-paper text-ink"
    >
      <span className="sr-only">Loading page content, please wait...</span>

      {/* Hero / Page Header Content Skeleton */}
      <div className="space-y-3 max-w-2xl">
        <Skeleton variant="rectangular" width={120} height={24} className="rounded-full" />
        <Skeleton variant="text" width="65%" height={36} />
        <Skeleton variant="text" width="85%" height={16} />
        <Skeleton variant="text" width="70%" height={16} />
      </div>

      {/* Structured 3-Column Content Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Secondary Content Section Skeleton */}
      <div className="p-6 rounded-xl border border-line-strong bg-surface space-y-4">
        <Skeleton variant="text" width="30%" height={20} />
        <div className="space-y-2.5">
          <Skeleton variant="text" width="95%" height={14} />
          <Skeleton variant="text" width="90%" height={14} />
          <Skeleton variant="text" width="80%" height={14} />
        </div>
      </div>
    </main>
  );
}
