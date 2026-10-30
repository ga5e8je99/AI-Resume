'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initPostHog, hasConsent } from '@/lib/analytics';
import posthog from 'posthog-js';

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // If user has already granted consent, initialize PostHog
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

  // Track pageviews safely without any query parameters or PII
  useEffect(() => {
    if (hasConsent() && posthog.__loaded && pathname) {
      posthog.capture('$pageview', {
        $current_url: pathname,
      });
    }
  }, [pathname]);

  return <>{children}</>;
}
