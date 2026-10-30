import React from 'react';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

export default function JobsLoading() {
  return (
    <div
      role="status"
      aria-label="Loading Job Match"
      aria-live="polite"
      className="min-h-screen bg-bg text-text-primary flex flex-col"
    >
      <span className="sr-only">Loading job match positions and platform links...</span>

      {/* Header Skeleton */}
      <header className="h-16 bg-surface border-b border-border px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="text" width={130} height={18} />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton variant="rectangular" width={90} height={34} className="rounded-md" />
          <Skeleton variant="circular" width={36} height={36} />
        </div>
      </header>

      <main className="max-w-[1240px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Search & Profile Parameters Card Skeleton */}
        <div className="p-6 rounded-xl border border-border bg-surface space-y-4 shadow-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1 max-w-md">
              <Skeleton variant="text" width="60%" height={22} />
              <Skeleton variant="text" width="90%" height={14} />
            </div>
            <Skeleton variant="rectangular" width={140} height={38} className="rounded-md" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <Skeleton variant="rectangular" height={40} className="rounded-md" />
            <Skeleton variant="rectangular" height={40} className="rounded-md" />
            <Skeleton variant="rectangular" height={40} className="rounded-md" />
          </div>
        </div>

        {/* 10 Platforms Panel Skeleton */}
        <div className="p-5 rounded-xl border border-border bg-surface space-y-3 shadow-subtle">
          <div className="flex items-center justify-between">
            <Skeleton variant="text" width={220} height={18} />
            <Skeleton variant="text" width={80} height={12} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-3 rounded-lg border border-border bg-bg space-y-2">
                <Skeleton variant="text" width="70%" height={14} />
                <Skeleton variant="text" width="40%" height={10} />
              </div>
            ))}
          </div>
        </div>

        {/* Jobs List Header & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-3">
            <Skeleton variant="text" width={180} height={22} />
            <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton variant="rectangular" width={80} height={32} className="rounded-md" />
            <Skeleton variant="rectangular" width={100} height={32} className="rounded-md" />
          </div>
        </div>

        {/* Job Cards Skeleton List */}
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-xl border border-border bg-surface space-y-3 shadow-subtle"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton variant="text" width="45%" height={18} />
                    <Skeleton variant="rectangular" width={70} height={20} className="rounded-full" />
                  </div>
                  <Skeleton variant="text" width="30%" height={14} />
                </div>
                <Skeleton variant="rectangular" width={90} height={34} className="rounded-md" />
              </div>
              <div className="flex gap-2 pt-1">
                <Skeleton variant="rectangular" width={60} height={20} className="rounded" />
                <Skeleton variant="rectangular" width={80} height={20} className="rounded" />
                <Skeleton variant="rectangular" width={70} height={20} className="rounded" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
