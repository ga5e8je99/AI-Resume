# Vercel & MongoDB Atlas Deployment Guide

A step-by-step production deployment guide for **JobMatch AI** using **Vercel** (Next.js serverless hosting) and **MongoDB Atlas** (cloud database).

---

## 1. Create a Free MongoDB Atlas Database

1. **Sign up or log in** to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. **Create an Organization and Project** (e.g. `JobMatch-Production`).
3. **Deploy a Free Cluster**:
   - Select **M0 Free Tier** (Shared).
   - Choose a cloud provider and region closest to your primary user base (e.g., AWS Frankfurt, Ireland, or N. Virginia).
   - Click **Create Deployment**.
4. **Create a Database User**:
   - Go to **Security** > **Database Access** > **Add New Database User**.
   - Authentication Method: **Password**.
   - Set a strong username (e.g., `jobmatch_app`) and generate a secure password.
   - Database User Privileges: **Read and write to any database**.
   - Save the credentials securely.
5. **Configure Network Access**:
   - Go to **Security** > **Network Access** > **Add IP Address**.
   - Select **Allow Access from Anywhere** (`0.0.0.0/0`) since Vercel serverless lambdas use dynamic IP addresses.
   - Click **Confirm**.
6. **Obtain Connection String**:
   - Go to **Database** > **Connect** > **Drivers** (Node.js).
   - Copy the connection string format:
     ```text
     mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/jobmatch?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with your database user credentials. Replace `jobmatch` with your desired database name.

---

## 2. Configure Environment Variables in Vercel

1. **Import the repository** in [Vercel Dashboard](https://vercel.com/new).
2. Select **Next.js** framework preset.
3. In **Settings > Environment Variables**, add the following production variables:

| Variable Name | Required | Description | Example / Recommended Value |
|---|---|---|---|
| `MONGODB_URI` | **Yes** | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/jobmatch?retryWrites=true&w=majority` |
| `JWT_SECRET` | **Yes** | Session JWT signing secret (min 32 chars) | Generate via `openssl rand -hex 32` |
| `ADMIN_KEY` | **Yes** | Master administrative access key | Strong random passphrase |
| `ADMIN_EMAILS` | **Yes** | Comma-separated admin accounts | `admin@yourdomain.com` |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Canonical deployment URL | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_API_URL` | No | Client-side API root | `https://your-app.vercel.app/api` |
| `OPENAI_API_KEY` | Optional | OpenAI API key for LLM cover letters | `sk-...` (Falls back to local ATS engine if blank) |
| `OPENAI_MODEL` | Optional | Model name | `gpt-4o-mini` |
| `RESEND_API_KEY` | Optional | Resend API key for transactional emails | `re_...` (Simulated in console logs if blank) |
| `EMAIL_FROM` | Optional | Sender email verified in Resend | `JobMatch AI <onboarding@yourdomain.com>` |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | Sentry client DSN for error monitoring | `https://...` (PII stripped before sending) |
| `SENTRY_DSN` | Optional | Sentry server/edge DSN | `https://...` |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional | PostHog project API key | `phc_...` (Only active after cookie consent) |
| `NEXT_PUBLIC_POSTHOG_HOST` | Optional | PostHog host endpoint | `https://us.i.posthog.com` |

---

## 3. Deploy to Vercel

### Option A: Via GitHub / GitLab / Bitbucket (Recommended)
1. Push your repository to your Git provider.
2. In Vercel, link the repository.
3. Vercel automatically builds and deploys using Webpack (`next build --webpack`).

### Option B: Via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 4. Post-Deployment Smoke Test Checklist

Once the deployment completes, perform the following verification checks:

- [ ] **Homepage Load:** Visit `https://your-app.vercel.app/` and verify that stylesheets, hero elements, and templates render crisply.
- [ ] **Instant Demo Login:**
  - Navigate to `/login`.
  - Click **"⚡ Try Demo Instantly"**.
  - Verify automatic redirect to `/dashboard`.
  - Confirm the pre-seeded Full-Stack Developer resume, ATS scan report (score 88), and cover letter draft appear.
