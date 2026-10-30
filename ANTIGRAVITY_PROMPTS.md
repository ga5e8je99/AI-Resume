# 🚀 JobMatch AI — Antigravity Prompts (Step by Step)

طريقة الاستخدام:
1. ابدأ بـ **Prompt 0** مرة واحدة في بداية المحادثة (Context).
2. ابعت كل Prompt بعد اللي قبله، **واحد واحد**، وماتنقلش للتالي إلا لما الـ Agent يخلّص ويعدّي الـ Verification.
3. لو حصل خطأ، ابعت له الخطأ كما هو وقول: `Fix this error, then re-run the verification.`

---

## Prompt 0 — Project Context (ابعته الأول)

```
You are working on "JobMatch AI", a Next.js (App Router) + TypeScript + MongoDB (Mongoose) application located in the current workspace (AI-Resume). Features: PDF upload + ATS scan, resume builder with Word/PDF export, AI cover letter generator (Arabic/English), dark theme UI, auth (email + password).

Rules for this whole session:
- I will give you tasks ONE AT A TIME. Do only the task in the current prompt. Do not start future tasks.
- Before editing, inspect the existing code and follow its conventions (folder structure, styling, auth approach, i18n approach).
- Implement fully (no TODO placeholders, no pseudo-code).
- After each task: run `npm run build` (and `npm test` if it exists) and fix any errors you introduced.
- At the end of each task, give a short summary: files changed/created, how to verify manually, and any env variables I must add.
- Never commit secrets. Any secret goes in `.env.local` and must be documented in `.env.example`.

First, read the project structure, package.json, and the auth + User model, then reply with a brief summary of the stack and conventions you found. Do not change any code yet.
```

---

# 🌟 Track 1 — Portfolio

## Prompt 1.1 — Fix `npm test` (tsx)

```
Task 1.1: Make `npm test` work non-interactively.

- Install `tsx` as a devDependency.
- Look at the existing 8 tests and the "test" script in package.json. Update the script so it runs all tests with tsx without any interactive prompt or hanging (e.g. no watch mode, no npx confirmation).
- Make sure the process exits with the correct exit code on pass/fail.

Verification: run `npm test` and show that all 8 tests pass and the command exits by itself.
```

## Prompt 1.2 — One-Click Demo Guest Mode

```
Task 1.2: Add a "Try Demo Instantly" guest login.

Requirements:
1. Create `app/api/auth/demo/route.ts` (POST). It must:
   - Find or create a demo user (e.g. demo@jobmatch.ai) with a random unusable password, flagged `isDemo: true` (add the field to the User model, default false).
   - Re-seed the demo data on each call (idempotent, no duplicates): 
     a) one complete, realistic resume (English, a junior full-stack developer, with summary, experience, education, skills, projects) that renders well in the Builder,
     b) one saved ATS scan report with a score, matched/missing keywords, and suggestions so the Dashboard looks populated,
     c) one ready cover letter draft (use the existing models/collections for these).
   - Create a session/JWT exactly the same way the normal login does, and return success.
2. In `app/login/page.tsx` add a clearly visible button: "⚡ Try Demo Instantly" (and Arabic label "⚡ جرّب النظام فوراً" following the existing i18n approach). On click: call the endpoint, show a loading state, redirect to the dashboard. Handle errors with a friendly message.
3. Demo accounts must not be able to change email/password or delete the account, and must not consume paid credits in the future (add a simple `isDemo` check helper in `lib/` for later use).
4. Add basic rate limiting (in-memory is fine) to the demo endpoint.

Verification: `npm run build` passes; click the button on /login and confirm the dashboard shows the resume, ATS report, and cover letter.
```

## Prompt 1.3 — Custom 404 & Error pages

```
Task 1.3: Create `app/not-found.tsx` and `app/error.tsx` (plus `app/global-error.tsx`).

- Match the existing dark theme, fonts, and components.
- Support Arabic + English following the project's i18n approach (RTL when Arabic).
- 404: friendly message, illustration/icon, buttons "Go Home" and "Go to Dashboard".
- error.tsx (client component): shows a short message, a "Try again" button calling reset(), and a "Go Home" link. Never show raw error messages/stack in production; log with console.error only.

Verification: run build; open a non-existing URL and confirm the 404; temporarily throw in a page to confirm the error boundary, then remove the temporary throw.
```

## Prompt 1.4 — Production readiness for Deployment (Vercel + MongoDB Atlas)

```
Task 1.4: Prepare the app for deployment on Vercel with MongoDB Atlas.

- Audit the code for anything that breaks on serverless: local file writes, in-memory state, hard-coded localhost URLs, missing env validation.
- Make the MongoDB connection serverless-safe (cached global connection pattern) using `MONGODB_URI`.
- Create `.env.example` listing every required env variable with comments (MONGODB_URI, JWT/auth secret, AI API key, NEXT_PUBLIC_APP_URL, etc.).
- Add a small `lib/env.ts` that validates required env vars at runtime and throws a clear error message.
- Add `vercel.json` only if truly needed (e.g. function maxDuration for AI routes).
- Write `DEPLOYMENT.md` (short, English) with exact steps: create free MongoDB Atlas cluster, allow network access 0.0.0.0/0, copy connection string, add env vars in Vercel, deploy, post-deploy smoke test checklist.

Verification: `npm run build` passes and `.env.example` matches the env vars used in code.
```

