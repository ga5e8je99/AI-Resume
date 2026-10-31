import React from 'react';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div
      role="status"
      aria-label="Loading Dashboard"
      aria-live="polite"
      className="min-h-[100dvh] bg-paper text-ink flex w-full max-w-full overflow-x-hidden"
    >
      <span className="sr-only">Loading dashboard, please wait...</span>

      {/* Desktop Collapsible Sidebar Skeleton (Matches AppSidebar in AppShell) */}
      <aside className="hidden lg:flex flex-col w-64 h-[100dvh] sticky top-0 bg-surface border-e border-line-strong p-4 space-y-6 shrink-0">
        <div className="flex items-center gap-2.5 px-1">
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="text" width={120} height={20} />
        </div>
        <div className="space-y-1.5 flex-1">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={40} className="rounded-lg" />
          ))}
        </div>
        <Skeleton variant="rectangular" height={52} className="rounded-lg" />
      </aside>

      {/* Main Column (Matches AppShell Main Column) */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden pb-16 md:pb-0">
        {/* Top Bar Skeleton (Matches AppTopBar) */}
        <header className="h-16 bg-surface border-b border-line-strong px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton variant="text" width={110} height={12} />
            <Skeleton variant="text" width={190} height={20} />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton variant="rectangular" width={120} height={34} className="rounded-md" />
            <Skeleton variant="circular" width={36} height={36} />
          </div>
        </header>

        {/* Main Content Area (Matches app/dashboard/page.tsx) */}
        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="space-y-8 max-w-7xl mx-auto w-full">
            {/* Row 1: Next-Best-Action Card (2 cols) + Plan & Credits Widget (1 col) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2 rounded-xl border border-line-strong bg-surface p-5 sm:p-6 space-y-4">
                <Skeleton variant="rectangular" width={120} height={22} className="rounded-full" />
                <div className="space-y-2">
                  <Skeleton variant="text" width="60%" height={24} />
                  <Skeleton variant="text" width="85%" height={14} />
                </div>
                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  <Skeleton variant="rectangular" width={150} height={34} className="rounded-md" />
                  <Skeleton variant="rectangular" width={140} height={34} className="rounded-md" />
                  <Skeleton variant="rectangular" width={110} height={34} className="rounded-md" />
                </div>
              </div>

              <div className="rounded-xl border border-line-strong bg-surface p-5 sm:p-6 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton variant="text" width={110} height={16} />
                  <Skeleton variant="rectangular" width={64} height={22} className="rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton variant="text" width="50%" height={28} />
                  <Skeleton variant="rectangular" height={8} className="rounded-full" />
                </div>
                <Skeleton variant="rectangular" height={36} className="rounded-md w-full" />
              </div>
            </div>

            {/* Row 2: 4 KPI Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="p-4 sm:p-5 rounded-xl border border-line-strong bg-surface space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton variant="text" width="55%" height={12} />
                    <Skeleton variant="circular" width={28} height={28} />
                  </div>
                  <Skeleton variant="text" width="40%" height={26} />
                </div>
              ))}
            </div>

            {/* Row 3: Tabs Bar + Search & Sort Controls */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line-strong pb-3">
                <div className="flex items-center gap-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} variant="rectangular" width={110} height={36} className="rounded-lg" />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton variant="rectangular" width={180} height={36} className="rounded-lg" />
                  <Skeleton variant="rectangular" width={110} height={36} className="rounded-lg" />
                </div>
              </div>

              {/* Row 4: 3 Resume Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[...Array(3)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
