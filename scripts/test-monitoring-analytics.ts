/**
 * Test Suite: Task 2.6 Monitoring (Sentry) & Analytics (PostHog)
 * Verifies:
 * 1. Sentry PII sanitization (emails, API tokens, passwords, resume & cover letter content)
 * 2. Sentry beforeSend event scrubbing (user ip/email stripping, headers, breadcrumbs)
 * 3. Error boundary captureException hooks in app/error.tsx & app/global-error.tsx
 * 4. Cookie consent gating: events blocked before consent, enabled after consent
 * 5. 8 conversion funnel stages tracked without personal/resume data leakage
 * 6. Environment configuration in .env.example, DEPLOYMENT.md, and app/lib/env.ts
 */

import fs from 'fs';
import path from 'path';
import {
  scrubPii,
  scrubPiiEvent,
  captureException,
  captureMessage,
} from '../lib/sentry';
import {
  trackEvent,
  hasConsent,
  getConsentStatus,
  setConsentStatus,
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
  CONSENT_STORAGE_KEY,
} from '../lib/analytics';

// Mock localStorage for Node test runner
const mockStorage: Record<string, string> = {};
(global as any).localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, val: string) => {
    mockStorage[key] = String(val);
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    for (const k of Object.keys(mockStorage)) delete mockStorage[k];
  },
};
(global as any).window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
};

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 Starting Task 2.6 Monitoring & Analytics Test Suite');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}${details ? ` -> ${details}` : ''}`);
      failed++;
    }
  }

  // ---------------------------------------------------------
  // 1. Sentry PII Sanitization
  // ---------------------------------------------------------
  console.log('--- 1. Sentry PII Sanitization ---');

  const emailRaw = 'Contact engineer at dev.lead@jobmatch.ai for details';
  const emailScrubbed = scrubPii(emailRaw);
  assert(
    !emailScrubbed.includes('dev.lead@jobmatch.ai') && emailScrubbed.includes('[REDACTED_EMAIL]'),
    'scrubPii redacts email addresses in strings'
  );

  const tokenRaw = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... and sk_test_51MzAbc12345';
  const tokenScrubbed = scrubPii(tokenRaw);
  assert(
    !tokenScrubbed.includes('sk_test_51MzAbc12345') && tokenScrubbed.includes('[REDACTED_API_KEY]'),
    'scrubPii redacts API keys and secret tokens'
  );

  // Resume and Personal Data Object Scrubbing
  const sensitivePayload = {
    userId: 'usr_123',
    email: 'sarah@example.com',
    password: 'SuperSecretPassword!',
    personalInfo: {
      fullName: 'Sarah Jenkins',
      phone: '+1 555-0199',
      location: 'Cairo, Egypt',
    },
    jobDescription: 'Senior Backend Engineer with 5+ years experience in Python and Node.js',
    resumeText: 'Full resume text content with private work history at Confidential Corp',
    safeMetric: 95,
    role: 'user',
  };

  const scrubbedPayload = scrubPii(sensitivePayload) as Record<string, any>;
  assert(scrubbedPayload.userId === 'usr_123', 'scrubPii retains safe non-sensitive identifier');
  assert(scrubbedPayload.safeMetric === 95, 'scrubPii retains safe numbers and booleans');
  assert(scrubbedPayload.role === 'user', 'scrubPii retains safe roles');
  assert(scrubbedPayload.email === '[REDACTED_PII]', 'scrubPii redacts email field');
  assert(scrubbedPayload.password === '[REDACTED_PII]', 'scrubPii redacts password field');
  assert(scrubbedPayload.personalInfo === '[REDACTED_PII]', 'scrubPii redacts personalInfo object');
  assert(scrubbedPayload.jobDescription === '[REDACTED_PII]', 'scrubPii redacts jobDescription blob');
  assert(scrubbedPayload.resumeText === '[REDACTED_PII]', 'scrubPii redacts resumeText blob');

  // Sentry Event beforeSend hook
  const mockSentryEvent: any = {
    event_id: 'evt_test_1',
    user: {
      id: 'usr_456',
      email: 'alex@example.com',
      ip_address: '192.168.1.1',
      username: 'alex_j',
    },
    request: {
      headers: {
        authorization: 'Bearer secret_token',
        cookie: 'jobmatch_token=jwt_xyz',
        'x-admin-key': 'GA138989@20102011f',
        'user-agent': 'Mozilla/5.0',
      },
      data: {
        fullName: 'Alex Test',
        password: 'pass',
      },
    },
    breadcrumbs: [
      { message: 'User clicked login with email user@jobmatch.ai' },
    ],
  };

  const scrubbedEvent = scrubPiiEvent(mockSentryEvent);
  assert(scrubbedEvent?.user?.email === undefined, 'beforeSend strips user.email');
  assert(scrubbedEvent?.user?.ip_address === undefined, 'beforeSend strips user.ip_address');
  assert(scrubbedEvent?.user?.username === undefined, 'beforeSend strips user.username');
  assert(scrubbedEvent?.user?.id === 'usr_456', 'beforeSend preserves anonymous user.id');
  assert(scrubbedEvent?.request?.headers?.authorization === undefined, 'beforeSend deletes authorization header');
  assert(scrubbedEvent?.request?.headers?.cookie === undefined, 'beforeSend deletes cookie header');
  assert(scrubbedEvent?.request?.headers?.['x-admin-key'] === undefined, 'beforeSend deletes x-admin-key header');
  assert(!scrubbedEvent?.breadcrumbs?.[0]?.message?.includes('user@jobmatch.ai'), 'beforeSend scrubs PII from breadcrumbs');

  // Capture exception test
  const capturedId = captureException(new Error('Test handled crash'), { module: 'atsScanner', email: 'test@example.com' });
  assert(typeof capturedId === 'string' && capturedId.length > 0, 'captureException executes safely and returns eventId');

  // ---------------------------------------------------------
  // 2. Cookie Consent Gating
  // ---------------------------------------------------------
  console.log('\n--- 2. Analytics Consent Gating ---');

  // Start with pending consent
  mockStorage[CONSENT_STORAGE_KEY] = 'pending';
  assert(hasConsent() === false, 'hasConsent is false when status is pending');

  clearAnalyticsLog();
  const deniedTrack = trackSignupCompleted('free');
  assert(deniedTrack === false, 'trackEvent returns false when consent is not granted');

  const logBeforeConsent = getAnalyticsLog();
  assert(logBeforeConsent.length === 1, 'Event logged in audit trail');
  assert(logBeforeConsent[0].consented === false, 'Event marked as consented: false when pending');

  // Grant consent
  setConsentStatus('granted');
  assert(hasConsent() === true, 'hasConsent is true after granting consent');

  clearAnalyticsLog();
  const grantedTrack = trackSignupCompleted('pro');
  assert(grantedTrack === true, 'trackEvent succeeds after granting consent');

  const logAfterConsent = getAnalyticsLog();
  assert(logAfterConsent[0].consented === true, 'Event marked as consented: true after grant');

  // Decline consent
  setConsentStatus('denied');
  assert(hasConsent() === false, 'hasConsent is false after declining consent');

  const postDenialTrack = trackDemoStarted();
  assert(postDenialTrack === false, 'trackEvent is blocked again after declining consent');

  // ---------------------------------------------------------
  // 3. Conversion Funnel Events & PII Leakage Protection
  // ---------------------------------------------------------
  console.log('\n--- 3. 8 Conversion Funnel Events & PII Prevention ---');

  // Set consent granted for funnel testing
  setConsentStatus('granted');
  clearAnalyticsLog();

  // Test property sanitizer with aggressive PII injection
  const dirtyProps = {
    plan: 'pro',
    currency: 'USD',
    amount: 9,
    email: 'hacker@test.com',
    fullName: 'Jane Doe',
    jobDescription: 'We are hiring a VP of Engineering...',
    resumeText: 'Experienced architect...',
    phone: '+1 234 567 8900',
    validStep: 'checkout_click',
    hugeBlob: 'a'.repeat(250), // Over 100 chars should be dropped
  };

  const cleanProps = sanitizeAnalyticsProperties(dirtyProps);
  assert(cleanProps.plan === 'pro', 'Retains safe property: plan');
  assert(cleanProps.currency === 'USD', 'Retains safe property: currency');
  assert(cleanProps.amount === 9, 'Retains safe property: amount');
  assert(cleanProps.validStep === 'checkout_click', 'Retains safe property: validStep');
  assert(cleanProps.email === undefined, 'Sanitizer drops email');
  assert(cleanProps.fullName === undefined, 'Sanitizer drops fullName');
  assert(cleanProps.jobDescription === undefined, 'Sanitizer drops jobDescription');
  assert(cleanProps.resumeText === undefined, 'Sanitizer drops resumeText');
  assert(cleanProps.phone === undefined, 'Sanitizer drops phone');
  assert(cleanProps.hugeBlob === undefined, 'Sanitizer drops text blobs > 100 characters');

  // Test the 8 Funnel Helpers
  clearAnalyticsLog();

  trackSignupCompleted('free');
  trackDemoStarted();
  trackAtsScanCompleted(88, 'Good Match');
  trackAiGenerationUsed('cover_letter');
  trackCreditsExhausted();
  trackPricingViewed('pro');
  trackCheckoutStarted('pro', 'USD');
  trackPaymentSucceeded('pro', 9, 'USD');

  const funnelLog = getAnalyticsLog();
  const eventNames = funnelLog.map((l) => l.event);

  assert(eventNames.includes('signup_completed'), 'Tracks: signup_completed');
  assert(eventNames.includes('demo_started'), 'Tracks: demo_started');
  assert(eventNames.includes('ats_scan_completed'), 'Tracks: ats_scan_completed');
  assert(eventNames.includes('ai_generation_used'), 'Tracks: ai_generation_used');
  assert(eventNames.includes('credits_exhausted'), 'Tracks: credits_exhausted');
  assert(eventNames.includes('pricing_viewed'), 'Tracks: pricing_viewed');
  assert(eventNames.includes('checkout_started'), 'Tracks: checkout_started');
  assert(eventNames.includes('payment_succeeded'), 'Tracks: payment_succeeded');
  assert(funnelLog.length === 8, 'Exactly 8 conversion funnel stages recorded');

  // Check properties of ats_scan_completed
  const atsEvent = funnelLog.find((l) => l.event === 'ats_scan_completed');
  assert(atsEvent?.properties.score === 88, 'ats_scan_completed records score metric');
  assert(atsEvent?.properties.resumeText === undefined, 'ats_scan_completed contains ZERO resume text');

  // ---------------------------------------------------------
  // 4. File Structure & Error Boundary Hooks Verification
  // ---------------------------------------------------------
  console.log('\n--- 4. Code & Configuration Verification ---');

  const errorBoundaryPath = path.join(process.cwd(), 'app', 'error.tsx');
  const errorBoundaryCode = fs.readFileSync(errorBoundaryPath, 'utf-8');
  assert(
    errorBoundaryCode.includes('captureException') && errorBoundaryCode.includes('@/lib/sentry'),
    'app/error.tsx hooks Sentry captureException'
  );

  const globalErrorBoundaryPath = path.join(process.cwd(), 'app', 'global-error.tsx');
  const globalErrorContent = fs.readFileSync(globalErrorBoundaryPath, 'utf-8');
  assert(
    globalErrorContent.includes('captureException') && globalErrorContent.includes('@/lib/sentry'),
    'app/global-error.tsx hooks Sentry captureException'
  );

  const envExamplePath = path.join(process.cwd(), '.env.example');
  const envExampleContent = fs.readFileSync(envExamplePath, 'utf-8');
  assert(envExampleContent.includes('NEXT_PUBLIC_SENTRY_DSN'), '.env.example documents NEXT_PUBLIC_SENTRY_DSN');
  assert(envExampleContent.includes('NEXT_PUBLIC_POSTHOG_KEY'), '.env.example documents NEXT_PUBLIC_POSTHOG_KEY');

  const deploymentPath = path.join(process.cwd(), 'DEPLOYMENT.md');
  const deploymentContent = fs.readFileSync(deploymentPath, 'utf-8');
  assert(deploymentContent.includes('NEXT_PUBLIC_SENTRY_DSN'), 'DEPLOYMENT.md documents Sentry DSN');
  assert(deploymentContent.includes('NEXT_PUBLIC_POSTHOG_KEY'), 'DEPLOYMENT.md documents PostHog key');

  console.log('\n======================================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