## Prompt 1.5 — README + Architecture Diagram + Badges

```
Task 1.5: Rewrite README.md as a professional showcase.

Include:
- Title, one-line pitch, and badges (Next.js, TypeScript, MongoDB, Tailwind if used, license, "tests passing").
- "Live Demo" section with a placeholder link `https://YOUR-APP.vercel.app` and a note about the "Try Demo Instantly" button.
- Features list (ATS scan, builder, Word/PDF export, AI cover letters AR/EN, demo mode).
- Mermaid architecture diagram of the real architecture you found in the code (client → Next.js routes → MongoDB / AI API / PDF parsing).
- Tech stack table, folder structure, getting started (install, env, run, test), and API routes overview.
- A "Screenshots / Demo video" section with placeholders (`docs/screenshots/*.png`, video link).
- Roadmap section mentioning the upcoming SaaS features (credits, pricing, payments).

Keep it accurate to the actual code. No invented features.

Verification: render check — ensure all Mermaid blocks are valid syntax.
```

---

# 💼 Track 2 — Commercial SaaS

## Prompt 2.1 — Credits & Plan fields in User model

```
Task 2.1: Extend the User model in `app/models/User.ts` (use the real path you find).

Add:
- plan: String enum ['free','pro','enterprise'], default 'free'
- aiCredits: Number, default 3
- billingCycle: String enum ['monthly','annual','lifetime','none'], default 'none'
- planExpiresAt: Date (nullable)
- paymentProvider: String enum ['stripe','paymob','paddle','none'], default 'none'
- providerCustomerId: String default ''
- providerSubscriptionId: String default ''

Also:
- Create a one-time migration script `scripts/migrate-user-credits.ts` (run with tsx) that sets defaults for existing users who lack these fields, safe to run multiple times.
- Add a typed helper `lib/credits.ts` with: `getUserEntitlements(user)` (returns { isPro, creditsLeft, unlimited }), treating an expired planExpiresAt as free.

Verification: build passes, and the migration script runs against the local DB without errors.
```

## Prompt 2.2 — Credit Guard on AI routes

```
Task 2.2: Protect every AI-generation API route with a credit guard.

- Find all routes that call the AI provider (cover letter generate, any resume AI improvement, etc.).
- Create `lib/credit-guard.ts` exporting `withCreditGuard(handler)` or `requireCredits(userId)` + `consumeCredit(userId)`:
  - Pro/enterprise active plan → unlimited, no deduction.
  - Free → require aiCredits > 0, else respond HTTP 402 with JSON `{ error: "NO_CREDITS", upgradeUrl: "/pricing" }`.
  - Deduct exactly 1 credit ONLY after a successful AI generation (never on failure), using an atomic `findOneAndUpdate` with `{ aiCredits: { $gt: 0 } }` and `$inc: -1` to prevent race conditions.
  - Demo users (isDemo) are never charged and are limited by a simple per-hour rate limit instead.
- Frontend: when a 402 is received, show an upgrade modal/toast with a "View Plans" button linking to /pricing. Also show remaining credits in the navbar/dashboard (e.g. "3 credits left"), AR/EN.
- Add unit tests (tsx style used by the project) for the entitlement logic and atomic deduction logic where practical.

Verification: build + npm test pass; manually exhaust 3 credits and confirm the 4th request returns 402 and the UI shows the upgrade prompt.
```

## Prompt 2.3 — Pricing page

```
Task 2.3: Build `app/pricing/page.tsx`.

Three plans as modern interactive cards, dark theme, fully responsive, AR/EN with RTL support:
1. Starter (Free): 3 AI generations, free ATS scan, basic template.
2. Pro: $9/month or 150 EGP/month (toggle monthly/annual with an "annual saves X%" badge, you choose a reasonable annual price), unlimited AI generations, all templates, Word + PDF export without watermark, priority support. Mark as "Most Popular".
3. Pay-As-You-Go: 15 credits for $3.

Details:
- Currency toggle USD / EGP.
- CTA buttons call a placeholder `startCheckout(planId)` function in `lib/checkout-client.ts` that POSTs to `/api/checkout` (the route will be built in the next task; for now return a clear "coming soon" message if the route returns 501).
- Show the user's current plan if logged in, and disable the CTA for the plan they already have.
- Add a short FAQ section and a link to /pricing in the navbar and in the upgrade modal.
- Keep plan definitions in one config file `lib/plans.ts` (id, name, price per currency, credits, features) used by both the page and later the payment code.

Verification: build passes; visually check desktop + mobile and both languages.
```

## Prompt 2.4 — Payment gateway + Webhook (choose provider first)

```
Task 2.4: Implement payments with Stripe Checkout (international) AND Paymob (Egypt) behind a single provider abstraction.

