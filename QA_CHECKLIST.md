# QA Checklist & Beta Verification Matrix

> **JobMatch AI** — Automated and Manual Quality Assurance Protocol for Beta Launch.  
> **Status:** All Automated Test Suites Passing (13/13 suites, 100+ checks).  
> **Last Verified:** October 2026

---

## 1. Automated Test Suites Overview

The platform includes full automated end-to-end regression suites covering all core workflows:

| # | Test Suite | File | Type | Checks | Status |
|---|---|---|---|:---:|:---:|
| 1 | Arabic Normalization & Business Logic | `scripts/test-cover-letter-business-logic.mjs` | Unit | 8 | PASSED |
| 2 | REST APIs & Core CRUD | `scripts/test-cover-letter-apis.mjs` | Integration | 7 | PASSED |
| 3 | Security, IDOR, XSS & CSRF | `scripts/test-cover-letter-security-permissions.mjs` | Security | 8 | PASSED |
| 4 | AI Integration & Fallback Resilience | `scripts/test-cover-letter-ai-integration.mjs` | Integration | 6 | PASSED |
| 5 | Data Validation, Quality & Binary Detection | `scripts/test-cover-letter-data-quality.mjs` | Unit | 9 | PASSED |
| 6 | 6-Dimensional Edge Cases & Boundaries | `scripts/test-cover-letter-edge-cases.mjs` | Unit | 12 | PASSED |
| 7 | UI Component Contracts & State Flow | `scripts/test-cover-letter-ui-flow.mjs` | Contract | 7 | PASSED |
| 8 | Rate Limiting & Performance Under Load | `scripts/test-cover-letter-performance-reliability.mjs` | Performance | 5 | PASSED |
| 9 | Credit Guard & Atomic Floor Decrement | `scripts/test-credit-guard.ts` | Unit | 9 | PASSED |
| 10 | Unified Payment Checkout & Webhooks | `scripts/test-payments-e2e.ts` | Integration | 8 | PASSED |
| 11 | Transactional Email & Password Reset | `scripts/test-transactional-emails.ts` | Integration | 8 | PASSED |
| 12 | Monitoring, Analytics & Privacy Scrubbing | `scripts/test-monitoring-analytics.ts` | Unit | 55 | PASSED |
| 13 | **Beta Launch End-to-End Lifecycle** | `scripts/e2e-beta-lifecycle-test.ts` | **E2E Lifecycle** | **54** | **PASSED** |

---

## 2. End-to-End User Lifecycle Checklist

This checklist documents each phase of the critical monetization & user conversion funnel:

### Phase 1: Registration (`/register`)
- [x] **Form fields:** Name, Email, Password, Confirm Password with live validation.
- [x] **Password validation:** Minimum 6 characters required; passwords must match.
- [x] **Email format validation:** RFC-compliant regex checks preventing malformed emails.
- [x] **Rate limiting:** Maximum 20 registration requests per minute per IP.
- [x] **Bilingual support:** English and Arabic UI with RTL alignment and language switcher.
- [x] **Legal terms consent:** Explicit links to `/terms` and `/privacy` in both languages.
- [x] **Entitlements initialized:** Free account is initialized with `plan: 'free'` and `aiCredits: 3`.
- [x] **Secure session:** `jobmatch_token` cookie set with `HttpOnly`, `SameSite=Lax`, and `Secure` in production.

### Phase 2: Transactional Welcome Email
- [x] **Trigger:** Dispatched automatically upon account creation via Resend (`sendEmail`).
- [x] **Non-blocking:** Registration never fails if the email provider times out or errors.
- [x] **Localization:** User receives Arabic email when registered in Arabic, English when registered in English.
- [x] **Template styling:** Dark-mode responsive HTML email with quick start CTAs.
- [x] **Demo exclusion:** Welcome emails are strictly skipped for demo accounts.

### Phase 3: Free Credit Consumption (3 Free Generations)
- [x] **Credit guard:** Authenticated routes check `requireCredits(userId)`.
- [x] **Generation 1:** AI cover letter generated successfully -> `creditsLeft: 2` reported.
- [x] **Generation 2:** AI cover letter generated successfully -> `creditsLeft: 1` reported.
- [x] **Generation 3:** AI cover letter generated successfully -> `creditsLeft: 0` reported.
- [x] **Atomic deduction:** Credit is decremented atomically using MongoDB `$inc: -1` with `{ aiCredits: { $gt: 0 } }`.
- [x] **Failure safety:** Credits are NEVER deducted if generation fails, times out, or receives bad input.

