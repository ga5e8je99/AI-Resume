# Production Incident & Operations Runbook (`RUNBOOK.md`)

This runbook documents standard operating procedures (SOPs) for monitoring, diagnosing, and resolving production incidents in **JobMatch AI**:
1. **UptimeRobot & `/api/health` Monitoring**
2. **Sentry Alerting (`webhook_failure`, `payment_failure`, `high_5xx_rate`, `ai_failure`)**
3. **Playbook 1: Failed Webhook Replay (`webhook فشل`)**
4. **Playbook 2: User Paid But Not Activated (`مستخدم دفع ومتفعلش`)**
5. **Playbook 3: Customer Refund & Entitlement Revocation (`refund`)**
6. **Playbook 4: Secret / API Key Compromise & Rotation (`تسريب مفتاح - rotate`)**
7. **Playbook 5: Emergency Database Restore (`DB restore`)**

---

## 1. UptimeRobot & `/api/health` Configuration

[`GET /api/health`](../app/api/health/route.ts) (and `HEAD /api/health`) verifies database connectivity (`mongodb` ping or `local_datastore`) and reports boolean configuration status for payments, AI, email, rate limiting, and Sentry **without exposing any secrets**.

### UptimeRobot Monitor Setup
1. Log in to [UptimeRobot](https://uptimerobot.com) and click **+ Add New Monitor**.
2. Configure two monitors:
   - **Monitor 1 (Keyword Monitor — Full Health)**:
     - **Monitor Type**: `Keyword`
     - **Friendly Name**: `JobMatch AI — API & DB Health`
     - **URL**: `https://<your-domain>/api/health`
     - **Keyword**: `"status":"ok"`
     - **Alert When**: `Keyword Not Exists`
     - **Monitoring Interval**: `1 minute` (or `5 minutes` on Free tier)
   - **Monitor 2 (HTTP HEAD Probe — Edge Availability)**:
     - **Monitor Type**: `HTTP(s)` (`HEAD` method)
     - **URL**: `https://<your-domain>/api/health`
     - **Expected Status Code**: `200`

---

## 2. Sentry Alert Rules

All server and client Sentry SDKs ([`lib/sentry.ts`](../lib/sentry.ts), [`sentry.server.config.ts`](../sentry.server.config.ts)) automatically stamp `environment` and `release` tags, filter out crawler/bot traffic (`isBotUserAgent`), scrub PII (`scrubPiiEvent`), and emit structured `alert_category` tags.

Configure the following 4 Issue/Metric Alert Rules in **Sentry > Alerts > Create Alert**:

| Alert Name | Filter Condition (`tags`) | Threshold | Action |
| :--- | :--- | :--- | :--- |
| **1. Webhook Failure Alert** | `alert_category:webhook_failure` | Immediately on every event (`1 event`) | Email + Slack `#ops-payments` |
| **2. Payment / Checkout Failure** | `alert_category:payment_failure` | Immediately on every event (`1 event`) | Email + Slack `#ops-payments` |
| **3. High 5xx Error Rate** | `alert_category:high_5xx_rate` (or `status_code:5*`) | `>= 5 events in 1 minute` | PagerDuty / Urgent Email |
| **4. AI Provider / Budget Failure** | `alert_category:ai_failure` | Immediately on circuit breaker trip or budget cap | Email `admin@jobmatch.ai` |

---

## 3. Playbook 1: Failed Webhook (`webhook فشل — Replay`)

### Symptoms
- Sentry triggers `alert_category:webhook_failure`.
- Webhook returned `401 INVALID_SIGNATURE`, `400 AMOUNT_OR_CURRENCY_MISMATCH`, `404 ORDER_NOT_FOUND`, or `500 WEBHOOK_ERROR`.

### Resolution Steps
1. **Inspect the Failure Reason**:
   - Check the Sentry event metadata (`orderId`, `reference`, `expectedAmountCents`, `actualAmountCents`) or query the `PaymentEvent` collection (`status: 'rejected'`).
2. **If `401 INVALID_SIGNATURE`**:
   - Verify that `LEMONSQUEEZY_WEBHOOK_SECRET` (or `STRIPE_WEBHOOK_SECRET` / `PAYMOB_HMAC_SECRET`) in Vercel matches the signing secret in the provider dashboard.
   - Redeploy if the environment variable was updated.
3. **Replay the Webhook from the Provider Dashboard**:
   - **Lemon Squeezy**: Go to **Settings > Webhooks > Recent Deliveries**, select the failed event, and click **Resend**.
   - **Stripe**: Go to **Developers > Webhooks > Events**, select the failed event, and click **Resend**.
   - **Paymob**: Go to **Accept Dashboard > Transactions**, select the transaction, and click **Resend Callback**.
4. **Verify Idempotency**:
   - All webhook endpoints (`/api/webhooks/lemonsqueezy` and `/api/webhooks/payment`) check `DataStore.isEventProcessed(eventId)` and `DataStore.completeOrder(order.id)`. Replaying an event is 100% safe and idempotent.

---

## 4. Playbook 2: User Paid But Not Activated (`مستخدم دفع ومتفعلش`)

### Symptoms
- Customer provides a payment receipt or order reference (`ORD-...`), but their account is still on the `free` plan or missing PAYG credits.

### Resolution Steps

#### Option A: Automated Provider Reconciliation (`scripts/reconcile-payments.ts`)
Run the reconciliation script to compare all local orders against the payment provider and automatically activate any order confirmed `paid` at the provider:

```bash
# 1. Dry-run to inspect discrepancies without modifying the database
npx tsx scripts/reconcile-payments.ts

# 2. Auto-repair orders confirmed paid at the provider
npx tsx scripts/reconcile-payments.ts --fix
```

#### Option B: Manual Admin Order Review & Activation (`scripts/admin-review-order.ts`)
1. Verify the payment in the Lemon Squeezy / Stripe / Paymob dashboard (confirm status is **Paid** and amount matches).
2. Inspect the stored Order locally/in production:
   ```bash
   npx tsx scripts/admin-review-order.ts --order <orderId_or_reference>
   ```
3. Approve and activate the Order idempotently via `DataStore.completeOrder`:
   ```bash
   npx tsx scripts/admin-review-order.ts --order <orderId_or_reference> --action approve --note "Verified receipt #LS-987654"
   ```
4. Alternatively, use the Admin API endpoint (`POST /api/admin/payments/review`) with your admin session or `x-admin-key` header:
   ```bash
   curl -X POST https://<your-domain>/api/admin/payments/review \
     -H "Content-Type: application/json" \
     -H "x-admin-key: $ADMIN_KEY" \
     -d '{"orderId":"<ORDER_ID>","action":"approve","note":"Verified provider payment"}'
   ```

---

## 5. Playbook 3: Handling Refunds (`refund`)

### Resolution Steps
1. **Initiate Refund at the Provider (Recommended)**:
   - Issue the refund in **Lemon Squeezy > Orders > Issue Refund** (or Stripe / Paymob).
   - The provider automatically sends an `order_refunded` / `charge.refunded` webhook to JobMatch AI.
   - `DataStore.refundOrder(order.id)` automatically marks the Order as `refunded` and revokes the granted Pro plan (`plan: 'free'`) or deducts the 15 PAYG credits.
2. **Manual Fallback (If Webhook Was Missed)**:
   - Run the admin script to revoke entitlements and mark the order refunded:
     ```bash
     npx tsx scripts/admin-review-order.ts --order <orderId_or_reference> --action refund --note "Refunded in Lemon Squeezy"
     ```
   - Or run `npx tsx scripts/reconcile-payments.ts --fix` to sync refund status from the provider.

---

## 6. Playbook 4: Secret / API Key Compromise & Rotation (`تسريب مفتاح — Rotate`)

If any secret key is suspected of being leaked or exposed, rotate it immediately in the following order:

### 6.1 Rotate `JWT_SECRET` (Invalidates All Active User Sessions)
1. Generate a new 64-byte hex secret:
   ```bash
   openssl rand -hex 64
   ```
2. Update `JWT_SECRET` in Vercel **Project Settings > Environment Variables**.
3. Trigger a production redeploy. All existing JWT cookies/tokens are immediately invalidated and users will be prompted to sign in again.

### 6.2 Rotate `ADMIN_KEY`
1. Generate a new key via `openssl rand -hex 32`.
2. Update `ADMIN_KEY` in Vercel and redeploy.

### 6.3 Rotate Payment Provider Keys (`LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY`)
1. **API Key**:
   - Create a new API key in Lemon Squeezy (**Settings > API**) or Roll Key in Stripe (**Developers > API Keys**).
   - Update `LEMONSQUEEZY_API_KEY` / `STRIPE_SECRET_KEY` in Vercel and redeploy.
   - Revoke the old API key in the provider dashboard once the new deployment is live.
2. **Webhook Secret**:
   - Rotate the webhook signing secret in the provider dashboard, update `LEMONSQUEEZY_WEBHOOK_SECRET` / `STRIPE_WEBHOOK_SECRET` in Vercel, redeploy, and replay any webhook deliveries that arrived during the 30-second cutover window (see Playbook 1).

### 6.4 Rotate `OPENAI_API_KEY` or `RESEND_API_KEY`
1. Create a new key in OpenAI / Resend dashboard.
2. Update the environment variable in Vercel and redeploy.
3. Delete the compromised key. (Note: while `OPENAI_API_KEY` is being rotated, the built-in ATS engine fallback continues serving users with zero downtime).

### 6.5 Rotate `MONGODB_URI` Database Password
1. In **MongoDB Atlas > Database Access**, edit the application database user and generate a new password (or create a second user `jobmatch_app_v2`).
2. Update `MONGODB_URI` in Vercel and redeploy.
3. Verify `/api/health` reports `"database": { "status": "up", "mode": "mongodb" }`.
4. Remove the old database user in MongoDB Atlas.

---

## 7. Playbook 5: Emergency Database Restore (`DB restore`)

When data corruption, accidental deletion, or a database incident occurs:

1. **Enable Maintenance / Freeze Writes**:
   - Pause incoming webhook processing (provider webhooks will automatically retry for up to 72 hours).
2. **Execute Restore**:
   - Follow the step-by-step instructions in [`docs/BACKUP.md`](./BACKUP.md) to restore from **MongoDB Atlas Point-in-Time Restore (PITR)** or the latest snapshot.
3. **Verify Health**:
   - Call `GET /api/health` and confirm `"status": "ok"` and `"database": { "status": "up", "mode": "mongodb" }`.
4. **Reconcile Payments Post-Restore**:
   - Any payment completed between the snapshot timestamp and the restore time must be reconciled:
     ```bash
     npx tsx scripts/reconcile-payments.ts --fix
     ```
   - This ensures no customer who paid during the recovery window loses their Pro plan or credits.

