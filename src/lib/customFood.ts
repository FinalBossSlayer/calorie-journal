/**
 * Rules for foods the user types in from a label (values per 100 g).
 * UI-free so it can be unit tested; the form schema builds on these.
 */
import { toSearchKey } from './translit';
import type { Nutrient, NutrientValues } from './nutrition';

/** Kinds the user can pick for a custom food. Recipes have their own builder. */
export const CUSTOM_FOOD_KINDS = ['product', 'ingredient', 'dish'] as const;
export type CustomFoodKind = (typeof CUSTOM_FOOD_KINDS)[number];

export const MAX_NAME_LENGTH = 80;

/** Highest sensible value per 100 g. Pure fat is ~900 kcal; nothing weighs more than 100 g per 100 g. */
export const NUTRIENT_MAX_PER_100G: Record<Nutrient, number> = {
  kcal: 900,
  protein: 100,
  carbs: 100,
  fat: 100,
  fiber: 100,
  sugar: 100,
  salt: 100,
};

/** Labels round each value, so allow a little over 100 g in total. */
const MACRO_SUM_TOLERANCE_G = 1;

export type NutrientProblem = 'macroSum' | 'sugarOverCarbs';

/**
 * Checks that the values could be real, across nutrients. Unknown (null)
 * values are skipped. Fiber is left out of the sum: US labels count it inside carbs.
 */
export function nutrientProblems(v: NutrientValues): NutrientProblem[] {
  const problems: NutrientProblem[] = [];
  const macroSum = (v.protein ?? 0) + (v.carbs ?? 0) + (v.fat ?? 0);
  if (macroSum > 100 + MACRO_SUM_TOLERANCE_G) problems.push('macroSum');
  if (v.sugar !== null && v.carbs !== null && v.sugar > v.carbs) problems.push('sugarOverCarbs');
  return problems;
}

/** Trimmed name, or null when empty (the database stores missing names as null). */
export function cleanName(name: string): string | null {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  return trimmed === '' ? null : trimmed;
}

/** Search key for a food's names (same format as the seed data: Macedonian first). */
export function foodSearchKey(nameMk: string | null, nameEn: string | null): string {
  return toSearchKey([nameMk, nameEn].filter(Boolean).join(' '));
}