- [ ] **New User Registration:**
  - Open an incognito browser window.
  - Visit `/register`, create a new user account, and ensure successful session redirection.
- [ ] **Resume Builder:**
  - Go to `/builder`.
  - Edit personal details or experience items and verify changes save to MongoDB Atlas.
- [ ] **ATS Scanner:**
  - Go to `/review`.
  - Upload a test PDF or sample text, run diagnostic scoring, and confirm report generation.
- [ ] **AI Cover Letter Generator:**
  - Go to `/cover-letter`.
  - Generate a new cover letter draft. Verify that synthesis succeeds (either via OpenAI API if configured, or through the built-in algorithmic engine).
- [ ] **Custom 404 & Error Boundaries:**
  - Visit `https://your-app.vercel.app/non-existent-path-test`.
  - Confirm the branded 404 page displays with "Go Home" and "Go to Dashboard" navigation buttons.
  - Toggle Arabic language in the header and verify RTL layout.

---

## 5. Serverless Architecture Highlights

- **Cached Mongoose Connection:** Database connections persist across warm lambda invocations to avoid opening redundant connections on every HTTP request.
- **Fail-Fast Error Boundaries:** All API routes configure `maxDuration: 60` in `vercel.json` to handle external AI generation without timeout drops.
- **Zero Local Filesystem Dependency:** In production, user data, resumes, analysis audits, and cover letters are stored directly in MongoDB Atlas. Local disk writes are automatically bypassed in serverless mode.

---

## 6. Payment Gateways & Webhook Configuration

JobMatch AI features a unified payment provider abstraction:
- **Stripe:** International USD credit & debit card processing.
- **Paymob:** Egyptian EGP payment processing (Visa, MasterCard, Meeza, Fawry, Vodafone Cash).

