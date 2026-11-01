# JobMatch AI — PostHog Analytics & Conversion Funnel Guide (`docs/ANALYTICS.md`)

This document specifies the **consent-gated PostHog analytics architecture**, the **12 canonical conversion funnel events**, **webhook-verified revenue attribution**, and the **Funnel Dashboard** configuration for **JobMatch AI**.

---

## 1. Privacy & Cookie Consent Architecture

JobMatch AI enforces strict GDPR/ePrivacy compliance before initializing PostHog or transmitting any client-side telemetry:

1. **Explicit Consent Gate (`lib/analytics.ts` & `app/components/CookieConsentBanner.tsx`)**:
   - Cookie preferences are separated into **`Necessary`** (always active for authentication, CSRF, and session continuity) and **`Analytics`** (opt-in).
   - `hasConsent()` returns `false` while consent is `'pending'` or `'denied'`.
   - `initPostHog()` and `trackEvent()` **never initialize `posthog-js` or transmit network requests** until the user explicitly grants **`Analytics`** consent (`setConsentStatus('granted')`).
   - If a user revokes consent (`setConsentStatus('denied')`), `posthog.opt_out_capturing()` is invoked immediately and any queued events are cleared.
2. **Zero PII & Resume Content Scrubbing (`sanitizeAnalyticsProperties`)**:
   - All event properties pass through `sanitizeAnalyticsProperties()` before logging or transmission.
   - Forbidden keys (`email`, `name`, `fullName`, `password`, `token`, `secret`, `resumeText`, `content`, `text`, `bullets`, `phone`, `location`, `experience`, `education`, `skills`, `projects`, `jobDescription`, `extractedKeywords`, `address`, `ip`, `ip_address`, `cookie`, `authorization`) are stripped automatically.
   - Any string exceeding `100` characters or matching an email pattern (`/\S+@\S+\.\S+/`) is dropped.
   - PostHog `autocapture` and `session_recording` are disabled (`autocapture: false`, `disable_session_recording: true`).

---

## 2. Canonical PostHog Events Taxonomy

All client-side events require `hasConsent() === true`. Server-side webhook events (`payment_succeeded`, `subscription_cancelled`, `email_verified`) use anonymized identifiers (`usr_<id>`) and never transmit personal data.

| Step | Event Name | Helper Function | Origin | Properties | Trigger Point |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `landing_view` | `trackLandingView()` | Client (after cookie consent) | `{ locale, path, source }` | User views the landing page (`app/components/landing/LandingPageClient.tsx`). |
| **2** | `signup_started` | `trackSignupStarted()` | Client (after cookie consent) | `{ source, method }` | User opens `/register` or initiates the registration form (`app/register/page.tsx`). |
| **3** | `signup_completed` | `trackSignupCompleted()` | Client (after cookie consent) | `{ plan: 'free' \| 'pro' }` | User completes account registration (`app/register/page.tsx`). |
| **4** | `email_verified` | `trackEmailVerified()` / `trackServerEvent()` | Client & Server API | `{ method: 'token' }` | User verifies their email token (`app/auth/verify-email/page.tsx` & `app/api/auth/verify-email/route.ts`). |
| **5** | `resume_uploaded` | `trackResumeUploaded()` | Client (after cookie consent) | `{ fileType: 'pdf' \| 'docx' \| 'txt', source: 'landing' \| 'review' \| 'jobs' }` | User uploads a resume file on Landing, ATS Review, or Job Search (`LandingPageClient.tsx`, `app/review/page.tsx`, `useJobSearch.ts`). |
| **6** | `ats_scored` | `trackAtsScored(score, matchLabel)` | Client (after cookie consent) | `{ score: number, matchLabel: string }` | ATS engine computes the resume score (`0–100`) (`app/review/page.tsx`). |
| **7** | `job_search_run` | `trackJobSearchRun()` | Client (after cookie consent) | `{ country, remoteOnly, seniority, resultsCount, cached }` | User executes a job match search (`app/jobs/_components/useJobSearch.ts`). |
| **8** | `free_quota_exhausted` | `trackFreeQuotaExhausted()` | Client (after cookie consent) | `{ feature: 'job_search' \| 'cover_letter' \| 'upgrade_modal', reason }` | User hits HTTP `402` / exhausts free quota or AI credits (`useJobSearch.ts`, `app/cover-letter/page.tsx`, `UpgradeModal.tsx`). |
| **9** | `pricing_viewed` | `trackPricingViewed()` | Client (after cookie consent) | `{ selectedPlan, plan }` | User views `/pricing` (`app/pricing/page.tsx`). |
| **10** | `checkout_started` | `trackCheckoutStarted(plan, provider, currency)` | Client (after cookie consent) | `{ plan, planId, provider: 'lemonsqueezy' \| 'stripe' \| 'paymob', currency: 'USD' \| 'EGP' }` | User clicks upgrade/checkout CTA on `/pricing` (`app/pricing/page.tsx`). |
| **11** | `payment_succeeded` | `trackServerPaymentSucceeded()` & `trackPaymentSucceeded()` | **Webhook (Authoritative)** & Verified Order Poll | `{ plan, planId, provider, amount, currency, billingCycle, source: 'webhook' \| 'verified_order', webhookVerified: true }` | Fired by HMAC-verified payment webhooks (`app/api/webhooks/lemonsqueezy/route.ts`, `app/api/webhooks/payment/route.ts`) and confirmed order polling (`app/payment/success/page.tsx`). |
| **12** | `subscription_cancelled` | `trackServerSubscriptionCancelled()` & `trackSubscriptionCancelled()` | **Webhook (Authoritative)** & Account Deletion | `{ plan: 'pro', provider, reason, source: 'webhook' }` | Fired when a subscription is cancelled via Lemon Squeezy / Stripe webhook or during account deletion (`app/api/webhooks/lemonsqueezy/route.ts`, `app/api/webhooks/payment/route.ts`, `app/api/account/route.ts`). |

