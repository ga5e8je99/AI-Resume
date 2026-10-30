import React from 'react';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div
      role="status"
      aria-label="Loading Dashboard"
      aria-live="polite"
      className="min-h-screen bg-bg text-text-primary flex"
    >
      <span className="sr-only">Loading dashboard, please wait...</span>

      {/* Desktop Sidebar Skeleton */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-surface border-e border-border p-4 space-y-6 shrink-0">
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="text" width={120} height={20} />
        </div>
        <div className="space-y-2 flex-1">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={38} className="rounded-md" />
          ))}
        </div>
        <Skeleton variant="rectangular" height={48} className="rounded-md" />
      </aside>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Skeleton */}
        <header className="h-16 bg-surface border-b border-border px-4 sm:px-8 flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton variant="text" width={100} height={12} />
            <Skeleton variant="text" width={160} height={18} />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton variant="rectangular" width={80} height={32} className="rounded-full" />
            <Skeleton variant="circular" width={36} height={36} />
          </div>
        </header>

        {/* Content Body Skeletons */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Welcome Banner Skeleton */}
          <div className="p-6 rounded-xl border border-border bg-surface space-y-3 shadow-subtle">
            <Skeleton variant="text" width="40%" height={24} />
            <Skeleton variant="text" width="65%" height={14} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton variant="text" width="50%" height={12} />
                  <Skeleton variant="text" width="70%" height={20} />
                </div>
              ))}
            </div>
          </div>

          {/* Section 1: Resumes Cards Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton variant="text" width={180} height={20} />
              <Skeleton variant="rectangular" width={120} height={34} className="rounded-md" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
