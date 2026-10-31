import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function CvBuilderLoading() {
  return (
    <div
      role="status"
      aria-label="Preparing CV builder workspace"
      aria-live="polite"
      className="min-h-[100dvh] bg-paper text-ink flex flex-col"
    >
      <span className="sr-only">Preparing CV builder workspace...</span>
      <header className="h-14 bg-surface border-b border-line-strong px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width={28} height={28} />
          <Skeleton variant="text" width={160} height={16} />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" width={80} height={32} className="rounded-md" />
          <Skeleton variant="circular" width={32} height={32} />
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="w-full lg:w-[480px] p-6 border-e border-line-strong space-y-4 bg-surface">
          <Skeleton variant="text" width="50%" height={24} />
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={42} className="rounded-md" />
            ))}
          </div>
        </div>

        <div className="flex-1 p-8 bg-paper flex items-center justify-center">
          <div className="w-full max-w-[650px] aspect-[1/1.414] bg-surface rounded-lg border border-line-strong p-8 space-y-5 shadow-card">
            <Skeleton variant="text" width="55%" height={26} />
            <Skeleton variant="text" width="35%" height={14} />
            <div className="space-y-2 pt-3 border-t border-line-strong">
              <Skeleton variant="text" width="95%" height={12} />
              <Skeleton variant="text" width="90%" height={12} />
              <Skeleton variant="text" width="80%" height={12} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
