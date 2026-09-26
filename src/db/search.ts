/**
 * Raw SQL for food search. Drizzle can't query FTS5 virtual tables, so these
 * are plain statements shared by the app (expo-sqlite) and the Node tests
 * (node:sqlite). Keep this file free of Expo imports.
 *
 * Ranking (CLAUDE.md): user foods and recently used foods first, then seed
 * dishes, then USDA. Within a tier: most recently used, then names starting
 * with the query, then shorter names (so "Млеко" beats "Овче млеко" and
 * "Milk, dry, nonfat"), then FTS relevance.
 */
import type { FOOD_KINDS, FOOD_SOURCES } from './schema';

export interface FoodSearchRow {
  id: string;
  nameMk: string | null;
  nameEn: string | null;
  kind: (typeof FOOD_KINDS)[number];
  source: (typeof FOOD_SOURCES)[number];
  kcal: number | null;
  /** SQLite boolean: 0 or 1. */
  isEstimate: number;
  /** Epoch ms of the latest (not deleted) log entry for this food, or null. */
  lastUsedAt: number | null;
}

const LAST_USED = `
  SELECT foodId, MAX(createdAt) AS lastUsedAt
  FROM logEntries
  WHERE deletedAt IS NULL
  GROUP BY foodId`;

const COLUMNS = `f.id, f.nameMk, f.nameEn, f.kind, f.source, f.kcal, f.isEstimate, u.lastUsedAt`;

/** Params: [buildSearch().match, recentCutoff(now), buildSearch().startsWith, limit]. */
export const SEARCH_FOODS_SQL = `
WITH usage AS (${LAST_USED})
SELECT ${COLUMNS}
FROM foods_fts
JOIN foods f ON f.id = foods_fts.foodId
LEFT JOIN usage u ON u.foodId = f.id
WHERE foods_fts.searchKey MATCH ?1 AND f.deletedAt IS NULL
ORDER BY
  CASE
    WHEN f.source = 'user' OR u.lastUsedAt >= ?2 THEN 0
    WHEN f.source = 'seed' THEN 1
    ELSE 2
  END,
  u.lastUsedAt DESC NULLS LAST,
  -- searchKey starts with the Macedonian name; English-only foods start with nameEn.
  CASE WHEN f.searchKey LIKE ?3 OR f.nameEn LIKE ?3 THEN 0 ELSE 1 END,
  -- Shorter name first. min() of both names: searchKey is longer for bilingual foods.
  min(coalesce(length(f.nameMk), 1e9), coalesce(length(f.nameEn), 1e9)),
  foods_fts.rank
LIMIT ?4`;

/** Foods shown before the user types anything. Params: [limit]. */
export const RECENT_FOODS_SQL = `
WITH usage AS (${LAST_USED})
SELECT ${COLUMNS}
FROM usage u
JOIN foods f ON f.id = u.foodId
WHERE f.deletedAt IS NULL
ORDER BY u.lastUsedAt DESC
LIMIT ?`;
