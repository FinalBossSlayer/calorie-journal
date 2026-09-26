/**
 * Math for logging a food: amount → grams, re-scaling a saved snapshot, and
 * which meal to preselect. UI-free so it can be unit tested.
 */
import type { MealInfo } from './day';
import { NUTRIENTS, type NutrientValues } from './nutrition';

/** Upper bound for one entry, to catch typos like "15000". */
export const MAX_ENTRY_GRAMS = 5000;

/**
 * Grams for an amount typed by the user: a quantity of a portion
 * ("1.5 × 1 парче бурек") or plain grams when there is no portion.
 */
export function entryGrams(amount: number, portionGrams: number | null): number {
  return portionGrams === null ? amount : amount * portionGrams;
}

export interface ResolvedAmount {
  grams: number;
  portionId: string | null;
  /** How many portions; null when the amount was typed in grams. */
  quantity: number | null;
}

/**
 * The amount to save, from what the user typed (already parsed) and the chosen
 * portion (null = grams). null when it isn't a sensible amount to log.
 */
export function resolveAmount(
  amount: number | null,
  portion: { id: string; grams: number } | null,
): ResolvedAmount | null {
  if (amount === null || !Number.isFinite(amount) || amount <= 0) return null;
  const grams = entryGrams(amount, portion?.grams ?? null);
  if (grams > MAX_ENTRY_GRAMS) return null;
  return portion ? { grams, portionId: portion.id, quantity: amount } : { grams, portionId: null, quantity: null };
}

/**
 * An existing entry's snapshot for a new amount. Scales the snapshot itself
 * instead of recomputing from the food, so later food/recipe edits never leak
 * into past entries. Unknown stays unknown.
 */
export function rescaleSnapshot(snapshot: NutrientValues, oldGrams: number, newGrams: number): NutrientValues {
  const out = {} as NutrientValues;
  for (const n of NUTRIENTS) {
    const v = snapshot[n];
    out[n] = v === null ? null : (v * newGrams) / oldGrams;
  }
  return out;
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

/** Typical Macedonian meal times: late lunch, late dinner. */
export function mealSlotForHour(hour: number): MealSlot {
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 12 && hour < 17) return 'lunch';
  if (hour >= 19 && hour < 23) return 'dinner';
  return 'snacks';
}

/**
 * Meal to preselect when adding food: the default meal for the time of day
 * (by its id in `slotIds`) if it's visible, else the first visible meal.
 */
export function defaultMealId<M extends MealInfo>(
  meals: readonly M[],
  hour: number,
  slotIds: Record<MealSlot, string>,
): string | null {
  const visible = meals.filter((m) => !m.isHidden).sort((a, b) => a.sortOrder - b.sortOrder);
  const preferred = slotIds[mealSlotForHour(hour)];
  return visible.find((m) => m.id === preferred)?.id ?? visible[0]?.id ?? null;
}
