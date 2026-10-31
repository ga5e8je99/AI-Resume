'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initPostHog, hasConsent, trackPageView } from '@/lib/analytics';
import { initSentryLazy } from '@/lib/sentry';

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Lazily initialize Sentry after interactive so it never blocks LCP
    initSentryLazy();

    // If user has already granted consent, lazily initialize PostHog after interactive
    if (hasConsent()) {
      initPostHog();
    }

    // Listen for consent status change events
    const handleConsentChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ status: 'granted' | 'denied' }>;
      if (customEvent.detail?.status === 'granted') {
        initPostHog();
      }
    };

    window.addEventListener('jobmatch_consent_changed', handleConsentChange);
    return () => {
      window.removeEventListener('jobmatch_consent_changed', handleConsentChange);
    };
  }, []);

  // Track pageviews safely without any query parameters or PII (deferred after interactive)
  useEffect(() => {
    if (hasConsent() && pathname) {
      trackPageView(pathname);
    }
  }, [pathname]);

  return <>{children}</>;
}
