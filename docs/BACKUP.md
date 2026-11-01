# Database Backup & Disaster Recovery Guide (`BACKUP.md`)

This document defines the backup strategy, retention policies, step-by-step restoration procedures, and quarterly recovery drill protocol for **JobMatch AI** on **MongoDB Atlas**.

---

## 1. Critical Collections Covered

| Collection | Purpose | Recovery Priority |
| :--- | :--- | :--- |
| `users` | Accounts, password hashes, plan entitlements, `aiCredits`, `emailVerified`, `termsAcceptedAt` | **Tier 0 (Critical)** |
| `orders` | Financial order ledger, `status`, `amount`, `currency`, `auditLog` | **Tier 0 (Critical — Accounting)** |
| `payments` | Completed payment transactions & provider references | **Tier 0 (Critical — Accounting)** |
| `paymentevents` | Webhook idempotency ledger (`eventId` unique index) | **Tier 0 (Critical)** |
| `resumes` | User-created resumes & templates | **Tier 1 (High)** |
| `coverletters` | User-generated cover letters | **Tier 1 (High)** |
| `analyses` | Historical ATS diagnostic reports | **Tier 2 (Standard)** |
| `aiusages` | Per-request AI token & cost telemetry | **Tier 2 (Standard)** |

---

## 2. MongoDB Atlas Cloud Backup Configuration

### 2.1 Continuous Cloud Backups & Point-in-Time Restore (PITR)
For production clusters (`M10+`):
1. Open **MongoDB Atlas > Clusters > [Your Cluster] > Backup**.
2. Enable **Cloud Backup** and turn on **Continuous Cloud Backup (Point-in-Time Restore)** with a **7-day oplog restore window** (allows restoring to any exact second within the past 7 days).
3. Configure **Snapshot Schedule & Retention**:
   - **Hourly Snapshots**: Every 6 hours, retained for **7 days**.
   - **Daily Snapshots**: Every day at `02:00 UTC`, retained for **30 days**.
   - **Weekly Snapshots**: Every Sunday at `03:00 UTC`, retained for **12 weeks**.
   - **Monthly Snapshots**: 1st of every month, retained for **12 months** (for financial/tax audit compliance).

### 2.2 Automated Logical Backups (`mongodump` for M0 / M2 / Off-Site Archive)
If running on an Atlas `M0` Free / Flex tier (or to maintain an independent off-site encrypted archive), run `mongodump` daily via cron / GitHub Actions into encrypted object storage:

```bash
# Create compressed, oplog-consistent archive of the production database
mongodump \
  --uri="$MONGODB_URI" \
  --gzip \
  --archive="jobmatch-backup-$(date -u +%Y%m%d-%H%M%S).gz"
```

---

## 3. Step-by-Step Restoration Procedures

### Option A: Restore via MongoDB Atlas Dashboard (Snapshot or Point-in-Time)
1. Go to **MongoDB Atlas > Backup > Snapshots** (or **Point in Time Restore**).
2. Select either:
   - The latest clean snapshot prior to the incident, **OR**
   - The exact UTC timestamp (`YYYY-MM-DD HH:MM:SS`) immediately before the incident occurred.
3. **Recommended Safe Approach (Restore to Staging Cluster First)**:
   - Choose **Restore to another cluster** -> select `jobmatch-recovery-staging`.
   - Inspect collections (`users`, `orders`, `payments`, `resumes`) to verify data integrity.
   - Update `MONGODB_URI` in Vercel to point to the verified cluster (or promote it), and redeploy.
4. **In-Place Restore**:
   - Choose **Restore in place** on the production cluster if full cluster rollback is required.

---

### Option B: Restore from `mongodump` Archive via `mongorestore`

```bash
# 1. Restore into a staging/verification database first (--nsFrom / --nsTo)
mongorestore \
  --uri="$MONGODB_URI" \
  --gzip \
  --archive="jobmatch-backup-YYYYMMDD-HHMMSS.gz" \
  --nsFrom="jobmatch.*" \
  --nsTo="jobmatch_restore_verify.*"

# 2. Once verified, restore into the target database (use --drop only when replacing corrupted collections)
mongorestore \
  --uri="$MONGODB_URI" \
  --gzip \
  --drop \
  --archive="jobmatch-backup-YYYYMMDD-HHMMSS.gz"
```

---

## 4. Mandatory Post-Restore Verification & Payment Reconciliation

Immediately after any database restore, execute the following 3 verification steps before announcing recovery:

### Step 4.1: Verify Health Endpoint
```bash
curl -s https://<your-domain>/api/health | jq .
```
Confirm:
- `"status": "ok"`
- `"database": { "status": "up", "mode": "mongodb" }`

### Step 4.2: Reconcile Payments Completed During the Recovery Window
Any payment processed by Lemon Squeezy / Stripe / Paymob after the backup snapshot timestamp must be reconciled so customers retain their Pro subscriptions and AI credits:

```bash
# 1. Inspect any orders paid at the provider since the snapshot
npx tsx scripts/reconcile-payments.ts

# 2. Automatically apply missing activations and refunds
npx tsx scripts/reconcile-payments.ts --fix
```

### Step 4.3: Run Automated Critical Integrity Suite
```bash
npm test
```

---

## 5. Backup Restore Testing Protocol (Monthly / Quarterly Drill)

Backups are only as reliable as their last tested restore. Perform the following drill on the **1st Monday of every month**:

1. **Provision Temporary Database**: Target `jobmatch_drill_<YYYY_MM>` on staging Atlas cluster.
2. **Execute Restore**: Run `mongorestore` (or Atlas Snapshot Restore) into `jobmatch_drill_<YYYY_MM>`.
3. **Run Verification Checks**:
   - Verify document counts (`db.users.countDocuments()`, `db.orders.countDocuments()`, `db.resumes.countDocuments()`).
   - Verify unique indexes (`db.users.getIndexes()`, `db.orders.getIndexes()`, `db.paymentevents.getIndexes()`).
   - Run `MONGODB_URI="<staging_uri>" npx tsx scripts/reconcile-payments.ts` and confirm `0` unexpected discrepancies.
4. **Record RTO / RPO Metrics**:
   - **Target RPO (Recovery Point Objective)**: `< 1 hour` (or `< 1 minute` with Continuous Cloud Backup + `reconcile-payments.ts`).
   - **Target RTO (Recovery Time Objective)**: `< 15 minutes`.
5. **Cleanup**: Drop the temporary `jobmatch_drill_<YYYY_MM>` database after logging the drill result.