### Phase 4: Paywall Trigger & Pricing Page (`/pricing`)
- [x] **HTTP 402 rejection:** Generation attempt with 0 credits returns HTTP 402 with `{ error: "NO_CREDITS", upgradeUrl: "/pricing" }`.
- [x] **Zero floor guard:** Credit balance never drops below 0.
- [x] **Frontend upgrade modal:** Rejection displays modal with plan summary and direct CTA to `/pricing`.
- [x] **Navbar counter:** Navigation bar displays real-time remaining credit badge (`0 credits left`).
- [x] **Currency switcher:** Pricing page supports seamless toggle between USD ($) and EGP (ج.م).
- [x] **Billing cycle toggle:** Monthly vs. Annual toggle with discount badge ("Save 25%").

### Phase 5: Checkout Flow (`/api/checkout`)
- [x] **Authentication:** Unauthenticated calls return HTTP 401 redirecting to login with return URL.
- [x] **Server-side price verification:** Client cannot manipulate plan price; rates are verified against `lib/plans.ts`.
- [x] **Provider routing:**
  - USD transactions route to Stripe Checkout.
  - EGP transactions route to Paymob Payment Link.
- [x] **Checkout redirect:** Valid checkout URL returned to client.

### Phase 6: Payment Webhook (`/api/webhooks/payment`)
- [x] **Signature validation:**
  - Stripe: `constructEvent` with `STRIPE_WEBHOOK_SECRET` and raw body.
  - Paymob: HMAC SHA-512 calculation against `PAYMOB_HMAC_SECRET`.
- [x] **Production security:** Test webhooks (`x-test-webhook`) are strictly disabled in production.
- [x] **Idempotency:** Processed event IDs recorded in `PaymentEvent` collection; duplicates return `{ duplicate: true }` and exit safely.
- [x] **Plan activation:**
  - Pro plan upgrades user `plan` to `'pro'`, sets `billingCycle`, and establishes `planExpiresAt`.
  - Pay-As-You-Go increments `aiCredits` by 15.
- [x] **Audit logging:** Payment details stored in `Payment` collection.

### Phase 7: Pro Unlimited Generation
- [x] **Entitlements update:** `getUserEntitlements` reports `{ isPro: true, unlimited: true, creditsLeft: Infinity }`.
- [x] **Zero deduction:** AI generation executes without debiting credits or updating counters.
- [x] **Multiple runs:** Verified unlimited generations continue without interruption.

### Phase 8: Transactional Receipt Email
- [x] **Trigger:** Dispatched automatically from payment webhook after successful charge.
- [x] **Receipt contents:** Itemized plan name, amount, currency, transaction ID, date, and support link.
- [x] **Bilingual support:** Dispatched in user's preferred language.

### Phase 9: Forgot Password & Single-Use Reset Token
- [x] **Request endpoint (`/api/auth/forgot-password`):**
  - Always returns identical generic success message to prevent user enumeration attacks.
  - Rate limited to 5 requests per 15 minutes per IP/email.
- [x] **Cryptographic token:** 32-byte hex token generated; only SHA-256 hash stored in DB with 15-minute expiry.
- [x] **Email dispatched:** Reset link sent containing raw token: `/reset-password/[token]`.
- [x] **Reset endpoint (`/api/auth/reset-password`):**
  - Verifies token hash against unexpired token in DB.
  - Hashes new password with `bcryptjs`.
  - **Single-use invalidation:** Deletes/clears token immediately upon success.
- [x] **Replay rejection:** Subsequent requests with the same token return HTTP 400 `INVALID_OR_EXPIRED_TOKEN`.
- [x] **Credential verification:** Old password rejected (HTTP 401); new password authenticates successfully (HTTP 200).

### Phase 10: Demo Mode (`/api/auth/demo`)
- [x] **One-click demo:** Instant login without credentials.
- [x] **Seed data:** Generates realistic resume, ATS scan, and cover letter draft.
- [x] **Rate limit protection:** Demo users protected by a 30 req/hour limit instead of credit exhaustion.
- [x] **No email spam:** Transactional emails completely bypassed for demo users (`isDemo: true`).
- [x] **Protected deletion:** Demo accounts cannot be deleted by standard admin routes.

