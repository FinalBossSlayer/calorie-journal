import { toSearchKey } from '@/lib/translit';

import { db } from './client';

/**
 * TEMPORARY (Milestone 2): logs a DB smoke test to the Metro terminal.
 * Everything runs inside a transaction that is rolled back, so nothing is saved.
 * Remove once real screens read from the database.
 */
export function runDevDatabaseCheck(): void {
  const sqlite = db.$client;
  const meals = sqlite.getAllSync<{ nameMk: string; nameEn: string }>(
    'SELECT nameMk, nameEn FROM meals ORDER BY sortOrder',
  );
  console.log('[db] meals:', meals.map((m) => `${m.nameMk}/${m.nameEn}`).join(', '));

  sqlite.execSync('BEGIN');
  try {
    const now = Date.now();
    sqlite.runSync(
      `INSERT INTO foods (id, nameMk, nameEn, searchKey, kind, source, createdAt, updatedAt)
       VALUES ('dev-check', 'Тавче гравче', 'Baked beans', ?, 'dish', 'user', ?, ?)`,
      [toSearchKey('Тавче гравче Baked beans'), now, now],
    );
    const hits = sqlite.getAllSync<{ nameMk: string }>(
      `SELECT f.nameMk FROM foods_fts JOIN foods f ON f.id = foods_fts.foodId
       WHERE foods_fts.searchKey MATCH ?`,
      [`"${toSearchKey('tavce')}"*`],
    );
    console.log(`[db] FTS search "tavce" → ${hits.map((h) => h.nameMk).join(', ') || 'NO MATCH'}`);
  } finally {
    sqlite.execSync('ROLLBACK');
  }
}
