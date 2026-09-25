import { toSearchKey } from '@/lib/translit';

import { getDb } from './client';

/**
 * TEMPORARY (Milestones 2–3): logs a DB smoke test to the Metro terminal.
 * Read-only. Remove once real screens read from the database.
 */
export function runDevDatabaseCheck(): void {
  const sqlite = getDb().$client;
  const count = (sql: string) => sqlite.getFirstSync<{ n: number }>(sql)?.n ?? 0;

  const meals = sqlite.getAllSync<{ nameMk: string; nameEn: string }>(
    'SELECT nameMk, nameEn FROM meals ORDER BY sortOrder',
  );
  console.log('[db] meals:', meals.map((m) => `${m.nameMk}/${m.nameEn}`).join(', '));
  console.log(
    `[db] foods: ${count('SELECT count(*) AS n FROM foods')}, ` +
      `dishes: ${count(`SELECT count(*) AS n FROM foods WHERE source = 'seed'`)}, ` +
      `portions: ${count('SELECT count(*) AS n FROM portions')}`,
  );

  for (const query of ['tavce', 'сирење', 'pileski gradi']) {
    const match = toSearchKey(query)
      .split(' ')
      .map((term) => `"${term}"*`)
      .join(' ');
    const hits = sqlite.getAllSync<{ name: string; kcal: number }>(
      `SELECT coalesce(f.nameMk, f.nameEn) AS name, f.kcal FROM foods_fts
       JOIN foods f ON f.id = foods_fts.foodId
       WHERE foods_fts.searchKey MATCH ? AND f.deletedAt IS NULL
       ORDER BY (f.source = 'seed') DESC, (f.nameMk IS NOT NULL) DESC, rank LIMIT 3`,
      [match],
    );
    console.log(`[db] search "${query}" → ${hits.map((h) => `${h.name} (${h.kcal} kcal)`).join(', ') || 'NO MATCH'}`);
  }
}
