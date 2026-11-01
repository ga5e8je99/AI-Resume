export const CANONICAL_FUNNEL_EVENTS = [
  'landing_view',
  'signup_started',
  'signup_completed',
  'email_verified',
  'resume_uploaded',
  'ats_scored',
  'job_search_run',
  'free_quota_exhausted',
  'pricing_viewed',
  'checkout_started',
  'payment_succeeded',
  'subscription_cancelled',
] as const;

export type CanonicalFunnelEvent = (typeof CANONICAL_FUNNEL_EVENTS)[number];

export type FunnelEvent =
  | CanonicalFunnelEvent
  | 'demo_started'
  | 'ats_scan_completed'
  | 'ai_generation_used'
  | 'credits_exhausted';

export type ConsentStatus = 'granted' | 'denied' | 'pending';

export const CONSENT_STORAGE_KEY = 'jobmatch_analytics_consent';
export const COOKIE_PREFS_STORAGE_KEY = 'jobmatch_cookie_preferences';
export const COOKIE_CONSENT_VERSION = '2026-10-31';

export interface CookiePreferences {
  necessary: true;
  analytics: boolean;
  updatedAt: string;
  version: string;
  euRegion: boolean;
}

export interface AnalyticsEventRecord {
  event: FunnelEvent | string;
  properties: Record<string, any>;
  timestamp: string;
  consented: boolean;
  source?: 'client' | 'webhook' | 'server';
}

export interface FunnelStepMetric {
  step: number;
  event: CanonicalFunnelEvent;
  labelEn: string;
  labelAr: string;
  count: number;
  conversionFromPreviousPct: number;
  conversionFromTopPct: number;
  dropOffFromPreviousPct: number;
}

export const FUNNEL_STAGE_DEFINITIONS: ReadonlyArray<{
  step: number;
  event: CanonicalFunnelEvent;
  labelEn: string;
  labelAr: string;
  category: 'acquisition' | 'activation' | 'engagement' | 'monetization' | 'retention';
}> = [
  {
    step: 1,
    event: 'landing_view',
    labelEn: 'Landing Page View',
    labelAr: 'زيارة الصفحة الرئيسية',
    category: 'acquisition',
  },
  {
    step: 2,
    event: 'signup_started',
    labelEn: 'Signup Started',
    labelAr: 'بدء التسجيل',
    category: 'acquisition',
  },
  {
    step: 3,
    event: 'signup_completed',
    labelEn: 'Signup Completed',
    labelAr: 'إتمام التسجيل',
    category: 'acquisition',
  },
  {
    step: 4,
    event: 'email_verified',
    labelEn: 'Email Verified',
    labelAr: 'تأكيد البريد الإلكتروني',
    category: 'activation',
  },
  {
    step: 5,
    event: 'resume_uploaded',
    labelEn: 'Resume Uploaded',
    labelAr: 'رفع السيرة الذاتية',
    category: 'activation',
  },
  {
    step: 6,
    event: 'ats_scored',
    labelEn: 'ATS Scored',
    labelAr: 'احتساب نتيجة ATS',
    category: 'activation',
  },
  {
    step: 7,
    event: 'job_search_run',
    labelEn: 'Job Search Run',
    labelAr: 'تشغيل بحث الوظائف',
    category: 'engagement',
  },
  {
    step: 8,
    event: 'free_quota_exhausted',
    labelEn: 'Free Quota Exhausted',
    labelAr: 'نفاد الحصة المجانية',
    category: 'monetization',
  },
  {
    step: 9,
    event: 'pricing_viewed',
    labelEn: 'Pricing Viewed',
    labelAr: 'عرض صفحة الأسعار',
    category: 'monetization',
  },
  {
    step: 10,
    event: 'checkout_started',
    labelEn: 'Checkout Started',
    labelAr: 'بدء عملية الدفع',
    category: 'monetization',
  },
  {
    step: 11,
    event: 'payment_succeeded',
    labelEn: 'Payment Succeeded (Webhook)',
    labelAr: 'نجاح الدفع (مؤكد من الـ Webhook)',
    category: 'monetization',
  },
  {
    step: 12,
    event: 'subscription_cancelled',
    labelEn: 'Subscription Cancelled',
    labelAr: 'إلغاء الاشتراك',
    category: 'retention',
  },
];

