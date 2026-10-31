import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function PricingLoading() {
  return (
    <main
      id="main-content"
      role="status"
      aria-label="Loading Pricing"
      aria-live="polite"
      className="max-w-[1160px] mx-auto px-4 sm:px-6 py-12 md:py-20 w-full text-start flex-1 min-h-[calc(100dvh-4rem)] bg-paper text-ink"
    >
      <span className="sr-only">Loading pricing plans and options...</span>

      {/* 1. Header & PaymentMethodPicker + BillingToggle (Matches app/pricing/page.tsx) */}
      <div className="max-w-2xl mx-auto text-center mb-10 space-y-3">
        <Skeleton variant="rectangular" width={96} height={18} className="rounded-full mx-auto" />
        <Skeleton variant="text" width="75%" height={44} className="mx-auto" />
        <Skeleton variant="text" width="65%" height={18} className="mx-auto" />

        <div className="flex flex-wrap items-start justify-center gap-3 pt-4">
          <Skeleton variant="rectangular" width={290} height={44} className="rounded-[8px]" />
          <Skeleton variant="rectangular" width={220} height={44} className="rounded-[8px]" />
        </div>
      </div>

      {/* 2. 3 PlanCards Grid (Free, Pro Highlighted, Pay-As-You-Go) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch mb-16">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`rounded-[10px] p-6 sm:p-7 bg-surface flex flex-col justify-between space-y-6 ${
              i === 1
                ? 'border-2 border-accent ring-1 ring-accent shadow-card'
                : 'border border-line-strong shadow-subtle'
            }`}
          >
            <div className="space-y-5">
              <div className="space-y-2">
                <Skeleton variant="text" width="45%" height={22} />
                <Skeleton variant="text" width="85%" height={14} />
              </div>

              <div className="space-y-1.5 py-2 border-y border-line-strong">
                <Skeleton variant="text" width="55%" height={40} />
                <Skeleton variant="text" width="40%" height={12} />
              </div>

              <Skeleton variant="rectangular" height={42} className="rounded-md w-full" />

              <div className="space-y-3 pt-2">
                {[...Array(6)].map((_, j) => (
                  <div key={j} className="flex items-center gap-2.5">
                    <Skeleton variant="circular" width={16} height={16} />
                    <Skeleton variant="text" width={`${72 + ((j * 7) % 20)}%`} height={13} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Security & Guarantees Strip */}
      <div className="rounded-[8px] border border-line-strong bg-surface p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <Skeleton variant="circular" width={18} height={18} />
            <Skeleton variant="text" width="75%" height={14} />
          </div>
        ))}
      </div>

      {/* 4. Plan Comparison Table Skeleton */}
      <div className="mb-16 space-y-4">
        <div className="space-y-1.5">
          <Skeleton variant="text" width={220} height={28} />
          <Skeleton variant="text" width={300} height={14} />
        </div>
        <div className="rounded-[8px] border border-line-strong bg-surface overflow-hidden divide-y divide-line-strong">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 grid grid-cols-4 gap-4 items-center">
              <Skeleton variant="text" width="80%" height={14} />
              <Skeleton variant="text" width="50%" height={14} />
              <Skeleton variant="text" width="60%" height={14} />
              <Skeleton variant="text" width="50%" height={14} />
            </div>
          ))}
        </div>
      </div>

      {/* 5. FAQ Section Skeleton */}
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton variant="text" width={240} height={28} className="mx-auto" />
        <div className="space-y-2.5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-[8px] border border-line-strong bg-surface flex justify-between items-center"
            >
              <Skeleton variant="text" width="65%" height={16} />
              <Skeleton variant="circular" width={20} height={20} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