Structure:
- `lib/payments/index.ts` exporting `createCheckout({ user, planId, currency })` which picks the provider (Paymob for EGP, Stripe for USD).
- `lib/payments/stripe.ts` and `lib/payments/paymob.ts` implementing each provider.
- `app/api/checkout/route.ts` (POST, authenticated): validates planId against `lib/plans.ts` (never trust prices from the client), creates a checkout session/payment link, returns `{ url }`.
- `app/api/webhooks/payment/route.ts` plus provider-specific handling:
  - Verify signatures (Stripe `constructEvent` with the raw body; Paymob HMAC verification).
  - Idempotency: store processed event/transaction IDs in a `PaymentEvent` collection and ignore duplicates.
  - On success: Pro plan → set plan='pro', billingCycle, planExpiresAt (extend if already active), provider ids; Pay-As-You-Go → `$inc` aiCredits by 15.
  - On subscription cancelled/failed → downgrade at expiry.
  - Create a `Payment` model recording amount, currency, provider, status, userId, planId, createdAt.
- Add success/cancel pages `/payment/success` and `/payment/cancelled`.
- Update `.env.example` with all keys (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, PAYMOB_API_KEY, PAYMOB_INTEGRATION_ID, PAYMOB_HMAC_SECRET, etc.) and document in `DEPLOYMENT.md` how to configure each webhook URL and how to test locally (Stripe CLI, Paymob test cards).
- Wire the pricing page CTA to this flow.

Verification: build passes; test end-to-end in test mode: pay → webhook received → user plan/credits updated → UI reflects it. Provide the exact test steps.
```

## Prompt 2.5 — Transactional emails + Forgot password (Resend)

```
Task 2.5: Add transactional email with Resend.

- `npm install resend`; create `lib/email.ts` with a typed `sendEmail` helper and clean, responsive, dark-friendly HTML templates (AR/EN according to user language): Welcome, Password Reset, Payment Receipt.
- Forgot password flow:
  - `app/forgot-password/page.tsx` and `app/reset-password/[token]/page.tsx`.
  - API routes: request reset (always respond with the same generic message to avoid user enumeration), and confirm reset.
  - Token: cryptographically random, store only a SHA-256 hash + expiry (15 minutes) on the user, single-use, invalidate after success.
  - Rate-limit the request endpoint.
- Send Welcome email on registration (non-blocking — never fail registration if the email fails).
- Send Receipt email from the payment webhook after a successful payment.
- Skip all emails for demo users.
- Add `RESEND_API_KEY` and `EMAIL_FROM` to `.env.example`.

Verification: build passes; test the full reset flow and confirm old tokens/links fail after use or expiry.
```

## Prompt 2.6 — Monitoring & Analytics (Sentry + PostHog)

```
Task 2.6: Add monitoring and analytics.

- Sentry: integrate `@sentry/nextjs` (client, server, edge) with DSN from env; enable only in production; scrub PII (emails, tokens, resume contents) before sending; hook into `app/error.tsx` and `global-error.tsx`.
- PostHog (or GA4 if PostHog is unsuitable): add a provider component and track a conversion funnel with these events: `signup_completed`, `demo_started`, `ats_scan_completed`, `ai_generation_used`, `credits_exhausted`, `pricing_viewed`, `checkout_started`, `payment_succeeded`. Never include resume text or personal data in event properties.
- Add a cookie/analytics consent banner (simple, AR/EN) and only initialize analytics after consent.
- Document all new env vars in `.env.example` and `DEPLOYMENT.md`.

Verification: build passes; trigger a test error and confirm it reaches Sentry; confirm events appear after accepting the banner and not before.
```

## Prompt 2.7 — Final E2E QA & Beta Launch checklist

```
Task 2.7: Final QA pass before beta launch.

1. Audit the whole project for: missing auth checks on API routes, unvalidated inputs, exposed secrets, missing loading/error states, broken RTL layouts, and mobile responsiveness issues. Fix what you find (small, safe fixes) and list anything bigger.
2. Write end-to-end checks (a script or documented manual checklist in `QA_CHECKLIST.md`) for: register → welcome email → use 3 credits → hit paywall → pay (test mode) → webhook → Pro unlocked → unlimited generation → receipt email → forgot password → demo mode.
3. Run `npm run build` and `npm test`; ensure everything is green.
4. Produce `LAUNCH_CHECKLIST.md`: switch payment providers to live keys, set production webhooks, verify domain for emails (SPF/DKIM), set Sentry/PostHog env, final smoke test, privacy policy + terms pages exist.
5. Create simple `/privacy` and `/terms` pages (AR/EN) if they don't exist, and link them from the footer and registration form.

Finish with a final report: what's done, known limitations, and recommended next steps.
```

---

## ✅ ترتيب التنفيذ المقترح

| اليوم | Prompts |
|:---:|:---|
| 1 | 0 → 1.1 → 1.2 → 1.3 → 1.4 |
| 2 | 1.5 + تسجيل الفيديو |
| 3 | 2.1 → 2.2 |
| 4 | 2.3 |
| 5 | 2.4 |
| 6 | 2.5 → 2.6 |
| 7 | 2.7 |
