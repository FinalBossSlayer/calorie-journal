/**
 * Meal management: order, visibility and names. UI-free so it can be unit tested.
 */
import type { MealInfo } from './day';

export interface SortOrderChange {
  id: string;
  sortOrder: number;
}

function sorted<M extends MealInfo>(meals: readonly M[]): M[] {
  return [...meals].sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Moves a meal one place up (-1) or down (+1) among all meals, hidden ones
 * included. Returns only the meals whose sortOrder changes; the whole list is
 * renumbered 0..n-1 so gaps or duplicate orders from older data get fixed.
 */
export function moveMeal(meals: readonly MealInfo[], id: string, direction: -1 | 1): SortOrderChange[] {
  const list = sorted(meals);
  const from = list.findIndex((m) => m.id === id);
  const to = from + direction;
  if (from === -1 || to < 0 || to >= list.length) return [];

  [list[from], list[to]] = [list[to], list[from]];
  return list.flatMap((m, i) => (m.sortOrder === i ? [] : [{ id: m.id, sortOrder: i }]));
}

/** Hiding the last visible meal would leave nowhere to log food. */
export function canHide(meals: readonly MealInfo[], id: string): boolean {
  return meals.some((m) => m.id !== id && !m.isHidden);
}

/** sortOrder for a new meal: after all others. */
export function nextSortOrder(meals: readonly MealInfo[]): number {
  return meals.reduce((max, m) => Math.max(max, m.sortOrder + 1), 0);
}

/**
 * Meals always have both names (the columns are required). One is enough in
 * the form; the empty one takes the other's name.
 */
export function fillMealNames(names: { nameMk: string | null; nameEn: string | null }): {
  nameMk: string;
  nameEn: string;
} {
  const fallback = names.nameMk ?? names.nameEn ?? '';
  return { nameMk: names.nameMk ?? fallback, nameEn: names.nameEn ?? fallback };
}

/**
 * Whether a meal can be deleted.
 * - lastVisible: it's the only visible meal (same rule as hiding)
 * - hasEntries: food is logged in it; deleting would hide those entries from their days, so hide it instead
 */
export type DeleteCheck = 'ok' | 'lastVisible' | 'hasEntries';

export function checkDelete(meals: readonly MealInfo[], id: string, entryCount: number): DeleteCheck {
  const meal = meals.find((m) => m.id === id);
  if (meal && !meal.isHidden && !canHide(meals, id)) return 'lastVisible';
  return entryCount > 0 ? 'hasEntries' : 'ok';
}