---

## 3. UI/UX, RTL & Responsiveness Matrix

| View | Mobile (375px) | Tablet (768px) | Desktop (1440px) | RTL (Arabic) | Error State | Loading State |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `/` (Homepage) | Verified | Verified | Verified | Native RTL | Fallback Hero | Skeleton |
| `/login` | Verified | Verified | Verified | Native RTL | Red Banner | Spinner |
| `/register` | Verified | Verified | Verified | Native RTL | Red Banner | Spinner |
| `/forgot-password` | Verified | Verified | Verified | Native RTL | Alert Box | Spinner |
| `/reset-password/[token]` | Verified | Verified | Verified | Native RTL | Token Expiry Alert | Spinner |
| `/pricing` | Stacked Cards | 2-Col Grid | 3-Col Grid | Native RTL | Toast Alert | Spinner |
| `/cover-letter` | Tab Switcher | Split View | Split View | Native RTL | Form Toast | Step Progress |
| `/builder` | Collapsible Sections | Two-Col | Two-Col Preview | Native RTL | Save Warning | Autosave Pulse |
| `/review` | Stacked Metrics | Gauge Grid | Full Dashboard | Native RTL | Parse Error Alert | Progress Circle |
| `/dashboard` | Stacked Cards | 2-Col Grid | 3-Col Grid | Native RTL | Empty State | Spinner |
| `/privacy` | Fluid Typography | Responsive Padding | Max-w-4xl Card | Native RTL | 404 Fallback | N/A |
| `/terms` | Fluid Typography | Responsive Padding | Max-w-4xl Card | Native RTL | 404 Fallback | N/A |
| `404` (`/not-found`) | Centered Banner | Centered | Centered | Native RTL | N/A | N/A |
| `500` (`/error`) | Reset Button | Reset Button | Reset Button | Native RTL | Safe Message | N/A |

---

## 4. Security Audit Findings & Fixes Applied

During the beta QA audit, the following vulnerabilities were identified and resolved:

1. **IDOR on GET `/api/resumes/[id]`:**
   - *Issue:* Any authenticated user could potentially view another user's resume if they obtained the ID.
   - *Fix:* Added strict ownership check: `if (resume.userId && resume.userId !== authUser.userId && authUser.role !== 'admin') return 403 Forbidden`.

2. **Unauthenticated Cover Letter Generation:**
   - *Issue:* Anonymous users could invoke `/api/cover-letter/generate` bypassing credit tracking.
   - *Fix:* Added mandatory authentication requirement returning HTTP 401 with redirect to `/login` or demo mode.

3. **Production Webhook Security:**
   - *Issue:* Test webhook header (`x-test-webhook`) was open to abuse if invoked in production.
   - *Fix:* Added `if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_TEST_WEBHOOKS) return 403 Forbidden`. Enforced `STRIPE_WEBHOOK_SECRET` in production.

4. **Brute Force & Spam Protection:**
   - *Issue:* `/api/auth/register` and `/api/auth/login` lacked sliding-window rate limiters.
   - *Fix:* Integrated `applyRateLimit` (20/min for register, 30/min for login) and email regex sanitization.

5. **Token Projection in DataStore:**
   - *Issue:* `findUserById` was not projecting `resetPasswordToken` and `resetPasswordExpires`.
   - *Fix:* Added reset fields to projections for both MongoDB and Local DataStore models.

6. **Bilingual RTL Layout on Legal & Dashboard Pages:**
   - *Issue:* Privacy, Terms, Register, and Dashboard pages lacked dynamic `dir={isRtl ? 'rtl' : 'ltr'}`.
   - *Fix:* Integrated `useLanguage()`, RTL direction, language selectors, and full Arabic content.

---

## 5. Verification Commands

To re-run all quality checks locally:

```bash
# 1. Run the Beta Lifecycle E2E Test Suite (54 checks)
npx tsx scripts/e2e-beta-lifecycle-test.ts

# 2. Run All Automated Cover Letter & Security Suites (13 suites)
npm test

# 3. Verify Production Compilation
npm run build
```
