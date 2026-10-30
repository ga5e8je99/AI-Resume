import React from 'react';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading page content"
      aria-live="polite"
      className="min-h-screen bg-bg text-text-primary flex flex-col transition-colors"
    >
      <span className="sr-only">Loading page content, please wait...</span>

      {/* Top Navigation Skeleton */}
      <header className="h-16 bg-surface/80 border-b border-border px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="text" width={110} height={18} />
        </div>
        <div className="hidden md:flex items-center gap-6">
          <Skeleton variant="text" width={60} height={14} />
          <Skeleton variant="text" width={60} height={14} />
          <Skeleton variant="text" width={60} height={14} />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton variant="rectangular" width={75} height={32} className="rounded-md" />
          <Skeleton variant="rectangular" width={110} height={32} className="rounded-md" />
        </div>
      </header>

      {/* Main Content Area Skeleton */}
      <main className="max-w-[1200px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 flex-1">
        <div className="space-y-3 max-w-2xl">
          <Skeleton variant="text" width="55%" height={32} />
          <Skeleton variant="text" width="85%" height={16} />
          <Skeleton variant="text" width="70%" height={16} />
        </div>

        {/* Structured Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Sub-section skeleton */}
        <div className="p-6 rounded-xl border border-border bg-surface space-y-4">
          <Skeleton variant="text" width="30%" height={20} />
          <div className="space-y-2">
            <Skeleton variant="text" width="95%" height={14} />
            <Skeleton variant="text" width="90%" height={14} />
            <Skeleton variant="text" width="80%" height={14} />
          </div>
        </div>
      </main>
    </div>
  );
}
