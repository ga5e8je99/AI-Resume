import posthog from 'posthog-js';

export type FunnelEvent =
  | 'signup_completed'
  | 'demo_started'
  | 'ats_scan_completed'
  | 'ai_generation_used'
  | 'credits_exhausted'
  | 'pricing_viewed'
  | 'checkout_started'
  | 'payment_succeeded';

export type ConsentStatus = 'granted' | 'denied' | 'pending';

export const CONSENT_STORAGE_KEY = 'jobmatch_analytics_consent';

export interface AnalyticsEventRecord {
  event: FunnelEvent | string;
  properties: Record<string, any>;
  timestamp: string;
  consented: boolean;
}

// In-memory log of tracked events for auditing, debugging, and verification
const analyticsEventLog: AnalyticsEventRecord[] = [];

let posthogInitialized = false;

/**
 * PII blacklist: keys that must never be transmitted to analytics
 */
const FORBIDDEN_ANALYTICS_KEYS = new Set([
  'email',
  'name',
  'fullname',
  'password',
  'token',
  'secret',
  'resumetext',
  'content',
  'text',
  'bullets',
  'phone',
  'location',
  'experience',
  'education',
  'skills',
  'projects',
  'jobdescription',
  'extractedkeywords',
  'address',
  'ip',
  'ip_address',
  'cookie',
  'authorization',
]);

/**
 * Sanitize event properties to strictly disallow any personal or resume content
 */
export function sanitizeAnalyticsProperties(props?: Record<string, any>): Record<string, any> {
  if (!props || typeof props !== 'object') {
    return {};
  }

  const clean: Record<string, any> = {};

  for (const [key, val] of Object.entries(props)) {
    const lowerKey = key.toLowerCase();
    if (FORBIDDEN_ANALYTICS_KEYS.has(lowerKey)) {
      continue; // completely drop sensitive properties
    }

    if (val === null || val === undefined) {
      continue;
    }

    // Never accept long string blobs (like paragraphs of resume or cover letter)
    if (typeof val === 'string') {
      if (val.length > 100) {
        continue;
      }
      // Check for email pattern
      if (/\S+@\S+\.\S+/.test(val)) {
        continue;
      }
      clean[key] = val;
    } else if (typeof val === 'number' || typeof val === 'boolean') {
      clean[key] = val;
    }
  }

  return clean;
}

/**
 * Retrieve current user consent status from localStorage
 */
export function getConsentStatus(): ConsentStatus {
  if (typeof window === 'undefined') return 'pending';
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored === 'granted' || stored === 'denied') {
      return stored;
    }
  } catch {}
  return 'pending';
}

/**
 * Check if analytics tracking is explicitly consented by user
 */
export function hasConsent(): boolean {
  return getConsentStatus() === 'granted';
}

/**
 * Set and persist user analytics consent.
 * If granted, dynamically initializes PostHog.
 * If denied, opts out / disables PostHog tracking.
 */
export function setConsentStatus(status: 'granted' | 'denied'): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, status);
  } catch {}

  if (status === 'granted') {
    initPostHog();
  } else {
    try {
      if (posthog.__loaded) {
        posthog.opt_out_capturing();
      }
    } catch {}
  }

  // Notify listeners (UI components, banner, provider)
  window.dispatchEvent(new CustomEvent('jobmatch_consent_changed', { detail: { status } }));
}

/**
 * Initialize PostHog client ONLY after consent is granted
 */
export function initPostHog(): boolean {
  if (typeof window === 'undefined') return false;

  // Requirement: only initialize analytics after consent
  if (!hasConsent()) {
    return false;
  }

  if (posthogInitialized && posthog.__loaded) {
    return true;
  }

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (!posthogKey) {
    // Simulator mode for development or test environments
    posthogInitialized = true;
    return true;
  }

  try {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      person_profiles: 'identified_only',
      capture_pageview: false, // controlled manually
      capture_pageleave: true,
      autocapture: false, // prevent automated form input capturing
      disable_session_recording: true, // strict privacy
      loaded: (ph) => {
        posthogInitialized = true;
        ph.opt_in_capturing();
      },
    });
    return true;
  } catch (err) {
    console.error('[PostHog Init Exception]', err);
    return false;
  }
}

/**
 * Central event tracking function for the 8 conversion funnel stages.
 * Guaranteed to:
 * 1. Check user consent (aborts if not granted)
 * 2. Sanitize all properties (drops any PII or resume text)
 * 3. Forward to PostHog if configured
 */
export function trackEvent(event: FunnelEvent, properties?: Record<string, any>): boolean {
  const consented = hasConsent();
  const sanitized = sanitizeAnalyticsProperties(properties);

  // Record into audit log regardless (with consented flag)
  analyticsEventLog.push({
    event,
    properties: sanitized,
    timestamp: new Date().toISOString(),
    consented,
  });

  // Strict consent check: if not consented, do NOT send to PostHog
  if (!consented) {
    return false;
  }

  // Ensure PostHog is initialized
  if (!posthogInitialized) {
    initPostHog();
  }

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (posthogKey && posthog.__loaded) {
    try {
      posthog.capture(event, sanitized);
      return true;
    } catch (err) {
      console.error('[PostHog Capture Error]', err);
      return false;
    }
  }

  // Simulation mode
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Analytics Simulator] [${event}]:`, sanitized);
  }
  return true;
}

// ============================================================================
// TYPED FUNNEL HELPERS (Guaranteed zero resume or PII leakage)
// ============================================================================

export function trackSignupCompleted(plan: 'free' | 'pro' = 'free'): boolean {
  return trackEvent('signup_completed', { plan });
}

export function trackDemoStarted(): boolean {
  return trackEvent('demo_started', { role: 'demo' });
}

export function trackAtsScanCompleted(score?: number, matchLabel?: string): boolean {
  return trackEvent('ats_scan_completed', {
    score: typeof score === 'number' ? Math.round(score) : undefined,
    matchLabel: matchLabel || 'completed',
  });
}

export function trackAiGenerationUsed(generationType: 'cover_letter' | 'resume_rewrite' | 'ats_tips' = 'cover_letter'): boolean {
  return trackEvent('ai_generation_used', { generationType });
}

export function trackCreditsExhausted(): boolean {
  return trackEvent('credits_exhausted', { reason: 'insufficient_credits' });
}

export function trackPricingViewed(planId?: string): boolean {
  return trackEvent('pricing_viewed', { selectedPlan: planId || 'all' });
}

export function trackCheckoutStarted(planId: string, currency: string = 'USD'): boolean {
  return trackEvent('checkout_started', { planId, currency });
}

export function trackPaymentSucceeded(planId: string, amount: number, currency: string): boolean {
  return trackEvent('payment_succeeded', {
    planId,
    amount: typeof amount === 'number' ? amount : undefined,
    currency,
  });
}

/**
 * Audit log access for verification & testing
 */
export function getAnalyticsLog(): AnalyticsEventRecord[] {
  return [...analyticsEventLog];
}

export function clearAnalyticsLog(): void {
  analyticsEventLog.length = 0;
}

export default {
  trackEvent,
  hasConsent,
  getConsentStatus,
  setConsentStatus,
  initPostHog,
  sanitizeAnalyticsProperties,
  trackSignupCompleted,
  trackDemoStarted,
  trackAtsScanCompleted,
  trackAiGenerationUsed,
  trackCreditsExhausted,
  trackPricingViewed,
  trackCheckoutStarted,
  trackPaymentSucceeded,
  getAnalyticsLog,
  clearAnalyticsLog,
};
