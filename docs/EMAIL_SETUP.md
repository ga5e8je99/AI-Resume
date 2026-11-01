# Resend Email & Domain Verification Setup Guide (`SPF` / `DKIM` / `DMARC`)

This guide documents how to configure and verify your project domain (`jobmatch.ai`) in **Resend** for transactional emails, enforce domain sender security, and manage the 6-language unified email templates and retry queue.

---

## 1. Sender Address Policy (Project Domain Only — Never Consumer Webmail)

All outgoing transactional emails **must** originate from a verified project domain address (such as `JobMatch AI <noreply@jobmatch.ai>` or `support@jobmatch.ai`).

- **Forbidden Domains**: Consumer webmail domains (`@gmail.com`, `@googlemail.com`, `@yahoo.com`, `@hotmail.com`, `@outlook.com`, `@live.com`, `@icloud.com`, `@aol.com`, `@proton.me`, `@protonmail.com`) are automatically rejected by `resolveVerifiedSenderAddress()` in [`lib/email.ts`](../lib/email.ts) because they fail DMARC alignment when sent via Resend/Amazon SES and cause emails to be blocked or routed to spam.
- If `EMAIL_FROM` is missing or inadvertently set to a consumer webmail domain, the system logs a warning to **Sentry** and automatically falls back to `JobMatch AI <noreply@jobmatch.ai>`.

---

## 2. Step-by-Step Domain Verification in Resend

