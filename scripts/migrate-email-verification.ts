/**
 * Migration Script: Email Verification for Existing Users
 * -------------------------------------------------------
 * Usage:
 *   npx tsx scripts/migrate-email-verification.ts [--mode=require-on-login | --mode=mark-all-verified]
 *
 * Security Rationale (Default: `require-on-login`):
 * - Blindly marking every pre-existing free account as `verified` risks grandfathering
 *   unverified/spoofed email addresses (pre-account takeover) and automated bot accounts
 *   that were created before email verification was enforced.
 * - With `require-on-login` (the most secure strategy):
 *   1. Accounts that have already proven trust/ownership (`role === 'admin'`, `isDemo === true`,
 *      or paid `plan === 'pro' | 'enterprise'`, or existing customer IDs) are marked
 *      `emailVerified = createdAt || now`.
 *   2. Unverified free accounts are set to `emailVerified = null` and `emailVerifyTokenHash = null`.
 *      They can still log in and use the basic CV Builder without losing any saved resumes,
 *      and upon their next login (`/api/auth/login`) or via the banner's "Resend" button,
 *      a fresh 24-hour SHA-256 hashed verification token is issued and emailed to them.
 */

import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import User from '../app/models/User';

export interface MigrationSummary {
  mode: 'require-on-login' | 'mark-all-verified';
  localUpdated: number;
  localMarkedVerified: number;
  localMarkedRequireOnLogin: number;
  mongoUpdated: number;
}

function isTrustedExistingUser(u: Record<string, any>): boolean {
  if (u.role === 'admin' || u.isDemo === true) return true;
  if (u.plan === 'pro' || u.plan === 'enterprise') return true;
  if (u.stripeCustomerId || u.lemonCustomerId || u.subscriptionStatus === 'active') return true;
  // Seed demo/reference accounts in local dev DB
  if (u.id === 'usr_admin_001' || u.id === 'usr_002' || u.id === 'usr_003') return true;
  return false;
}

export async function runEmailVerificationMigration(
  mode: 'require-on-login' | 'mark-all-verified' = 'require-on-login'
): Promise<MigrationSummary> {
  const summary: MigrationSummary = {
    mode,
    localUpdated: 0,
    localMarkedVerified: 0,
    localMarkedRequireOnLogin: 0,
    mongoUpdated: 0,
  };

  // 1. Migrate Local JSON DataStore (.data/db.json)
  const dbPath = path.join(process.cwd(), '.data', 'db.json');
  if (fs.existsSync(dbPath)) {
    const raw = fs.readFileSync(dbPath, 'utf-8');
    const db = JSON.parse(raw);
    if (Array.isArray(db.users)) {
      for (const user of db.users) {
        if (user.emailVerified !== undefined) {
          continue;
        }
        if (mode === 'mark-all-verified' || isTrustedExistingUser(user)) {
          user.emailVerified = user.createdAt || new Date().toISOString();
          user.emailVerifyTokenHash = null;
          user.emailVerifyExpires = null;
          summary.localMarkedVerified++;
        } else {
          user.emailVerified = null;
          user.emailVerifyTokenHash = null;
          user.emailVerifyExpires = null;
          summary.localMarkedRequireOnLogin++;
        }
        user.updatedAt = new Date().toISOString();
        summary.localUpdated++;
      }
      if (summary.localUpdated > 0) {
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
      }
    }
  }

  // 2. Migrate MongoDB (if MONGODB_URI is configured)
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri && !mongoUri.includes('localhost:27017/placeholder')) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
      if (mode === 'mark-all-verified') {
        const res = await User.updateMany(
          { emailVerified: { $exists: false } },
          {
            $set: { emailVerified: new Date() },
            $unset: { emailVerifyTokenHash: 1, emailVerifyExpires: 1 },
          }
        );
        summary.mongoUpdated = res.modifiedCount || 0;
      } else {
        // Mark trusted/admin/paid users as verified
        const trustedRes = await User.updateMany(
          {
            emailVerified: { $exists: false },
            $or: [
              { role: 'admin' },
              { isDemo: true },
              { plan: { $in: ['pro', 'enterprise'] } },
              { subscriptionStatus: 'active' },
            ],
          },
          {
            $set: { emailVerified: new Date() },
            $unset: { emailVerifyTokenHash: 1, emailVerifyExpires: 1 },
          }
        );
        // Require verification on first login for remaining unverified free accounts
        const untrustedRes = await User.updateMany(
          { emailVerified: { $exists: false } },
          {
            $set: { emailVerified: null },
            $unset: { emailVerifyTokenHash: 1, emailVerifyExpires: 1 },
          }
        );
        summary.mongoUpdated =
          (trustedRes.modifiedCount || 0) + (untrustedRes.modifiedCount || 0);
      }
      await mongoose.disconnect();
    } catch {
      // MongoDB not reachable in local/offline environment; local JSON DataStore was migrated
    }
  }

  return summary;
}

if (require.main === module) {
  const argMode = process.argv.find((a) => a.startsWith('--mode='))?.split('=')[1];
  const mode = argMode === 'mark-all-verified' ? 'mark-all-verified' : 'require-on-login';
  runEmailVerificationMigration(mode)
    .then((result) => {
      console.log('[Email Verification Migration Complete]', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Email Verification Migration Error]', err);
      process.exit(1);
    });
}