/**
 * Ready-to-import PostHog Funnel & Dashboard configuration for JobMatch AI.
 */
export const POSTHOG_FUNNEL_DASHBOARD_CONFIG = {
  name: 'JobMatch AI — End-to-End Conversion & Revenue Funnel',
  description:
    'Tracks user journey from landing_view through signup, email verification, ATS resume scoring, job search, quota exhaustion, checkout, and webhook-verified payment_succeeded.',
  funnelConversionWindowDays: 14,
  steps: FUNNEL_STAGE_DEFINITIONS.filter((s) => s.event !== 'subscription_cancelled').map(
    (s) => ({
      order: s.step,
      id: s.event,
      name: s.labelEn,
      type: 'events',
    })
  ),
  breakdowns: ['plan', 'provider', 'currency'],
  churnMonitors: ['subscription_cancelled'],
};

// In-memory log of tracked events for auditing, debugging, and verification
const analyticsEventLog: AnalyticsEventRecord[] = [];
const MAX_ANALYTICS_LOG_SIZE = 2000;

function appendAnalyticsRecord(record: AnalyticsEventRecord): void {
  analyticsEventLog.push(record);
  if (analyticsEventLog.length > MAX_ANALYTICS_LOG_SIZE) {
    analyticsEventLog.splice(0, analyticsEventLog.length - MAX_ANALYTICS_LOG_SIZE);
  }
}

let posthogInitialized = false;
let posthogInstance: any = null;
let posthogLoadingPromise: Promise<any> | null = null;
const pendingEventsQueue: Array<{ event: string; properties: Record<string, any> }> = [];

function scheduleAfterInteractive(callback: () => void): void {
  if (typeof window === 'undefined') return;
  const run = () => {
    if (typeof (window as any).requestIdleCallback === 'function') {
      (window as any).requestIdleCallback(callback, { timeout: 2500 });
    } else {
      setTimeout(callback, 200);
    }
  };
  if (typeof document !== 'undefined' && document.readyState !== 'complete') {
    window.addEventListener('load', run, { once: true });
  } else {
    run();
  }
}

function loadPostHogLazy(): Promise<any> {
  if (posthogInstance) {
    return Promise.resolve(posthogInstance);
  }
  if (!posthogLoadingPromise) {
    posthogLoadingPromise = import('posthog-js')
      .then((mod) => {
        posthogInstance = mod.default || mod;
        return posthogInstance;
      })
      .catch((err) => {
        posthogLoadingPromise = null;
        console.error('[PostHog Lazy Load Error]', err);
        return null;
      });
  }
  return posthogLoadingPromise;
}

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
 * Detect whether the user is likely in a European (EU/EEA/UK/CH) region via timezone or locale.
 * In European regions (and globally by default in JobMatch AI), PostHog is strictly blocked
 * from initializing or capturing until explicit Analytics consent is granted.
 */
export function isEuropeanRegion(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (
      tz.startsWith('Europe/') ||
      tz === 'Atlantic/Reykjavik' ||
      tz === 'Atlantic/Canary' ||
      tz === 'Atlantic/Madeira' ||
      tz === 'Atlantic/Faroe'
    ) {
      return true;
    }
    const lang = (navigator.language || '').toLowerCase();
    if (
      /-(at|be|bg|hr|cy|cz|dk|ee|fi|fr|de|gr|hu|ie|it|lv|lt|lu|mt|nl|pl|pt|ro|sk|si|es|se|gb|uk|ch|no|is|li)\b/.test(
        lang
      )
    ) {
      return true;
    }
  } catch {
    // Fallback to strict GDPR mode on error
    return true;
  }
  return false;
}

