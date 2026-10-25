import fs from 'fs';
import path from 'path';

// Migration script for Cover Letters:
// 1. Backfills missing 'status' and 'isArchived' fields in .data/db.json
// 2. Ensures data integrity and idempotency without leaking PII or secrets.

const DB_PATH = path.join(process.cwd(), '.data', 'db.json');

async function migrate() {
  console.log('[Migration] Starting Cover Letter schema migration...');

  if (!fs.existsSync(DB_PATH)) {
    console.log('[Migration] No local db.json found. Nothing to backfill.');
    return;
  }

  let raw;
  try {
    raw = fs.readFileSync(DB_PATH, 'utf-8');
  } catch (err) {
    console.error('[Migration] Failed to read db.json:', err.message);
    process.exit(1);
  }

  let db;
  try {
    db = JSON.parse(raw);
  } catch (err) {
    console.error('[Migration] Failed to parse db.json:', err.message);
    process.exit(1);
  }

  if (!Array.isArray(db.coverLetters)) {
    console.log('[Migration] Initializing empty coverLetters array.');
    db.coverLetters = [];
  }

  let migratedCount = 0;
  for (const item of db.coverLetters) {
    let changed = false;

    if (!item.status) {
      item.status = 'saved';
      changed = true;
    }

    if (item.isArchived === undefined) {
      item.isArchived = false;
      changed = true;
    }

    if (!item.templateId) {
      item.templateId = 'compact';
      changed = true;
    }

    if (changed) {
      migratedCount++;
    }
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');

  console.log(
    `[Migration] Completed successfully. Total records: ${db.coverLetters.length}, Migrated/Backfilled: ${migratedCount}`
  );
}

migrate();
