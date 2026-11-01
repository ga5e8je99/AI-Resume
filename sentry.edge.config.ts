import * as Sentry from '@sentry/nextjs';
import { scrubPiiEvent, getSentryEnvironment, getSentryRelease } from './lib/sentry';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const isProd = process.env.NODE_ENV === 'production';

// Requirement: Enable only in production with DSN from env
if (isProd && SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: getSentryEnvironment(),
    release: getSentryRelease(),
    tracesSampleRate: 0.1,
    // Requirement: drop bot errors & scrub PII before sending
    beforeSend(event) {
      return scrubPiiEvent(event);
    },
  });
}
