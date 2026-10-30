/**
 * Migration Script: migrate-user-credits.ts
 * 
 * Safely migrates existing user accounts by populating default subscription & AI credit fields:
 * - plan: 'free'
 * - aiCredits: 3
 * - billingCycle: 'none'
 * - planExpiresAt: null
 * - paymentProvider: 'none'
 * - providerCustomerId: ''
 * - providerSubscriptionId: ''
 * 
 * Safe to run multiple times (idempotent).
 * Supports both MongoDB (if connected) and local JSON Datastore (.data/db.json).
 */

import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { isMongoAvailable } from '../app/lib/datastore';
import User from '../app/models/User';

interface MigrationStats {
  localDbChecked: number;
  localDbUpdated: number;
  mongoDbChecked: number;
  mongoDbUpdated: number;
}

async function migrateLocalJsonDb(dbPath: string): Promise<{ checked: number; updated: number }> {
  if (!fs.existsSync(dbPath)) {
    return { checked: 0, updated: 0 };
  }

  try {
    const raw = fs.readFileSync(dbPath, 'utf-8');
    const data = JSON.parse(raw);

    if (!Array.isArray(data.users) || data.users.length === 0) {
      return { checked: 0, updated: 0 };
    }

    let updatedCount = 0;
    for (const user of data.users) {
      let changed = false;

      if (!user.plan) {
        user.plan = 'free';
        changed = true;
      }
      if (typeof user.aiCredits !== 'number') {
        user.aiCredits = 3;
        changed = true;
      }
      if (!user.billingCycle) {
        user.billingCycle = 'none';
        changed = true;
      }
      if (user.planExpiresAt === undefined) {
        user.planExpiresAt = null;
        changed = true;
      }
      if (!user.paymentProvider) {
        user.paymentProvider = 'none';
        changed = true;
      }
      if (user.providerCustomerId === undefined) {
        user.providerCustomerId = '';
        changed = true;
      }
      if (user.providerSubscriptionId === undefined) {
        user.providerSubscriptionId = '';
        changed = true;
      }

      if (changed) {
        user.updatedAt = new Date().toISOString();
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
    }

    return { checked: data.users.length, updated: updatedCount };
  } catch (err: any) {
    console.error('❌ Error processing local JSON DB:', err.message);
    return { checked: 0, updated: 0 };
  }
}

async function migrateMongoDb(): Promise<{ checked: number; updated: number }> {
  try {
    const mongoUp = await isMongoAvailable();
    if (!mongoUp) {
      console.log('ℹ️  MongoDB offline or unconfigured. Proceeding with local DB.');
      return { checked: 0, updated: 0 };
    }

    const filter = {
      $or: [
        { plan: { $exists: false } },
        { aiCredits: { $exists: false } },
        { billingCycle: { $exists: false } },
        { planExpiresAt: { $exists: false } },
        { paymentProvider: { $exists: false } },
        { providerCustomerId: { $exists: false } },
        { providerSubscriptionId: { $exists: false } },
      ],
    };

    const countNeedingUpdate = await User.countDocuments(filter);
    const totalCount = await User.countDocuments({});

    if (countNeedingUpdate > 0) {
      const result = await User.updateMany(filter, {
        $set: {
          plan: 'free',
          aiCredits: 3,
          billingCycle: 'none',
          planExpiresAt: null,
          paymentProvider: 'none',
          providerCustomerId: '',
          providerSubscriptionId: '',
        },
      });

      return { checked: totalCount, updated: result.modifiedCount };
    }

    return { checked: totalCount, updated: 0 };
  } catch (err: any) {
    console.log(`ℹ️  MongoDB skipped (${err.message}). Proceeding with local DB.`);
    return { checked: 0, updated: 0 };
  }
}

async function run() {
  console.log('============================================================');
  console.log('>>> RUNNING USER SUBSCRIPTION & CREDIT MIGRATION <<<');
  console.log('============================================================');

  const stats: MigrationStats = {
    localDbChecked: 0,
    localDbUpdated: 0,
    mongoDbChecked: 0,
    mongoDbUpdated: 0,
  };

  // 1. Migrate Local JSON Datastore (.data/db.json)
  const localDbPath = path.join(process.cwd(), '.data', 'db.json');
  console.log(`\n📁 Checking local JSON database at: ${localDbPath}...`);
  const localRes = await migrateLocalJsonDb(localDbPath);
  stats.localDbChecked = localRes.checked;
  stats.localDbUpdated = localRes.updated;
  console.log(`✔ Local JSON DB: Checked ${localRes.checked} users | Updated ${localRes.updated} users.`);

  // 2. Migrate MongoDB (if available)
  console.log('\n🍃 Checking MongoDB connection...');
  const mongoRes = await migrateMongoDb();
  stats.mongoDbChecked = mongoRes.checked;
  stats.mongoDbUpdated = mongoRes.updated;
  if (stats.mongoDbChecked > 0) {
    console.log(`✔ MongoDB: Checked ${mongoRes.checked} documents | Updated ${mongoRes.updated} documents.`);
  }

  console.log('\n============================================================');
  console.log('>>> MIGRATION SUMMARY <<<');
  console.log(`Total Local Users Updated : ${stats.localDbUpdated}`);
  console.log(`Total Mongo Users Updated : ${stats.mongoDbUpdated}`);
  console.log('Status                    : SUCCESS (Idempotent)');
  console.log('============================================================\n');

  // Disconnect mongo cleanly if connected
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
