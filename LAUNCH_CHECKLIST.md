# Beta Launch Checklist

> **JobMatch AI** — Operational Pre-Flight & Go-Live Checklist for Production Deployment.  
> Follow this checklist sequentially before opening the platform to real users and accepting live payments.

---

## 1. Environment Variables Audit

Verify that all production environment variables are properly populated in the hosting provider (e.g., Vercel Project Settings > Environment Variables):

### Core Application & Database
- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_APP_URL=https://your-domain.com` (Must match canonical production URL without trailing slash)
- [ ] `MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/jobmatch?retryWrites=true&w=majority`
- [ ] `JWT_SECRET=<cryptographically-random-64-char-string>` (Generate via `openssl rand -hex 32`)
- [ ] `ADMIN_KEY=<strong-unique-admin-secret>`
- [ ] `ADMIN_EMAILS=founder@yourdomain.com,admin@yourdomain.com`

### AI Provider
- [ ] `HUGGINGFACE_API_KEY=hf_...` (or custom LLM API key with production quotas)
- [ ] AI model fallback rate limits verified

### Stripe (Live Mode)
- [ ] `STRIPE_SECRET_KEY=sk_live_...` (Switch from `sk_test_...`)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...` (Switch from `pk_test_...`)
- [ ] `STRIPE_WEBHOOK_SECRET=whsec_...` (Obtained from live Stripe webhook endpoint)

### Paymob (Egypt - Live Mode)
- [ ] `PAYMOB_API_KEY=...` (Live account API key)
- [ ] `PAYMOB_INTEGRATION_ID=...` (Live card integration ID)
- [ ] `PAYMOB_IFRAME_ID=...` (Live payment iframe ID)
- [ ] `PAYMOB_HMAC_SECRET=...` (Live HMAC secret for transaction signature verification)

### Transactional Email (Resend)
- [ ] `RESEND_API_KEY=re_...` (Live production API key)
- [ ] `EMAIL_FROM=JobMatch AI <support@yourdomain.com>` (Must use verified custom domain; NOT `onboarding@resend.dev`)

### Monitoring & Analytics
- [ ] `SENTRY_DSN=https://...@sentry.io/...`
- [ ] `NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...`
- [ ] `NEXT_PUBLIC_POSTHOG_KEY=phc_...`
- [ ] `NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com` (or EU host)

---

## 2. Payment Providers: Live Switching & Webhook Setup