/**
 * Retrieve structured cookie preferences (`Necessary` vs `Analytics`)
 */
export function getCookiePreferences(): CookiePreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(COOKIE_PREFS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.analytics === 'boolean') {
        return {
          necessary: true,
          analytics: parsed.analytics,
          updatedAt: parsed.updatedAt || new Date().toISOString(),
          version: parsed.version || COOKIE_CONSENT_VERSION,
          euRegion: Boolean(parsed.euRegion ?? isEuropeanRegion()),
        };
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return null;
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
    const prefs = getCookiePreferences();
    if (prefs) {
      return prefs.analytics ? 'granted' : 'denied';
    }
  } catch {
    // Intentionally ignored: localStorage may be unavailable in private browsing or restricted iframes
  }
  return 'pending';
}

/**
 * Check if analytics tracking is explicitly consented by user
 */
export function hasConsent(): boolean {
  return getConsentStatus() === 'granted';
}

/**
 * Set and persist user analytics consent (`Necessary` is always true; `Analytics` is controlled by status).
 * If granted, dynamically initializes PostHog.
 * If denied, opts out / disables PostHog tracking and clears queued events.
 */
export function setConsentStatus(status: 'granted' | 'denied'): void {
  if (typeof window === 'undefined') return;

  const prefs: CookiePreferences = {
    necessary: true,
    analytics: status === 'granted',
    updatedAt: new Date().toISOString(),
    version: COOKIE_CONSENT_VERSION,
    euRegion: isEuropeanRegion(),
  };

  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, status);
    localStorage.setItem(COOKIE_PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Intentionally ignored: localStorage may throw QuotaExceededError or SecurityError in private mode
  }

  if (status === 'granted') {
    initPostHog();
  } else {
    pendingEventsQueue.length = 0;
    try {
      if (posthogInstance?.__loaded) {
        posthogInstance.opt_out_capturing();
      }
    } catch {
      // Intentionally ignored: PostHog opt-out failure must never block user consent state change
    }
  }

  // Notify listeners (UI components, banner, provider)
  window.dispatchEvent(
    new CustomEvent('jobmatch_consent_changed', { detail: { status, preferences: prefs } })
  );
}

/**
 * Trigger the Cookie Consent Banner to open so the user can review or change their Necessary/Analytics preferences.
 */
export function openCookiePreferences(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('jobmatch_open_cookie_banner'));
}

/**
 * Initialize PostHog client lazily after interactive ONLY after consent is granted
 * so it never blocks LCP or bloats initial synchronous JS.
 */
export function initPostHog(): boolean {
  if (typeof window === 'undefined') return false;

  // Requirement: only initialize analytics after consent
  if (!hasConsent()) {
    return false;
  }

  if (posthogInitialized && posthogInstance?.__loaded) {
    return true;
  }

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (!posthogKey) {
    // Simulator mode for development or test environments
    posthogInitialized = true;
    return true;
  }

  posthogInitialized = true;

  scheduleAfterInteractive(() => {
    if (!hasConsent()) return;
    loadPostHogLazy().then((ph) => {
      if (!ph || !hasConsent()) return;
      try {
        if (!ph.__loaded) {
          ph.init(posthogKey, {
            api_host: posthogHost,
            person_profiles: 'identified_only',
            capture_pageview: false, // controlled manually
            capture_pageleave: true,
            autocapture: false, // prevent automated form input capturing
            disable_session_recording: true, // strict privacy
            loaded: (instance: any) => {
              instance.opt_in_capturing();
              while (pendingEventsQueue.length > 0) {
                const item = pendingEventsQueue.shift();
                if (item && hasConsent()) {
                  instance.capture(item.event, item.properties);
                }
              }
            },
          });
        } else {
          ph.opt_in_capturing();
          while (pendingEventsQueue.length > 0) {
            const item = pendingEventsQueue.shift();
            if (item && hasConsent()) {
              ph.capture(item.event, item.properties);
            }
          }
        }
      } catch (err) {
        console.error('[PostHog Init Exception]', err);
      }
    });
  });

  return true;
}

