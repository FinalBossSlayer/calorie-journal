import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

export const DATABASE_NAME = 'app.db';

// enableChangeListener lets Drizzle's useLiveQuery re-render screens when rows change.
const sqlite = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });

// SQLite leaves foreign keys off unless enabled on every connection.
sqlite.execSync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');

export const db = drizzle(sqlite, { schema });