### A. Stripe Setup
1. **Switch Mode:** In [Stripe Dashboard](https://dashboard.stripe.com), toggle **Test mode** to **OFF** (Live).
2. **API Keys:**
   - Copy `Publishable key` (`pk_live_...`) to `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
   - Create a restricted or standard `Secret key` (`sk_live_...`) and add to `STRIPE_SECRET_KEY`.
3. **Configure Production Webhook:**
   - Go to **Developers > Webhooks > Add endpoint**.
   - **Endpoint URL:** `https://your-domain.com/api/webhooks/payment`
   - **Events to listen for:**
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `customer.subscription.deleted`
     - `customer.subscription.updated`
   - Click **Add endpoint**, then click **Reveal** under *Signing secret*.
   - Copy `whsec_...` into `STRIPE_WEBHOOK_SECRET` in Vercel.
4. **Customer Portal (Optional):**
   - Enable the Stripe Customer Portal under Settings > Customer Portal for self-serve cancellation and invoice downloads.

### B. Paymob Setup (Egypt / EGP)
1. **Account Activation:** Ensure commercial onboarding and KYC are completed in [Paymob Dashboard](https://accept.paymob.com).
2. **Integration ID:** Create an Online Card Integration in live mode and note the Integration ID.
3. **Configure Webhook Callbacks:**
   - Go to **Developers > Payment Integrations > Edit Integration**.
   - Set **Transaction Response Callback URL** to: `https://your-domain.com/api/webhooks/payment`
   - Set **Transaction Processed Callback URL** to: `https://your-domain.com/api/webhooks/payment`
4. **HMAC Secret:** Under **Settings > Account Info**, copy your live **HMAC Secret** to `PAYMOB_HMAC_SECRET`.

---

## 3. Domain Verification for Transactional Emails (Resend)

To guarantee high deliverability and avoid spam folders:

1. **Add Domain:** Go to [Resend Domains](https://resend.com/domains) and click **Add Domain** (`yourdomain.com`).
2. **DNS Records Configuration:** Add the following records in your DNS registrar (Cloudflare, GoDaddy, Namecheap):
   - **DKIM (3 CNAME records):** Provides cryptographic sender signature.
   - **SPF (1 TXT record):**  
     `v=spf1 include:amazonses.com ~all`
   - **DMARC (1 TXT record at `_dmarc.yourdomain.com`):**  
     `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com`
   - **MX (1 record at `feedback.yourdomain.com`):** Handles bounce and feedback loops.
3. **Verify Status:** Wait 5-15 minutes until status indicates **Verified** in Resend dashboard.
4. **Update `EMAIL_FROM`:** Update environment variable to `JobMatch AI <support@yourdomain.com>` or `JobMatch AI <noreply@yourdomain.com>`.

---

## 4. Error Monitoring & Product Analytics

### Sentry (Error Tracking)
- [ ] Project created in Sentry for Next.js.
- [ ] DSN added to Vercel environment variables.
- [ ] Verified that client errors trigger alerts in Sentry dashboard.
- [ ] Verified that PII (emails, passwords, resume data) is redacted via `lib/sentry.ts`.

### PostHog (Product Analytics & Funnels)
- [ ] PostHog project created and API key configured.
- [ ] Cookie consent banner (`CookieConsentBanner.tsx`) active in production.
- [ ] Verified that PostHog stays inert until user clicks "Accept All".
- [ ] Funnel tracking established for:
  `signup_completed -> demo_started -> ats_scan_completed -> ai_generation_used -> credits_exhausted -> pricing_viewed -> checkout_started -> payment_succeeded`

---

## 5. Legal & Compliance Pages

- [ ] **Privacy Policy (`/privacy`):**
  - Fully bilingual (English & Arabic with RTL).
  - Outlines resume data processing, AI generation privacy, third-party payment processors, and GDPR/CCPA rights.
  - Contact email: `privacy@jobmatch.ai`.
- [ ] **Terms of Service (`/terms`):**
  - Fully bilingual (English & Arabic with RTL).
  - Covers subscription plans, credit packs, 14-day refund policy, and AI generation assistive disclaimers.
  - Contact email: `legal@jobmatch.ai`.
- [ ] **Navigation Links:**
  - Active in website footer (`app/page.tsx` & `app/pricing/page.tsx`).
  - Active on registration page (`app/register/page.tsx`).

---

## 6. Final Post-Deployment Smoke Test Protocol

Perform this 10-step manual test immediately after the production build finishes deploying:

1. **Homepage & Branding:** Visit `https://your-domain.com`. Verify dark theme, animations, fonts, and language switch to Arabic (`/ar`).
2. **Demo Mode:** Click **Try Demo Instantly**. Verify pre-seeded resume, ATS score, and cover letter draft load immediately.
3. **Live User Signup:**
   - Register a real test account (`test-beta-user@yourdomain.com`).
   - Check your inbox for the **Welcome Email**.
4. **ATS Resume Diagnostic:**
   - Upload a test PDF resume on `/review`.
   - Verify ATS score, sub-scores, and recommendations compute within 5 seconds.
5. **AI Cover Letter Generation:**
   - Go to `/cover-letter`.
   - Generate 1 cover letter. Verify credit counter drops from 3 to 2.
6. **Credit Exhaustion & Paywall:**
   - Generate 2 more cover letters until credits reach 0.
   - On 4th attempt, verify the **Upgrade Modal** pops up with a link to `/pricing`.
7. **Pricing Page & Currency Toggle:**
   - Visit `/pricing`.
   - Toggle USD ($) and EGP (ج.م). Verify live pricing displays correctly.
8. **Checkout Initiation:**
   - Click "Upgrade to Pro" or "Buy Credit Pack".
   - Verify redirection to Stripe Checkout (or Paymob) with SSL padlock.
9. **Password Reset:**
   - Visit `/forgot-password`.
   - Submit your test email. Verify receipt of password reset link in inbox.
   - Click link, reset password, and log in with new password.
10. **Legal Links:** Click **Privacy Policy** and **Terms of Service** in footer; verify both load cleanly in both English and Arabic.

---

## 7. Rollback Plan

If any critical issue is discovered post-launch:

1. **Instant Rollback:** In Vercel Deployment Dashboard, click **... > Rollback to Previous Deployment**.
2. **Database Backup:** Restore point created via MongoDB Atlas automated daily backups.
3. **Incident Escalation:** Sentry alert integration with Slack/Email will automatically ping on uncaught exceptions.