### A. Stripe Setup (USD & International)
1. **Retrieve API Keys:**
   - Log in to [Stripe Dashboard](https://dashboard.stripe.com/apikeys).
   - Copy `Publishable key` (`pk_test_...`) and `Secret key` (`sk_test_...`).
   - Add `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in Vercel Environment Variables.
2. **Configure Webhook Endpoint:**
   - Go to **Developers > Webhooks > Add Endpoint**.
   - Endpoint URL: `https://your-app.vercel.app/api/webhooks/payment`
   - Select events to listen to:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `customer.subscription.deleted`
   - Copy the **Signing secret** (`whsec_...`) and set it as `STRIPE_WEBHOOK_SECRET` in Vercel.
3. **Local Testing with Stripe CLI:**
   ```bash
   # Install Stripe CLI and log in
   stripe login

   # Forward webhook events to your local server
   stripe listen --forward-to localhost:3000/api/webhooks/payment

   # Trigger a test checkout session completed event in a new terminal
   stripe trigger checkout.session.completed
   ```

### B. Paymob Setup (Egypt / EGP)
1. **Retrieve API Credentials:**
   - Log in to [Paymob Accept](https://accept.paymob.com).
   - Go to **Settings > Account Info** and copy your **API Key**. Set as `PAYMOB_API_KEY`.
   - Go to **Payment Integrations**: create or copy an **Integration ID** for Online Cards. Set as `PAYMOB_INTEGRATION_ID`.
   - Go to **Settings > Account Info** and copy your **HMAC Secret**. Set as `PAYMOB_HMAC_SECRET`.
2. **Configure Transaction Webhook Callback:**
   - In Paymob Accept under **Payment Integrations > Edit Integration**:
   - Set **Transaction Processed Callback** to:
     `https://your-app.vercel.app/api/webhooks/payment?provider=paymob`
   - Set **Transaction Response Callback** to:
     `https://your-app.vercel.app/payment/success`
3. **Testing with Paymob Test Cards:**
   - Test Card Number: `5123 4567 8901 2346` or `4111 1111 1111 1111`
   - Expiry Date: Any future month/year (e.g. `12/28`)
   - CVV: `123`
   - 3D Secure OTP: `1234` or `1111`

---

## 7. Binance Pay & Direct Crypto Payments (USDT)

JobMatch AI supports receiving payments directly into your Binance account using a unified hybrid approach:

### Official Binance Documentation Constraints:
- **Binance Pay Merchant API (Method A):** Binance requires an approved **Binance Pay Merchant account** (with corporate business registration, legal KYB verification, and formal approval by Binance). A standard personal Binance account cannot generate `Binance-Pay-Certificate-SN` or API secrets for automated checkout redirection.
- **Direct Crypto Transfer (Method B - Default Fallback):** For personal Binance account holders, users transfer USDT directly to your Binance deposit wallet address on **BNB Smart Chain (BEP20)** or **TRON (TRC20)**. Each order is generated with a unique cents suffix (e.g. `$9.14 USDT`), allowing automated on-chain verification via BscScan and TronGrid explorer APIs.

### Method A: Binance Pay Merchant API Setup (Optional)
1. If you hold an approved merchant account, log in to [Binance Merchant Admin Portal](https://merchant.binance.com).
2. Go to **Developer > API Management** and generate:
   - `BINANCE_PAY_API_KEY` (Certificate Serial Number / API Key)
   - `BINANCE_PAY_SECRET` (API Secret Key)
   - `BINANCE_PAY_MERCHANT_ID`
3. Configure the webhook URL in Binance Merchant Portal:
   - `https://your-app.vercel.app/api/webhooks/binance-pay`
4. The server automatically uses HMAC-SHA512 request signing and RSA-SHA256 webhook certificate verification.

### Method B: Personal Binance Deposit Address Setup (Default Fallback)
1. **Get your deposit address in the Binance app:**
   - Open Binance -> **Deposit** -> Select **USDT**.
   - Choose **BNB Smart Chain (BEP20)**: Copy the deposit address and set `PAYMENT_WALLET_BEP20`.
   - Choose **TRON (TRC20)**: Copy the deposit address and set `PAYMENT_WALLET_TRC20`.
2. **Get free Explorer API keys for automated verification:**
   - **BscScan (BEP20):** Register at [bscscan.com/myapikey](https://bscscan.com/myapikey) and set `BSCSCAN_API_KEY`.
   - **TronGrid (TRC20):** Register at [trongrid.io](https://www.trongrid.io/dashboard/keys) and set `TRONGRID_API_KEY`.
3. **Set Admin Email Allowlist:**
   - Set `ADMIN_EMAILS=your_email@example.com` in your environment to access the `/admin/payments` review dashboard.

### How to Test with a Small Real Transfer:
1. Configure `PAYMENT_WALLET_BEP20` with your real Binance deposit address and set `BSCSCAN_API_KEY`.
2. Open the application and navigate to `/pricing`.
3. Select **USDT (Binance)** in the currency toggle, or click **"Or pay with Binance / Crypto (USDT)"** on JobMatch Pro or Pay-As-You-Go.
4. The system opens `/payment/crypto?reference=ORD-...` displaying:
   - The exact unique USDT amount with cents (e.g. `9.14 USDT`).
   - The BEP20 QR code and your deposit address.
   - A 30-minute expiry countdown timer.
5. From your personal Web3 wallet (e.g. MetaMask or Trust Wallet) or another exchange, send the exact transfer of USDT on the BNB Smart Chain (BEP20). (BEP20 network fees are typically ~$0.15).
6. Once the transaction completes, copy the **Transaction Hash (TXID)** from your wallet.
7. Paste the TXID into the input field and click **"Verify Payment"**.
8. The server queries BscScan, validates the token contract address, confirms the recipient matches your wallet, checks the amount, confirms block consensus, and verifies the TXID has not been claimed before.
9. Upon success:
   - Your subscription is activated instantly.
   - A receipt confirmation email is sent (if configured).
   - You are redirected to `/payment/success`.
10. **Manual Admin Review Testing:**
    - If a transaction is submitted before enough block confirmations occur, or if an explorer API experiences transient delay, the order is automatically marked as `pending_review`.
    - Log in with your admin account and open `/admin/payments`.
    - Click the TXID link to inspect the transaction on BscScan / TronScan.
    - Click **"Approve"** to manually complete the order and immediately activate the user's plan.

