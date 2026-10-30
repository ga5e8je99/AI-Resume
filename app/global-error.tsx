'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RotateCcw, Home, AlertTriangle, ShieldAlert } from 'lucide-react';
import { captureException } from '@/lib/sentry';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('JobMatch Global Root Error caught:', error);
    captureException(error, { digest: error.digest, boundary: 'app/global-error' });
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-paper text-ink min-h-[100dvh] flex flex-col justify-center items-center px-4 py-12 relative font-sans antialiased">
        <main className="w-full max-w-lg relative z-10 text-center">
          {/* Brand Mark */}
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-[8px] bg-accent flex items-center justify-center font-serif font-bold text-on-accent text-lg">
              J
            </div>
            <span className="text-xl font-serif font-semibold text-ink tracking-tight">
              JobMatch AI
            </span>
          </div>

          {/* Card */}
          <div className="bg-surface border border-line-strong rounded-[10px] p-8 sm:p-10 shadow-subtle text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-danger-soft text-danger text-xs font-mono font-semibold mb-6">
              <ShieldAlert className="w-3.5 h-3.5 text-danger" />
              <span>Critical System Boundary</span>
            </div>

            {/* Icon */}
            <div className="mb-6 flex items-center justify-center">
              <div className="w-16 h-16 rounded-[8px] bg-danger-soft text-danger flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-danger" />
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-ink tracking-tight mb-2.5">
              System Interruption
            </h1>
            <p className="text-base text-ink-2 font-medium mb-3">
              A critical error interrupted the core application.
            </p>
            <p className="text-xs sm:text-sm text-ink-3 leading-relaxed max-w-md mx-auto mb-8">
              We have safely isolated the error. Please reload the application or return to the main dashboard.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                id="global-error-retry-btn"
                onClick={() => reset()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-[6px] bg-accent hover:bg-accent-hover text-on-accent font-medium text-sm transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
                <span>Reload Application</span>
              </button>

              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-[6px] border border-line-strong bg-surface hover:bg-surface-2 text-ink font-medium text-sm transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4 shrink-0 text-ink-3" />
                <span>Go to Home</span>
              </Link>
            </div>

            {error.digest && (
              <p className="mt-8 pt-4 border-t border-line text-[11px] text-ink-3 font-mono">
                Reference ID: {error.digest}
              </p>
            )}
          </div>
        </main>
      </body>
    </html>
  );
}
