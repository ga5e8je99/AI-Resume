import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ResumeGenerateLoading() {
  return (
    <main
      id="main-content"
      role="status"
      aria-label="Loading AI Resume Generator"
      aria-live="polite"
      className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 min-h-[calc(100dvh-4rem)] bg-paper text-ink"
    >
      <span className="sr-only">Loading AI Resume Generator...</span>

      {/* Header Skeleton */}
      <div className="max-w-3xl mx-auto text-center space-y-3">
        <Skeleton variant="rectangular" width={180} height={24} className="rounded-full mx-auto" />
        <Skeleton variant="text" width="70%" height={40} className="mx-auto" />
        <Skeleton variant="text" width="85%" height={16} className="mx-auto" />
      </div>

      {/* Form Sections Skeleton */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="rounded-xl border border-line-strong bg-surface p-5 sm:p-6 space-y-4">
          <Skeleton variant="text" width={200} height={16} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Skeleton variant="rectangular" height={96} className="rounded-xl" />
            <Skeleton variant="rectangular" height={96} className="rounded-xl" />
          </div>
        </div>

        <div className="rounded-xl border border-line-strong bg-surface p-5 sm:p-6 space-y-4">
          <Skeleton variant="text" width={220} height={16} />
          <Skeleton variant="rectangular" height={42} className="rounded-lg" />
          <Skeleton variant="rectangular" height={104} className="rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton variant="rectangular" height={40} className="rounded-lg" />
            <Skeleton variant="rectangular" height={40} className="rounded-lg" />
          </div>
        </div>

        <Skeleton variant="rectangular" height={48} className="rounded-md w-full sm:w-64" />
      </div>
    </main>
  );
}
