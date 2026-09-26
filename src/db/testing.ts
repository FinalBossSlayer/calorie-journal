/// <reference types="node" />
/** Test helper: an in-memory Node SQLite database with the app's real migrations applied. */
import { DatabaseSync } from 'node:sqlite';

import { applyMigrations } from '../../scripts/seed/lib/migrate';

export function migratedDb(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  applyMigrations(db);
  return db;
}