/**
 * Track a sanitized pageview lazily after interactive without blocking LCP.
 */
export function trackPageView(pathname: string): void {
  if (typeof window === 'undefined' || !pathname || !hasConsent()) return;

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!posthogKey) return;

  if (!posthogInitialized) {
    initPostHog();
  }

  scheduleAfterInteractive(() => {
    if (!hasConsent()) return;
    if (posthogInstance?.__loaded) {
      try {
        posthogInstance.capture('$pageview', { $current_url: pathname });
      } catch {
        // Intentionally ignored: analytics telemetry errors must never disrupt page navigation
      }
    } else {
      pendingEventsQueue.push({
        event: '$pageview',
        properties: { $current_url: pathname },
      });
    }
  });
}

/**
 * Central client-side event tracking function for the conversion funnel stages.
 * Guaranteed to:
 * 1. Check user cookie consent (aborts if not granted)
 * 2. Sanitize all properties (drops any PII or resume text)
 * 3. Forward to PostHog if configured (lazily queued if PostHog is still loading)
 */
export function trackEvent(event: FunnelEvent, properties?: Record<string, any>): boolean {
  const consented = hasConsent();
  const sanitized = sanitizeAnalyticsProperties(properties);

  // Record into audit log regardless (with consented flag)
  appendAnalyticsRecord({
    event,
    properties: sanitized,
    timestamp: new Date().toISOString(),
    consented,
    source: 'client',
  });

  // Strict consent check: if not consented, do NOT send to PostHog or server collector
  if (!consented) {
    return false;
  }

  // Forward to internal analytics collector when running in a real browser environment
  if (
    typeof window !== 'undefined' &&
    typeof window.location?.origin === 'string' &&
    window.location.origin.startsWith('http') &&
    typeof fetch === 'function'
  ) {
    scheduleAfterInteractive(() => {
      if (!hasConsent()) return;
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, properties: sanitized }),
        keepalive: true,
      }).catch(() => {
        // Never disrupt user experience on telemetry network error
      });
    });
  }

  // Ensure PostHog is initialized
  if (!posthogInitialized) {
    initPostHog();
  }

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (posthogKey) {
    if (posthogInstance?.__loaded) {
      try {
        posthogInstance.capture(event, sanitized);
        return true;
      } catch (err) {
        console.error('[PostHog Capture Error]', err);
        return false;
      }
    } else {
      pendingEventsQueue.push({ event, properties: sanitized });
      return true;
    }
  }

  // Simulation mode
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Analytics Simulator] [${event}]:`, sanitized);
  }
  return true;
}

/**
 * Server-side event tracking for authoritative backend/webhook events
 * (such as `payment_succeeded` with verified Order amounts from webhooks,
 * `subscription_cancelled`, and `email_verified`).
 * Never exposes PII; uses anonymized distinct_id when forwarding to PostHog HTTP API.
 */
export function trackServerEvent(
  event: FunnelEvent,
  properties?: Record<string, any>,
  options?: { distinctId?: string; source?: 'webhook' | 'server' }
): AnalyticsEventRecord {
  const sanitized = sanitizeAnalyticsProperties(properties);
  const record: AnalyticsEventRecord = {
    event,
    properties: sanitized,
    timestamp: new Date().toISOString(),
    consented: true,
    source: options?.source || 'server',
  };

  appendAnalyticsRecord(record);

  const posthogKey = process.env.POSTHOG_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = (
    process.env.POSTHOG_HOST ||
    process.env.NEXT_PUBLIC_POSTHOG_HOST ||
    'https://us.i.posthog.com'
  ).replace(/\/+$/, '');

  if (posthogKey && typeof fetch === 'function') {
    const rawId = options?.distinctId ? String(options.distinctId) : 'server_webhook';
    // Strip any email pattern from distinct_id
    const safeDistinctId = /\S+@\S+\.\S+/.test(rawId) ? 'anon_user' : `usr_${rawId.slice(0, 32)}`;

    fetch(`${posthogHost}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: posthogKey,
        event,
        distinct_id: safeDistinctId,
        properties: {
          ...sanitized,
          $lib: 'jobmatch-server',
          event_source: record.source,
        },
        timestamp: record.timestamp,
      }),
    }).catch(() => {
      // Non-blocking: PostHog network errors must never fail a payment webhook
    });
  }

  return record;
}

