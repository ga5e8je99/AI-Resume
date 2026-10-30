import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function PricingLoading() {
  return (
    <div
      role="status"
      aria-label="Loading Pricing"
      aria-live="polite"
      className="min-h-screen bg-bg text-text-primary flex flex-col"
    >
      <span className="sr-only">Loading pricing plans and options...</span>

      {/* Header Skeleton */}
      <header className="h-16 bg-surface border-b border-border px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="text" width={120} height={18} />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton variant="rectangular" width={80} height={32} className="rounded-md" />
          <Skeleton variant="rectangular" width={100} height={32} className="rounded-md" />
        </div>
      </header>

      <main className="max-w-[1200px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-10">
        {/* Title & Toggle Section Skeleton */}
        <div className="text-center max-w-xl mx-auto space-y-4 pt-4">
          <Skeleton variant="rectangular" width={90} height={24} className="rounded-full mx-auto" />
          <Skeleton variant="text" width="80%" height={36} className="mx-auto" />
          <Skeleton variant="text" width="60%" height={16} className="mx-auto" />
          <div className="pt-2 flex justify-center">
            <Skeleton variant="rectangular" width={220} height={40} className="rounded-lg" />
          </div>
        </div>

        {/* 3 Pricing Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`p-6 sm:p-8 rounded-2xl border bg-surface space-y-6 shadow-subtle ${
                i === 1 ? 'border-brand/40 ring-1 ring-brand/20' : 'border-border'
              }`}
            >
              <div className="space-y-2">
                <Skeleton variant="text" width="40%" height={20} />
                <Skeleton variant="text" width="70%" height={14} />
              </div>

              <div className="space-y-1 py-2">
                <Skeleton variant="text" width="50%" height={36} />
                <Skeleton variant="text" width="30%" height={12} />
              </div>

              <Skeleton variant="rectangular" height={44} className="rounded-lg w-full" />

              <div className="space-y-3 pt-4 border-t border-border">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="flex items-center gap-2.5">
                    <Skeleton variant="circular" width={16} height={16} />
                    <Skeleton variant="text" width={`${75 + (j % 3) * 8}%`} height={12} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section Skeleton */}
        <div className="max-w-2xl mx-auto pt-6 space-y-4">
          <Skeleton variant="text" width="40%" height={24} className="mx-auto" />
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-border bg-surface flex justify-between items-center">
                <Skeleton variant="text" width="60%" height={16} />
                <Skeleton variant="circular" width={20} height={20} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