---

## 3. Webhook-Verified `payment_succeeded` Integrity (Never Trust URL Params)

To prevent spoofed conversion or revenue metrics:

1. **Zero URL Parameter Trust**:
   - `app/payment/success/page.tsx` **never reads `amount`, `plan`, `currency`, or `status` from URL query parameters** (e.g., `?amount=9&plan=pro` is ignored).
   - It only reads the order `reference` and polls `GET /api/orders/status?reference=...`.
2. **Stored `Order` + HMAC Webhook Verification**:
   - `GET /api/orders/status` authenticates the user, verifies `order.userId === authUser.userId`, and returns `status: 'paid'` **only after** the payment provider's HMAC-verified webhook (`POST /api/webhooks/lemonsqueezy` or `POST /api/webhooks/payment`) has validated `amount_cents` and `currency` against the stored `Order` and executed `DataStore.completeOrder(order.id)`.
3. **Server-Side Webhook Capture**:
   - `trackServerPaymentSucceeded()` is invoked directly inside `POST /api/webhooks/lemonsqueezy` and `POST /api/webhooks/payment` using `order.amount`, `order.currency`, `order.planId`, and `provider`, guaranteeing accurate revenue attribution even if the user closes their browser tab before returning to `/payment/success`.
   - `POST /api/analytics/event` rejects any `payment_succeeded` event unless `source` is `'webhook'` or `'verified_order'`.

---

## 4. Funnel Dashboard & PostHog Configuration

### 4.1 In-App Admin Funnel Dashboard (`/admin/analytics`)
Admins can view the real-time conversion funnel and webhook-verified revenue breakdown directly inside the application:
- **URL**: `/admin/analytics` (linked in the Admin Navbar at `/admin`).
- **API Endpoint**: `GET /api/admin/analytics` (protected by `verifyAdmin`).
- **Features**:
  - 11-step sequential conversion funnel (`landing_view` → `payment_succeeded`) with step-to-step conversion %, top-of-funnel conversion %, and drop-off %.
  - Dedicated `subscription_cancelled` churn counter and average `ats_scored` KPI.
  - Webhook-verified revenue breakdown by `provider` (`lemonsqueezy`, `stripe`, `paymob`) and `plan` (`pro`, `payg`).
  - One-click **Export PostHog JSON** button to download the funnel configuration.

### 4.2 PostHog Funnel Definition (`POSTHOG_FUNNEL_DASHBOARD_CONFIG`)
When configuring the funnel inside the PostHog UI (**Product Analytics → New Insight → Funnel**):
- **Conversion Window**: `14 days`
- **Step Order**:Sequential (`Ordered`)
- **Breakdowns**: `plan`, `provider`, `currency`

```json
{
  "name": "JobMatch AI — End-to-End Conversion & Revenue Funnel",
  "funnelConversionWindowDays": 14,
  "steps": [
    { "order": 1, "id": "landing_view", "name": "Landing Page View", "type": "events" },
    { "order": 2, "id": "signup_started", "name": "Signup Started", "type": "events" },
    { "order": 3, "id": "signup_completed", "name": "Signup Completed", "type": "events" },
    { "order": 4, "id": "email_verified", "name": "Email Verified", "type": "events" },
    { "order": 5, "id": "resume_uploaded", "name": "Resume Uploaded", "type": "events" },
    { "order": 6, "id": "ats_scored", "name": "ATS Scored", "type": "events" },
    { "order": 7, "id": "job_search_run", "name": "Job Search Run", "type": "events" },
    { "order": 8, "id": "free_quota_exhausted", "name": "Free Quota Exhausted", "type": "events" },
    { "order": 9, "id": "pricing_viewed", "name": "Pricing Viewed", "type": "events" },
    { "order": 10, "id": "checkout_started", "name": "Checkout Started", "type": "events" },
    { "order": 11, "id": "payment_succeeded", "name": "Payment Succeeded (Webhook)", "type": "events" }
  ],
  "breakdowns": ["plan", "provider", "currency"],
  "churnMonitors": ["subscription_cancelled"]
}
```

