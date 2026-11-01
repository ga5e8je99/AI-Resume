import type * as SentryTypes from '@sentry/nextjs';

let sentryModulePromise: Promise<typeof SentryTypes | null> | null = null;
let sentryInitialized = false;

export type SentryAlertCategory =
  | 'webhook_failure'
  | 'payment_failure'
  | 'high_5xx_rate'
  | 'ai_failure';

export interface OperationalAlertRecord {
  id: string;
  category: SentryAlertCategory;
  title: string;
  message: string;
  severity: 'warning' | 'error' | 'fatal';
  environment: string;
  release: string;
  tags: Record<string, string>;
  metadata?: Record<string, any>;
  timestamp: string;
}

const recentOperationalAlerts: OperationalAlertRecord[] = [];
const server5xxTimestamps: number[] = [];
let last5xxAlertSentAt = 0;

/**
 * Resolves the canonical Sentry environment tag (`production`, `preview`, `staging`, `development`, `test`).
 */
export function getSentryEnvironment(): string {
  return (
    process.env.SENTRY_ENVIRONMENT ||
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
    process.env.NEXT_PUBLIC_VERCEL_ENV ||
    process.env.VERCEL_ENV ||
    process.env.NODE_ENV ||
    'development'
  );
}

/**
 * Resolves the canonical Sentry release tag.
 */
export function getSentryRelease(): string {
  return (
    process.env.SENTRY_RELEASE ||
    process.env.NEXT_PUBLIC_SENTRY_RELEASE ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    'jobmatch-ai@0.1.0'
  );
}

/**
 * Bot & Crawler User-Agent signatures to ignore in Sentry
 */
const BOT_USER_AGENT_REGEX =
  /googlebot|bingbot|yandexbot|baiduspider|duckduckbot|slurp|ahrefsbot|semrushbot|mj12bot|dotbot|petalbot|bytespider|facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|whatsapp|applebot|uptimerobot|pingdom|statuscake|datadog|newrelic|headlesschrome|phantomjs|prerender|chrome-lighthouse|gtmetrix|screaming frog|crawler|spider|bot\b/i;

/**
 * Benign browser/extension noise that should not pollute Sentry alerts
 */
const IGNORED_ERROR_MESSAGE_REGEX =
  /ResizeObserver loop limit exceeded|ResizeObserver loop completed with undelivered notifications|Non-Error exception captured|Non-Error promise rejection captured with value: undefined|webkit-masked-url|chrome-extension:\/\/|moz-extension:\/\//i;

/**
 * Returns true if the given User-Agent string belongs to a crawler, bot, or uptime probe.
 */
export function isBotUserAgent(userAgent?: string | null): boolean {
  if (!userAgent || typeof userAgent !== 'string') return false;
  return BOT_USER_AGENT_REGEX.test(userAgent);
}

/**
 * Inspects a Sentry event (headers, contexts, exception message, and runtime navigator)
 * to determine if it came from an automated bot/crawler or benign extension noise.
 */
