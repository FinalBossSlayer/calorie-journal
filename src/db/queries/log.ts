import { and, asc, eq, getTableColumns, inArray, isNull } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { randomUUID } from 'expo-crypto';

import { scaleNutrients } from '@/lib/nutrition';

import { getDb } from '../client';
import { DEFAULT_MEAL_IDS } from '../defaults';
import { foods, logEntries, meals, portions } from '../schema';

export type Meal = typeof meals.$inferSelect;

function dayEntriesQuery(date: string) {
  return getDb()
    .select({ ...getTableColumns(logEntries), foodNameMk: foods.nameMk, foodNameEn: foods.nameEn })
    .from(logEntries)
    .innerJoin(foods, eq(foods.id, logEntries.foodId))
    .where(and(eq(logEntries.date, date), isNull(logEntries.deletedAt)))
    .orderBy(asc(logEntries.createdAt));
}

export type DayEntry = Awaited<ReturnType<typeof dayEntriesQuery>>[number];

/**
 * One day's entries (with food names) and all meals, live. Meals include hidden
 * ones: groupByMeal decides which to show. `loaded` is false until both reads finish.
 */
export function useDayLog(date: string): { entries: DayEntry[]; meals: Meal[]; loaded: boolean } {
  const entries = useLiveQuery(dayEntriesQuery(date), [date]);
  const mealRows = useLiveQuery(
    getDb().select().from(meals).where(isNull(meals.deletedAt)).orderBy(asc(meals.sortOrder)),
  );
  return {
    entries: entries.data,
    meals: mealRows.data,
    loaded: entries.updatedAt !== undefined && mealRows.updatedAt !== undefined,
  };
}

// --- Dev tools (until food logging exists) --------------------------------

/** Seed dishes (by English name) plus a USDA food with unknown fiber to show incomplete totals. */
const SAMPLE_DAY = [
  { meal: DEFAULT_MEAL_IDS.breakfast, food: 'Burek with cheese', portion: '1 piece' },
  { meal: DEFAULT_MEAL_IDS.lunch, food: 'Tavče gravče (baked beans)', portion: '1 plate' },
  { meal: DEFAULT_MEAL_IDS.lunch, food: 'Shopska salad', portion: '1 plate' },
  { meal: DEFAULT_MEAL_IDS.dinner, food: 'Sarma (stuffed cabbage rolls)', portion: '1 plate (4 rolls)' },
  { meal: DEFAULT_MEAL_IDS.snacks, food: 'Quince', grams: 150 },
] as const;

/** DEV ONLY: logs a realistic day of seed foods on `date`, as if entered by hand. */
export async function addSampleDay(date: string): Promise<void> {
  const db = getDb();
  const names = SAMPLE_DAY.map((s) => s.food);
  const foodRows = await db
    .select()
    .from(foods)
    .where(and(inArray(foods.nameEn, names), isNull(foods.deletedAt)));
  const portionRows = await db
    .select()
    .from(portions)
    .where(inArray(portions.foodId, foodRows.map((f) => f.id)));

  for (const item of SAMPLE_DAY) {
    const food = foodRows.find((f) => f.nameEn === item.food);
    if (!food) continue; // seed data changed; skip rather than fail a dev tool
    const portion = 'portion' in item ? portionRows.find((p) => p.foodId === food.id && p.nameEn === item.portion) : undefined;
    const grams = portion?.grams ?? ('grams' in item ? item.grams : 100);
    await db.insert(logEntries).values({
      id: randomUUID(),
      date,
      mealId: item.meal,
      foodId: food.id,
      grams,
      portionId: portion?.id ?? null,
      quantity: portion ? 1 : null,
      ...scaleNutrients(food, grams),
      incompleteNutrients: food.incompleteNutrients,
    });
  }
}

/** DEV ONLY: soft-deletes every entry on `date`. */
export async function clearDay(date: string): Promise<void> {
  await getDb()
    .update(logEntries)
    .set({ deletedAt: new Date() })
    .where(and(eq(logEntries.date, date), isNull(logEntries.deletedAt)));
}