// ============================================================================
// TYPED FUNNEL HELPERS (Guaranteed zero resume or PII leakage)
// ============================================================================

export function trackLandingView(properties?: {
  locale?: string;
  path?: string;
  source?: string;
}): boolean {
  return trackEvent('landing_view', {
    locale: properties?.locale || 'en',
    path: properties?.path || '/',
    source: properties?.source || 'direct',
  });
}

export function trackSignupStarted(properties?: {
  source?: string;
  method?: string;
}): boolean {
  return trackEvent('signup_started', {
    source: properties?.source || 'register_page',
    method: properties?.method || 'email',
  });
}

export function trackSignupCompleted(plan: 'free' | 'pro' = 'free'): boolean {
  return trackEvent('signup_completed', { plan });
}

export function trackEmailVerified(properties?: { method?: string }): boolean {
  return trackEvent('email_verified', {
    method: properties?.method || 'token',
  });
}

export function trackResumeUploaded(properties?: {
  fileType?: string;
  source?: 'landing' | 'review' | 'jobs' | 'builder' | string;
}): boolean {
  return trackEvent('resume_uploaded', {
    fileType: (properties?.fileType || 'pdf').toLowerCase().replace(/^\./, ''),
    source: properties?.source || 'review',
  });
}

export function trackAtsScored(score?: number, matchLabel?: string): boolean {
  const roundedScore = typeof score === 'number' && Number.isFinite(score) ? Math.round(score) : undefined;
  return trackEvent('ats_scored', {
    score: roundedScore,
    matchLabel: matchLabel || 'completed',
  });
}

/**
 * Legacy alias preserved for backward compatibility with existing suites;
 * also records `ats_scan_completed` with `score`.
 */
export function trackAtsScanCompleted(score?: number, matchLabel?: string): boolean {
  const roundedScore = typeof score === 'number' && Number.isFinite(score) ? Math.round(score) : undefined;
  return trackEvent('ats_scan_completed', {
    score: roundedScore,
    matchLabel: matchLabel || 'completed',
  });
}

export function trackJobSearchRun(properties?: {
  country?: string;
  remoteOnly?: boolean;
  seniority?: string;
  resultsCount?: number;
  cached?: boolean;
}): boolean {
  return trackEvent('job_search_run', {
    country: properties?.country || 'eg',
    remoteOnly: Boolean(properties?.remoteOnly),
    seniority: properties?.seniority || 'mid',
    resultsCount: typeof properties?.resultsCount === 'number' ? properties.resultsCount : 0,
    cached: Boolean(properties?.cached),
  });
}

export function trackFreeQuotaExhausted(properties?: {
  feature?: 'job_search' | 'cover_letter' | 'resume_ai' | 'upgrade_modal' | 'credits' | string;
  reason?: string;
}): boolean {
  return trackEvent('free_quota_exhausted', {
    feature: properties?.feature || 'credits',
    reason: properties?.reason || 'insufficient_credits',
  });
}

export function trackDemoStarted(): boolean {
  return trackEvent('demo_started', { role: 'demo' });
}

export function trackAiGenerationUsed(
  generationType: 'cover_letter' | 'resume_rewrite' | 'ats_tips' = 'cover_letter'
): boolean {
  return trackEvent('ai_generation_used', { generationType });
}

export function trackCreditsExhausted(): boolean {
  return trackEvent('credits_exhausted', { reason: 'insufficient_credits' });
}

export function trackPricingViewed(planId?: string): boolean {
  return trackEvent('pricing_viewed', {
    selectedPlan: planId || 'all',
    plan: planId || 'all',
  });
}

