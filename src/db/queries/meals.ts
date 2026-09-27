import { and, count, eq, isNull } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';

import type { SortOrderChange } from '@/lib/meals';

import { getDb } from '../client';
import { logEntries, meals } from '../schema';

/** Meals are read with useMeals() in ./log. */

export interface MealNames {
  nameMk: string;
  nameEn: string;
}

export async function addMeal(names: MealNames, sortOrder: number): Promise<void> {
  await getDb()
    .insert(meals)
    .values({ id: randomUUID(), ...names, sortOrder });
}

export async function renameMeal(id: string, names: MealNames): Promise<void> {
  await getDb().update(meals).set(names).where(eq(meals.id, id));
}

/** Hidden meals leave the Today screen and the meal picker; days that used them still show them. */
export async function setMealHidden(id: string, isHidden: boolean): Promise<void> {
  await getDb().update(meals).set({ isHidden }).where(eq(meals.id, id));
}

/** How many (not deleted) log entries use this meal: meals with food in them can't be deleted. */
export async function countMealEntries(id: string): Promise<number> {
  const [row] = await getDb()
    .select({ n: count() })
    .from(logEntries)
    .where(and(eq(logEntries.mealId, id), isNull(logEntries.deletedAt)));
  return row?.n ?? 0;
}

/** Soft delete: the row stays for future sync. Only for meals without entries (see checkDelete). */
export async function softDeleteMeal(id: string): Promise<void> {
  await getDb().update(meals).set({ deletedAt: new Date() }).where(eq(meals.id, id));
}

/** Applies moveMeal()'s changes together, so the order is never half updated. */
export function reorderMeals(changes: readonly SortOrderChange[]): void {
  if (changes.length === 0) return;
  // expo-sqlite transactions are synchronous: .run(), not await.
  getDb().transaction((tx) => {
    for (const c of changes) {
      tx.update(meals).set({ sortOrder: c.sortOrder }).where(eq(meals.id, c.id)).run();
    }
  });
}
