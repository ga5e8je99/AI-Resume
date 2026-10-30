import * as Sentry from '@sentry/nextjs';
import { scrubPiiEvent } from './lib/sentry';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const isProd = process.env.NODE_ENV === 'production';

// Requirement: Enable only in production with DSN from env
if (isProd && SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.1,
    // Requirement: scrub PII before sending
    beforeSend(event) {
      return scrubPiiEvent(event);
    },
  });
}