/**
 * Tracks `checkout_started` with `plan` and `provider` (plus `currency` and `planId`).
 * Supports both `(plan, provider, currency)` and legacy `(planId, currency)` calls.
 */
export function trackCheckoutStarted(
  plan: string,
  providerOrCurrency: string = 'lemonsqueezy',
  currency?: string
): boolean {
  const upperSecond = (providerOrCurrency || '').toUpperCase();
  const isSecondArgCurrency = upperSecond === 'USD' || upperSecond === 'EGP';
  const resolvedCurrency = currency || (isSecondArgCurrency ? upperSecond : 'USD');
  const resolvedProvider = isSecondArgCurrency
    ? resolvedCurrency === 'EGP'
      ? 'paymob'
      : 'lemonsqueezy'
    : providerOrCurrency || 'lemonsqueezy';

  return trackEvent('checkout_started', {
    plan,
    planId: plan,
    provider: resolvedProvider,
    currency: resolvedCurrency,
  });
}

/**
 * Client-side helper for `payment_succeeded`.
 * Must ONLY be called after `/api/orders/status` confirms `status === 'paid'` from the stored Order
 * (which is updated exclusively by verified payment webhooks — never from URL parameters).
 */
export function trackPaymentSucceeded(
  planId: string,
  amount: number,
  currency: string,
  provider: string = 'lemonsqueezy',
  source: 'webhook' | 'verified_order' = 'verified_order'
): boolean {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
    return false;
  }
  return trackEvent('payment_succeeded', {
    plan: planId,
    planId,
    provider,
    amount,
    currency,
    source,
    webhookVerified: true,
  });
}

/**
 * Server-side webhook helper for `payment_succeeded`.
 * Called directly inside verified webhook handlers (`/api/webhooks/lemonsqueezy`, `/api/webhooks/payment`)
 * using the verified Order amount & currency.
 */
export function trackServerPaymentSucceeded(params: {
  userId?: string;
  plan: string;
  provider: 'lemonsqueezy' | 'stripe' | 'paymob' | string;
  amount: number;
  currency: string;
  billingCycle?: string;
  orderReference?: string;
}): AnalyticsEventRecord {
  return trackServerEvent(
    'payment_succeeded',
    {
      plan: params.plan,
      planId: params.plan,
      provider: params.provider,
      amount: Number(params.amount),
      currency: String(params.currency || 'USD').toUpperCase(),
      billingCycle: params.billingCycle || 'none',
      orderReference: params.orderReference,
      source: 'webhook',
      webhookVerified: true,
    },
    { distinctId: params.userId, source: 'webhook' }
  );
}

/**
 * Client-side helper for `subscription_cancelled`.
 */
export function trackSubscriptionCancelled(
  plan: string = 'pro',
  provider: string = 'lemonsqueezy',
  reason: string = 'user_cancelled'
): boolean {
  return trackEvent('subscription_cancelled', {
    plan,
    planId: plan,
    provider,
    reason,
  });
}

/**
 * Server-side webhook / account deletion helper for `subscription_cancelled`.
 */
export function trackServerSubscriptionCancelled(params: {
  userId?: string;
  plan?: string;
  provider: 'lemonsqueezy' | 'stripe' | 'paymob' | string;
  reason?: string;
}): AnalyticsEventRecord {
  return trackServerEvent(
    'subscription_cancelled',
    {
      plan: params.plan || 'pro',
      planId: params.plan || 'pro',
      provider: params.provider,
      reason: params.reason || 'webhook_cancelled',
      source: 'webhook',
    },
    { distinctId: params.userId, source: 'webhook' }
  );
}

/**
 * Computes funnel step counts and conversion/drop-off percentages from event logs
 * and optional baseline database counts.
 */
