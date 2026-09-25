import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';

import journal from '../../../src/db/migrations/meta/_journal.json';

const MIGRATIONS_DIR = join(__dirname, '..', '..', '..', 'src', 'db', 'migrations');

/**
 * Applies the app's migration files the same way Drizzle's Expo migrator does,
 * including its bookkeeping table, so the app treats a prebuilt database as
 * already migrated and only runs migrations added after the build.
 * Mirrors drizzle-orm/sqlite-core/dialect.js (SQLiteSyncDialect.migrate).
 */
export function applyMigrations(db: DatabaseSync): void {
  db.exec(`CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
    id SERIAL PRIMARY KEY,
    hash text NOT NULL,
    created_at numeric
  )`);
  const insert = db.prepare('INSERT INTO "__drizzle_migrations" ("hash", "created_at") VALUES (?, ?)');

  db.exec('BEGIN');
  try {
    for (const entry of journal.entries) {
      const file = readFileSync(join(MIGRATIONS_DIR, `${entry.tag}.sql`), 'utf8');
      for (const statement of file.split('--> statement-breakpoint')) {
        if (statement.trim()) db.exec(statement);
      }
      // The Expo migrator records an empty hash; only created_at is compared.
      insert.run('', entry.when);
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