### Step 2.1: Add Your Domain in Resend
1. Sign in to the [Resend Dashboard](https://resend.com/domains).
2. Click **Add Domain**.
3. Enter your root domain or dedicated mail subdomain (recommended: `jobmatch.ai` with custom return-path `send.jobmatch.ai`).
4. Select the closest region (e.g., `eu-west-1` for Europe/MENA or `us-east-1` for North America).

---

### Step 2.2: Configure `SPF` (Sender Policy Framework)
Resend uses a custom Return-Path subdomain (`send.jobmatch.ai`) for bounce handling and SPF alignment. Add the following DNS records at your DNS provider (Cloudflare, Route53, Namecheap, etc.):

| Type | Host / Name | Value / Target | Priority | TTL |
| :--- | :--- | :--- | :--- | :--- |
| `MX` | `send.jobmatch.ai` | `feedback-smtp.<region>.amazonses.com` | `10` | Auto / 3600 |
| `TXT` | `send.jobmatch.ai` | `v=spf1 include:amazonses.com ~all` | — | Auto / 3600 |

> **Note:** If you also send emails directly from the root domain (`@jobmatch.ai`), ensure your root `@` TXT record includes `v=spf1 include:amazonses.com ~all` (or merges `include:amazonses.com` into your existing SPF record). Never create more than one `v=spf1` TXT record on the same host.

---

### Step 2.3: Configure `DKIM` (DomainKeys Identified Mail)
Resend generates a 2048-bit RSA key pair to cryptographically sign every outgoing message header and body. Add the `TXT` (or `CNAME` if using Resend multi-selector DKIM) record provided in your Resend dashboard:

| Type | Host / Name | Value / Target | TTL |
| :--- | :--- | :--- | :--- |
| `TXT` | `resend._domainkey.jobmatch.ai` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...` *(copy exact key from Resend)* | Auto / 3600 |

> **Cloudflare Tip:** Ensure Cloudflare proxy (orange cloud) is turned **OFF (DNS Only / grey cloud)** for any `CNAME` or `MX` records related to email.

---

### Step 2.4: Configure `DMARC` (Domain-based Message Authentication, Reporting & Conformance)
DMARC instructs receiving mail servers (Gmail, Outlook, Yahoo, corporate gateways) how to handle messages from `@jobmatch.ai` that fail SPF or DKIM alignment, and where to send aggregate authentication reports.

Add the following `TXT` record on `_dmarc.jobmatch.ai`:

#### Phase 1: Initial Rollout & Monitoring (`p=quarantine`)
```txt
Type:  TXT
Host:  _dmarc.jobmatch.ai
Value: v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc-reports@jobmatch.ai; adkim=r; aspf=r;
```

#### Phase 2: Full Production Enforcement (`p=reject`)
Once you verify 100% pass rates for 7–14 days, upgrade the policy to `p=reject` to prevent domain spoofing and phishing:
```txt
Type:  TXT
Host:  _dmarc.jobmatch.ai
Value: v=DMARC1; p=reject; sp=reject; pct=100; rua=mailto:dmarc-reports@jobmatch.ai; adkim=s; aspf=s;
```

---

### Step 2.5: Verify DNS Propagation via CLI
Run the following commands in PowerShell or bash before clicking **Verify DNS Records** in Resend:

```powershell
# 1. Verify SPF TXT record on Return-Path subdomain
nslookup -type=TXT send.jobmatch.ai

# 2. Verify MX record on Return-Path subdomain
nslookup -type=MX send.jobmatch.ai

# 3. Verify DKIM public key TXT record
nslookup -type=TXT resend._domainkey.jobmatch.ai

# 4. Verify DMARC policy TXT record
nslookup -type=TXT _dmarc.jobmatch.ai
```

---

## 3. Environment Variables

Configure the following variables in `.env.local` and your production hosting environment:

```env
# Resend API Key (starts with re_...)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Verified Project Domain Sender (NEVER use @gmail.com / @yahoo.com / @outlook.com)
EMAIL_FROM="JobMatch AI <noreply@jobmatch.ai>"

# Support & Admin Alert Addresses on Project Domain
SUPPORT_EMAIL="support@jobmatch.ai"
ADMIN_ALERT_EMAIL="admin@jobmatch.ai"

# Optional: Base backoff delay (ms) for the non-blocking retry queue
EMAIL_RETRY_BASE_MS="1500"
```

---

## 4. Unified 6-Language Templates (`en`, `ar`, `fr`, `de`, `es`, `tr`)

All email templates live in [`lib/email.ts`](../lib/email.ts) and render a unified brand layout with full **RTL (`dir="rtl"`)** support for Arabic (`ar`) and **LTR (`dir="ltr"`)** for English, French, German, Spanish, and Turkish:

| Template | Function(s) in `lib/email.ts` | Triggered By |
| :--- | :--- | :--- |
| **Welcome & Email Verification** | `getWelcomeEmailHtml`, `getEmailVerificationHtml` | `POST /api/auth/register`, `POST /api/auth/resend-verification` |
| **Reset Password** | `getPasswordResetEmailHtml` | `POST /api/auth/forgot-password` |
| **Payment Receipt** | `getPaymentReceiptEmailHtml`, `getPaymentReceiptEmailSubject` | `POST /api/webhooks/lemonsqueezy`, `POST /api/webhooks/payment` |
| **Subscription Renewed / Cancelled / Failed / Ended** | `getSubscriptionAlertEmailHtml`, `getSubscriptionRenewedEmailHtml`, `getSubscriptionCancelledEmailHtml`, `getSubscriptionFailedEmailHtml`, `getSubscriptionEmailSubject` | `POST /api/webhooks/lemonsqueezy`, `POST /api/webhooks/payment` |
| **Account Deletion Confirmation & Deleted Notice** | `getAccountDeleteConfirmEmailHtml`, `getAccountDeletedEmailHtml` | `POST /api/account/delete-confirm`, `DELETE /api/account` |

---

## 5. Fault Tolerance, Sentry Logging & Retry Queue

Email delivery in [`lib/email.ts`](../lib/email.ts) is designed so **no email failure ever breaks a user-facing operation** (registration, password reset, checkout/webhook completion, or account deletion):

1. **Try/Catch Isolation**: `sendEmail()` catches all network, API, or configuration errors and returns `{ success: false, error, queued }` without throwing.
2. **Sentry Exception Reporting**: Every failed delivery attempt (and any invalid consumer-domain sender configuration) is immediately captured in Sentry via `Sentry.captureException(error, { tags: { subsystem: 'email', ... } })` and stored in diagnostic failure logs (`getEmailFailureLogs()`).
3. **Exponential Backoff Retry Queue**: Failed sends are automatically enqueued in `emailRetryQueue` (`maxRetries = 2` by default) and retried asynchronously in the background via `flushEmailRetryQueue()` without blocking the HTTP response.