export function shouldIgnoreSentryEvent(event: SentryTypes.ErrorEvent): boolean {
  try {
    // 1. Check request headers (User-Agent)
    const headers = event.request?.headers || {};
    const reqUa =
      headers['user-agent'] ||
      headers['User-Agent'] ||
      (event.contexts as any)?.runtime?.userAgent ||
      (event.contexts as any)?.browser?.name ||
      '';
    if (isBotUserAgent(String(reqUa))) {
      return true;
    }

    // 2. Check tags for bot user-agent
    if (event.tags && isBotUserAgent(String(event.tags['user_agent'] || event.tags['userAgent'] || ''))) {
      return true;
    }

    // 3. Check browser navigator.userAgent when running client-side
    if (typeof navigator !== 'undefined' && isBotUserAgent(navigator.userAgent)) {
      return true;
    }

    // 4. Check exception messages for benign browser/bot noise
    const exceptionValues = event.exception?.values || [];
    for (const ex of exceptionValues) {
      const val = `${ex.type || ''}: ${ex.value || ''}`;
      if (IGNORED_ERROR_MESSAGE_REGEX.test(val)) {
        return true;
      }
    }

    if (event.message && IGNORED_ERROR_MESSAGE_REGEX.test(event.message)) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

function scheduleSentryAfterInteractive(callback: () => void): void {
  if (typeof window === 'undefined') {
    callback();
    return;
  }
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

function loadSentryLazy(): Promise<typeof SentryTypes | null> {
  if (!sentryModulePromise) {
    sentryModulePromise = import('@sentry/nextjs').catch((err) => {
      sentryModulePromise = null;
      console.error('[Sentry Lazy Load Error]', err);
      return null;
    });
  }
  return sentryModulePromise;
}

/**
 * PII Sanitization Patterns
 */
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi;
const BEARER_OR_TOKEN_REGEX = /(bearer\s+|token=|[?&]token=|token["']?\s*:\s*["'])([^"'\s&]+)/gi;
const SECRET_KEY_REGEX = /(sk_test_|sk_live_|whsec_|re_|pk_test_|pk_live_)[a-zA-Z0-9_-]+/gi;

/**
 * List of sensitive key names that must never be transmitted in error context or breadcrumbs
 */
const SENSITIVE_KEYS = new Set([
  'password',
  'hashedpassword',
  'token',
  'secret',
  'accesstoken',
  'refreshtoken',
  'admin_key',
  'adminkey',
  'jwt_secret',
  'authorization',
  'cookie',
  'set-cookie',
  // Resume & Personal data keys to scrub
  'personalinfo',
  'fullname',
  'email',
  'phone',
  'location',
  'experience',
  'education',
  'skills',
  'projects',
  'jobdescription',
  'extractedkeywords',
  'coverlettertext',
  'resumetext',
  'bullets',
  'content',
  'text',
  'sender',
  'recipient',
]);

/**
 * Recursively deep-scrubs objects and strings to strip any PII
 */
export function scrubPii<T = any>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    return input
      .replace(EMAIL_REGEX, '[REDACTED_EMAIL]')
      .replace(SECRET_KEY_REGEX, '[REDACTED_API_KEY]')
      .replace(BEARER_OR_TOKEN_REGEX, '$1[REDACTED_TOKEN]') as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => scrubPii(item)) as unknown as T;
  }

  if (typeof input === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lowerKey)) {
        cleaned[key] = '[REDACTED_PII]';
      } else {
        cleaned[key] = scrubPii(value);
      }
    }
    return cleaned as T;
  }

  return input;
}

/**
 * Sentry beforeSend hook:
 * 1. Drops bot/crawler errors (`shouldIgnoreSentryEvent`).
 * 2. Stamps canonical `environment` and `release` tags.
 * 3. Deep-scrubs all PII (emails, tokens, resume text).
 */
export function scrubPiiEvent(event: SentryTypes.ErrorEvent): SentryTypes.ErrorEvent | null {
  try {
    // 0. Drop bot / crawler / benign noise events immediately
    if (shouldIgnoreSentryEvent(event)) {
      return null;
    }

    // Stamp environment and release metadata
    const env = getSentryEnvironment();
    const release = getSentryRelease();
    event.environment = event.environment || env;
    event.release = event.release || release;
    event.tags = {
      ...event.tags,
      environment: event.environment,
      release: event.release,
    };

    // 1. Scrub User data: keep only anonymous ID, strip email, ip, username
    if (event.user) {
      event.user = {
        id: event.user.id || 'anonymous_user',
      };
    }

    // 2. Scrub Request headers and body
    if (event.request) {
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-admin-key'];
        event.request.headers = scrubPii(event.request.headers);
      }
      if (event.request.data) {
        event.request.data = scrubPii(event.request.data);
      }
      if (event.request.query_string) {
        event.request.query_string = scrubPii(event.request.query_string);
      }
    }

    // 3. Scrub Breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((b) => ({
        ...b,
        message: b.message ? scrubPii(b.message) : undefined,
        data: b.data ? scrubPii(b.data) : undefined,
      }));
    }

    // 4. Scrub Extra and Contexts
    if (event.extra) {
      event.extra = scrubPii(event.extra);
    }
    if (event.contexts) {
      event.contexts = scrubPii(event.contexts);
    }

    // 5. Scrub Exception message and value, plus top-level event.message
    if (event.message) {
      event.message = scrubPii(event.message);
    }
    if (event.exception?.values) {
      event.exception.values = event.exception.values.map((v) => ({
        ...v,
        value: v.value ? scrubPii(v.value) : undefined,
      }));
    }

    return event;
  } catch (err) {
    console.error('[Sentry PII Scrubber Error]', err);
    return event;
  }
}

