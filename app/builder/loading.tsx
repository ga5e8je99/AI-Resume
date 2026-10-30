import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import BrandedLoader from '@/components/brand/BrandedLoader';

export default function BuilderLoading() {
  return (
    <div
      role="status"
      aria-label="Preparing resume builder workspace"
      aria-live="polite"
      className="min-h-screen bg-bg flex flex-col"
    >
      <span className="sr-only">Preparing resume builder workspace...</span>
      {/* Top bar skeleton */}
      <header className="h-14 bg-surface border-b border-border px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width={28} height={28} />
          <Skeleton variant="text" width={140} height={16} />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" width={70} height={32} className="rounded-md" />
          <Skeleton variant="rectangular" width={90} height={32} className="rounded-md" />
          <Skeleton variant="circular" width={32} height={32} />
        </div>
      </header>

      {/* Dual pane editor skeleton */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Form Skeleton */}
        <div className="w-full lg:w-[480px] xl:w-[540px] p-6 border-e border-border space-y-5 bg-surface/50">
          <Skeleton variant="text" width="60%" height={24} />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton variant="text" width="30%" height={14} />
                <Skeleton variant="rectangular" height={40} className="rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Canvas Preview with Centered Branded Loader */}
        <div className="flex-1 p-8 bg-paper flex items-center justify-center relative">
          <div className="w-full max-w-[650px] aspect-[1/1.414] bg-surface rounded-lg border border-border p-8 flex flex-col items-center justify-center shadow-card relative overflow-hidden">
            <BrandedLoader size="md" />
          </div>
        </div>
      </div>
    </div>
  );
}
