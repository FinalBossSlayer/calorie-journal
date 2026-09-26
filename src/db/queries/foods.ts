import { and, asc, eq, isNull } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { buildSearch, recentCutoff } from '@/lib/search';

import { getDb } from '../client';
import { foods, portions } from '../schema';
import { type FoodSearchRow, RECENT_FOODS_SQL, SEARCH_FOODS_SQL } from '../search';

export type Food = typeof foods.$inferSelect;
export type Portion = typeof portions.$inferSelect;
export type { FoodSearchRow };

const SEARCH_LIMIT = 50;
const RECENT_LIMIT = 20;

/**
 * Foods matching what the user typed, best first (see src/db/search.ts).
 * Too-short queries return the recently used foods instead.
 */
export async function searchFoods(text: string): Promise<FoodSearchRow[]> {
  const sqlite = getDb().$client;
  const params = buildSearch(text);
  if (!params) return sqlite.getAllAsync<FoodSearchRow>(RECENT_FOODS_SQL, [RECENT_LIMIT]);
  return sqlite.getAllAsync<FoodSearchRow>(SEARCH_FOODS_SQL, [
    params.match,
    recentCutoff(Date.now()),
    params.startsWith,
    SEARCH_LIMIT,
  ]);
}

/**
 * One food with its portions, live. `food` is null while loading or when the
 * food doesn't exist; `loaded` tells the two apart. Deleted foods still load,
 * so old log entries that point at them can be edited.
 */
export function useFood(id: string): { food: Food | null; portions: Portion[]; loaded: boolean } {
  const foodRows = useLiveQuery(getDb().select().from(foods).where(eq(foods.id, id)), [id]);
  const portionRows = useLiveQuery(
    getDb()
      .select()
      .from(portions)
      .where(and(eq(portions.foodId, id), isNull(portions.deletedAt)))
      .orderBy(asc(portions.grams)),
    [id],
  );
  return {
    food: foodRows.data[0] ?? null,
    portions: portionRows.data,
    loaded: foodRows.updatedAt !== undefined && portionRows.updatedAt !== undefined,
  };
}