/**
 * Checks whether Sentry monitoring is enabled
 */
export function isSentryEnabled(): boolean {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
  return process.env.NODE_ENV === 'production' && Boolean(dsn);
}

/**
 * Lazily initializes Sentry client after interactive so it never blocks LCP.
 */
export function initSentryLazy(): void {
  if (sentryInitialized || !isSentryEnabled()) return;
  sentryInitialized = true;
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
  if (!dsn) return;

  scheduleSentryAfterInteractive(() => {
    loadSentryLazy().then((sentryMod) => {
      if (!sentryMod) return;
      try {
        sentryMod.init({
          dsn,
          environment: getSentryEnvironment(),
          release: getSentryRelease(),
          tracesSampleRate: 0.1,
          replaysSessionSampleRate: 0,
          replaysOnErrorSampleRate: 0,
          beforeSend(event) {
            return scrubPiiEvent(event);
          },
        });
      } catch (err) {
        console.error('[Sentry Lazy Init Failed]', err);
      }
    });
  });
}

/**
 * Captures an exception safely with PII scrubbing, bot filtering, and graceful lazy fallback
 */
export function captureException(
  error: any,
  context?: Record<string, any> & { userAgent?: string }
): string | null {
  if (context?.userAgent && isBotUserAgent(context.userAgent)) {
    return null;
  }
  if (typeof navigator !== 'undefined' && isBotUserAgent(navigator.userAgent)) {
    return null;
  }

  const safeContext = context ? scrubPii(context) : undefined;
  const eventId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const env = getSentryEnvironment();
  const release = getSentryRelease();

  if (isSentryEnabled()) {
    scheduleSentryAfterInteractive(() => {
      loadSentryLazy().then((sentryMod) => {
        if (!sentryMod) return;
        try {
          sentryMod.captureException(error, {
            tags: {
              environment: env,
              release,
              ...(safeContext?.tags || {}),
            },
            extra: safeContext,
          });
        } catch (err) {
          console.error('[Sentry captureException Failed]', err);
        }
      });
    });
    return eventId;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[Sentry Monitor] [${eventId}] Captured:`, error?.message || error, safeContext || '');
  }
  return eventId;
}

/**
 * Captures a message safely with lazy loading
 */
export function captureMessage(
  message: string,
  level: SentryTypes.SeverityLevel = 'info',
  tags?: Record<string, string>
): string {
  const safeMessage = scrubPii(message);
  const eventId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const env = getSentryEnvironment();
  const release = getSentryRelease();

  if (isSentryEnabled()) {
    scheduleSentryAfterInteractive(() => {
      loadSentryLazy().then((sentryMod) => {
        if (!sentryMod) return;
        try {
          sentryMod.captureMessage(safeMessage, {
            level,
            tags: {
              environment: env,
              release,
              ...tags,
            },
          });
        } catch (err) {
          console.error('[Sentry captureMessage Failed]', err);
        }
      });
    });
  }
  return eventId;
}

/**
 * Emits a structured Sentry operational alert for critical platform incidents:
 * - `webhook_failure`: Payment webhook signature/payload/amount/order failure
 * - `payment_failure`: Checkout creation or subscription charge failure
 * - `high_5xx_rate`: Spike in HTTP 5xx server errors
 * - `ai_failure`: Upstream AI provider failure or circuit breaker trip
 */
export function reportOperationalAlert(params: {
  category: SentryAlertCategory;
  title: string;
  message: string;
  severity?: 'warning' | 'error' | 'fatal';
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
  userAgent?: string | null;
}): OperationalAlertRecord | null {
  if (params.userAgent && isBotUserAgent(params.userAgent)) {
    return null;
  }

  const env = getSentryEnvironment();
  const release = getSentryRelease();
  const severity = params.severity || 'error';
  const safeMeta = params.metadata ? scrubPii(params.metadata) : undefined;
  const mergedTags: Record<string, string> = {
    alert_category: params.category,
    environment: env,
    release,
    ...(params.tags || {}),
  };

  const record: OperationalAlertRecord = {
    id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    category: params.category,
    title: scrubPii(params.title),
    message: scrubPii(params.message),
    severity,
    environment: env,
    release,
    tags: mergedTags,
    metadata: safeMeta,
    timestamp: new Date().toISOString(),
  };

  recentOperationalAlerts.unshift(record);
  if (recentOperationalAlerts.length > 100) {
    recentOperationalAlerts.length = 100;
  }

  try {
    loadSentryLazy().then((sentryMod) => {
      if (!sentryMod) return;
      try {
        sentryMod.captureMessage(`[Alert:${params.category}] ${record.title}: ${record.message}`, {
          level: severity,
          tags: mergedTags,
          extra: safeMeta,
        });
      } catch {
        // Non-blocking
      }
    });
  } catch {
    // Non-blocking
  }

  return record;
}

/**
 * Tracks HTTP 5xx server errors in a sliding 60-second window and triggers a `high_5xx_rate`
 * Sentry alert whenever the count reaches `SENTRY_5XX_ALERT_THRESHOLD` (default: 5 in 60s).
 */
export function recordServer5xxAndAlert(params: {
  endpoint: string;
  statusCode: number;
  error?: unknown;
  userAgent?: string | null;
}): OperationalAlertRecord | null {
  if (params.statusCode < 500 || params.statusCode > 599) {
    return null;
  }
  if (params.userAgent && isBotUserAgent(params.userAgent)) {
    return null;
  }

  const now = Date.now();
  const windowMs = Number(process.env.SENTRY_5XX_WINDOW_MS) || 60_000;
  const threshold = Number(process.env.SENTRY_5XX_ALERT_THRESHOLD) || 5;

  server5xxTimestamps.push(now);
  while (server5xxTimestamps.length > 0 && server5xxTimestamps[0] < now - windowMs) {
    server5xxTimestamps.shift();
  }

  const errText =
    params.error instanceof Error
      ? params.error.message
      : typeof params.error === 'string'
      ? params.error
      : `HTTP ${params.statusCode}`;

  captureException(
    params.error instanceof Error ? params.error : new Error(`HTTP ${params.statusCode} on ${params.endpoint}: ${errText}`),
    {
      tags: {
        endpoint: params.endpoint,
        status_code: String(params.statusCode),
      },
    }
  );

  if (server5xxTimestamps.length >= threshold && now - last5xxAlertSentAt > 30_000) {
    last5xxAlertSentAt = now;
    return reportOperationalAlert({
      category: 'high_5xx_rate',
      severity: 'fatal',
      title: `High 5xx Error Rate Detected (${server5xxTimestamps.length} errors / ${Math.round(windowMs / 1000)}s)`,
      message: `Endpoint ${params.endpoint} returned HTTP ${params.statusCode} (${errText}). Sliding window 5xx count: ${server5xxTimestamps.length}.`,
      tags: {
        endpoint: params.endpoint,
        status_code: String(params.statusCode),
      },
      metadata: {
        countInWindow: server5xxTimestamps.length,
        threshold,
        windowMs,
        latestEndpoint: params.endpoint,
        latestStatusCode: params.statusCode,
      },
    });
  }

  return null;
}

export function getOperationalAlertsForTesting(): OperationalAlertRecord[] {
  return [...recentOperationalAlerts];
}

export function clearOperationalAlertsForTesting(): void {
  recentOperationalAlerts.length = 0;
  server5xxTimestamps.length = 0;
  last5xxAlertSentAt = 0;
}

export const Sentry = {
  captureException,
  captureMessage,
  reportOperationalAlert,
  recordServer5xxAndAlert,
  init: initSentryLazy,
};

export default {
  scrubPii,
  scrubPiiEvent,
  isBotUserAgent,
  shouldIgnoreSentryEvent,
  getSentryEnvironment,
  getSentryRelease,
  isSentryEnabled,
  initSentryLazy,
  captureException,
  captureMessage,
  reportOperationalAlert,
  recordServer5xxAndAlert,
  getOperationalAlertsForTesting,
  clearOperationalAlertsForTesting,
  Sentry,
};
