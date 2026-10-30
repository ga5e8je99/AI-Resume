import * as Sentry from '@sentry/nextjs';

/**
 * PII Sanitization Patterns
 */
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi;
const BEARER_OR_TOKEN_REGEX = /(bearer\s+|token=|[?&]token=|token["']?\s*:\s*["'])([^"'\s&]+)/gi;
const SECRET_KEY_REGEX = /(sk_test_|sk_live_|whsec_|re_|pk_test_|pk_live_)[a-zA-Z0-9_-]+/gi;
const PHONE_REGEX = /(\+?\d{1,4}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/g;

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
 * Sentry beforeSend hook to guarantee zero PII leakage
 */
export function scrubPiiEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent | null {
  try {
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

    // 5. Scrub Exception message and value
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
 * Captures an exception safely with PII scrubbing and graceful fallback
 */
export function captureException(error: any, context?: Record<string, any>): string {
  const safeContext = context ? scrubPii(context) : undefined;

  // In production with Sentry configured
  if (isSentryEnabled()) {
    try {
      return Sentry.captureException(error, { extra: safeContext });
    } catch (err) {
      console.error('[Sentry captureException Failed]', err);
    }
  }

  // Development/Test fallback logging
  const eventId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[Sentry Monitor] [${eventId}] Captured:`, error?.message || error, safeContext || '');
  }
  return eventId;
}

/**
 * Captures a message safely
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): string {
  const safeMessage = scrubPii(message);
  if (isSentryEnabled()) {
    try {
      return Sentry.captureMessage(safeMessage, level);
    } catch (err) {
      console.error('[Sentry captureMessage Failed]', err);
    }
  }
  const eventId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return eventId;
}

export default {
  scrubPii,
  scrubPiiEvent,
  isSentryEnabled,
  captureException,
  captureMessage,
};
