import { and, asc, eq, getTableColumns, isNull } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { randomUUID } from 'expo-crypto';

import { rescaleSnapshot } from '@/lib/logging';
import { scaleNutrients } from '@/lib/nutrition';

import { getDb } from '../client';
import { foods, logEntries, meals } from '../schema';

export type Meal = typeof meals.$inferSelect;
export type LogEntry = typeof logEntries.$inferSelect;
type Food = typeof foods.$inferSelect;

/** How much was eaten and where it goes. portionId/quantity are null when typed in grams. */
export interface EntryAmount {
  mealId: string;
  grams: number;
  portionId: string | null;
  quantity: number | null;
}

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
  const mealRows = useMeals();
  return {
    entries: entries.data,
    meals: mealRows.meals,
    loaded: entries.updatedAt !== undefined && mealRows.loaded,
  };
}

/** All meals in order, including hidden ones, live. */
export function useMeals(): { meals: Meal[]; loaded: boolean } {
  const { data, updatedAt } = useLiveQuery(
    getDb().select().from(meals).where(isNull(meals.deletedAt)).orderBy(asc(meals.sortOrder)),
  );
  return { meals: data, loaded: updatedAt !== undefined };
}

/** One entry for editing, live. null while loading, or if it doesn't exist or was deleted. */
export function useEntry(id: string): { entry: LogEntry | null; loaded: boolean } {
  const { data, updatedAt } = useLiveQuery(
    getDb()
      .select()
      .from(logEntries)
      .where(and(eq(logEntries.id, id), isNull(logEntries.deletedAt))),
    [id],
  );
  return { entry: data[0] ?? null, loaded: updatedAt !== undefined };
}

/** Logs a food, snapshotting its nutrients for this amount. */
export async function addEntry(date: string, food: Food, amount: EntryAmount): Promise<void> {
  await getDb()
    .insert(logEntries)
    .values({
      id: randomUUID(),
      date,
      foodId: food.id,
      ...amount,
      ...scaleNutrients(food, amount.grams),
      incompleteNutrients: food.incompleteNutrients,
    });
}

/**
 * Changes an entry's amount or meal. The snapshot is re-scaled from itself,
 * never re-read from the food: food edits must not change past entries.
 */
export async function updateEntry(entry: LogEntry, amount: EntryAmount): Promise<void> {
  await getDb()
    .update(logEntries)
    .set({ ...amount, ...rescaleSnapshot(entry, entry.grams, amount.grams) })
    .where(eq(logEntries.id, entry.id));
}

/** Soft delete: the row stays for future sync. */
export async function softDeleteEntry(id: string): Promise<void> {
  await getDb().update(logEntries).set({ deletedAt: new Date() }).where(eq(logEntries.id, id));
}
