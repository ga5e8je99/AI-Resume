import { scrubPiiEvent } from './lib/sentry';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
const isProd = process.env.NODE_ENV === 'production';

// Requirement: Enable only in production with DSN from env, loaded lazily after interactive so it never blocks LCP
if (isProd && SENTRY_DSN && typeof window !== 'undefined') {
  const initSentryAfterInteractive = () => {
    const start = () => {
      import('@sentry/nextjs')
        .then((Sentry) => {
          Sentry.init({
            dsn: SENTRY_DSN,
            tracesSampleRate: 0.1,
            replaysSessionSampleRate: 0,
            replaysOnErrorSampleRate: 0,
            // Requirement: scrub PII (emails, tokens, resume contents) before sending
            beforeSend(event) {
              return scrubPiiEvent(event);
            },
          });
        })
        .catch(() => {});
    };

    if (typeof (window as any).requestIdleCallback === 'function') {
      (window as any).requestIdleCallback(start, { timeout: 2500 });
    } else {
      setTimeout(start, 200);
    }
  };

  if (document.readyState === 'complete') {
    initSentryAfterInteractive();
  } else {
    window.addEventListener('load', initSentryAfterInteractive, { once: true });
  }
}
