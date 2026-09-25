import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

import * as schema from './schema';

/**
 * On-device file name. On first launch SQLiteProvider copies the bundled
 * assets/db/app.db to this name; after that the existing file is kept.
 */
export const DATABASE_NAME = 'journal.db';

export type AppDatabase = ExpoSQLiteDatabase<typeof schema> & { $client: SQLiteDatabase };

let instance: AppDatabase | null = null;

/** SQLiteProvider onInit: runs once the file is in place, before migrations. */
export async function initDatabase(sqlite: SQLiteDatabase): Promise<void> {
  // SQLite leaves foreign keys off unless enabled on every connection.
  await sqlite.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  instance = drizzle(sqlite, { schema });
}

/** The app database. Only valid inside <DatabaseGate>. */
export function getDb(): AppDatabase {
  if (!instance) throw new Error('Database not initialised: render inside <DatabaseGate>');
  return instance;
}
