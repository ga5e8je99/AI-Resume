import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { JobCardSkeleton } from './_components/JobCard';

export default function JobsLoading() {
  return (
    <div className="min-h-[100dvh] bg-paper text-ink" role="status" aria-busy="true">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full space-y-8">
        {/* Top Header & Quota Status Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-line-strong">
          <div className="space-y-2">
            <Skeleton className="h-5 w-44 rounded-full" />
            <Skeleton className="h-9 w-80 sm:w-96 rounded-md" />
            <Skeleton className="h-4 w-full max-w-xl rounded" />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Skeleton className="h-12 w-44 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>

        {/* Parameters & Profile Extraction Card */}
        <div className="rounded-xl border border-line-strong bg-surface p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line-strong">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-64 rounded" />
              <Skeleton className="h-3.5 w-80 rounded" />
            </div>
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-9 w-40 rounded-lg" />
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2 space-y-2">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-9 w-full rounded-lg" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-28 rounded" />
                <Skeleton className="h-6 w-28 rounded" />
                <Skeleton className="h-6 w-28 rounded" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          </div>

          <Skeleton className="h-12 w-full rounded-lg" />
        </div>

        {/* Matched Job Cards Skeleton matching JobCard */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-56 rounded" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-32 rounded-lg" />
            </div>
          </div>

          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