export function computeFunnelSummary(
  baselineCounts?: Partial<Record<CanonicalFunnelEvent, number>>
): {
  steps: FunnelStepMetric[];
  overallConversionPct: number;
  churnCount: number;
} {
  const consentedEvents = analyticsEventLog.filter((e) => e.consented);
  const rawCounts: Record<CanonicalFunnelEvent, number> = {
    landing_view: 0,
    signup_started: 0,
    signup_completed: 0,
    email_verified: 0,
    resume_uploaded: 0,
    ats_scored: 0,
    job_search_run: 0,
    free_quota_exhausted: 0,
    pricing_viewed: 0,
    checkout_started: 0,
    payment_succeeded: 0,
    subscription_cancelled: 0,
  };

  for (const item of consentedEvents) {
    if (item.event in rawCounts) {
      rawCounts[item.event as CanonicalFunnelEvent] += 1;
    } else if (item.event === 'ats_scan_completed') {
      rawCounts.ats_scored += 1;
    } else if (item.event === 'credits_exhausted') {
      rawCounts.free_quota_exhausted += 1;
    }
  }

  if (baselineCounts) {
    for (const key of CANONICAL_FUNNEL_EVENTS) {
      const dbVal = baselineCounts[key];
      if (typeof dbVal === 'number' && dbVal > rawCounts[key]) {
        rawCounts[key] = dbVal;
      }
    }
  }

  const topCount = Math.max(1, rawCounts.landing_view || rawCounts.signup_started || 1);
  const steps: FunnelStepMetric[] = FUNNEL_STAGE_DEFINITIONS.map((def, idx) => {
    const count = rawCounts[def.event] || 0;
    const prevEvent = idx > 0 ? FUNNEL_STAGE_DEFINITIONS[idx - 1].event : def.event;
    const prevCount = idx > 0 ? Math.max(1, rawCounts[prevEvent] || count || 1) : Math.max(1, count || 1);

    const conversionFromPreviousPct =
      idx === 0
        ? 100
        : def.event === 'subscription_cancelled'
        ? rawCounts.payment_succeeded > 0
          ? Math.min(100, Math.round((count / rawCounts.payment_succeeded) * 100))
          : 0
        : Math.min(100, Math.round((count / prevCount) * 100));

    const conversionFromTopPct = Math.min(100, Math.round((count / topCount) * 100));
    const dropOffFromPreviousPct = Math.max(0, 100 - conversionFromPreviousPct);

    return {
      step: def.step,
      event: def.event,
      labelEn: def.labelEn,
      labelAr: def.labelAr,
      count,
      conversionFromPreviousPct,
      conversionFromTopPct,
      dropOffFromPreviousPct,
    };
  });

  const overallConversionPct =
    rawCounts.landing_view > 0
      ? Math.min(100, Number(((rawCounts.payment_succeeded / rawCounts.landing_view) * 100).toFixed(2)))
      : 0;

  return {
    steps,
    overallConversionPct,
    churnCount: rawCounts.subscription_cancelled,
  };
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
  CANONICAL_FUNNEL_EVENTS,
  FUNNEL_STAGE_DEFINITIONS,
  POSTHOG_FUNNEL_DASHBOARD_CONFIG,
  trackEvent,
  trackServerEvent,
  hasConsent,
  getConsentStatus,
  setConsentStatus,
  getCookiePreferences,
  isEuropeanRegion,
  openCookiePreferences,
  initPostHog,
  sanitizeAnalyticsProperties,
  trackLandingView,
  trackSignupStarted,
  trackSignupCompleted,
  trackEmailVerified,
  trackResumeUploaded,
  trackAtsScored,
  trackAtsScanCompleted,
  trackJobSearchRun,
  trackFreeQuotaExhausted,
  trackDemoStarted,
  trackAiGenerationUsed,
  trackCreditsExhausted,
  trackPricingViewed,
  trackCheckoutStarted,
  trackPaymentSucceeded,
  trackServerPaymentSucceeded,
  trackSubscriptionCancelled,
  trackServerSubscriptionCancelled,
  computeFunnelSummary,
  getAnalyticsLog,
  clearAnalyticsLog,
};
