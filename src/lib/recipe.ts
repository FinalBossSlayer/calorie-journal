import { NUTRIENTS, emptyNutrients, type Nutrient, type NutrientValues } from './nutrition';

export interface RecipeIngredientInput {
  grams: number;
  /** The ingredient food's per-100g values. */
  per100g: NutrientValues;
}

export interface RecipeNutrition {
  /** Nutrients for the whole pot. */
  totals: NutrientValues;
  /** Values to store on the recipe's food row. */
  per100g: NutrientValues;
  /** Sum of raw ingredient weights. */
  rawWeightG: number;
  /** Weight used as the divisor: cookedWeightG if given, otherwise rawWeightG. */
  finalWeightG: number;
  /**
   * Nutrients where some (but not all) ingredients are unknown, so the value
   * is a lower bound. If every ingredient is unknown the value is null instead.
   */
  incompleteNutrients: Nutrient[];
}

function assertValidWeight(value: number, label: string, allowZero: boolean): void {
  if (!Number.isFinite(value) || value < 0 || (!allowZero && value === 0)) {
    throw new RangeError(`${label} must be a ${allowZero ? 'non-negative' : 'positive'} number, got ${value}`);
  }
}

export function computeRecipeNutrition(
  ingredients: readonly RecipeIngredientInput[],
  cookedWeightG?: number | null,
): RecipeNutrition {
  if (ingredients.length === 0) {
    throw new RangeError('A recipe needs at least one ingredient');
  }
  ingredients.forEach((ing, i) => assertValidWeight(ing.grams, `ingredients[${i}].grams`, true));

  const rawWeightG = ingredients.reduce((sum, ing) => sum + ing.grams, 0);
  if (rawWeightG === 0) {
    throw new RangeError('Total ingredient weight must be greater than 0');
  }

  const hasCookedWeight = cookedWeightG !== null && cookedWeightG !== undefined;
  if (hasCookedWeight) {
    assertValidWeight(cookedWeightG, 'cookedWeightG', false);
  }
  const finalWeightG = hasCookedWeight ? cookedWeightG : rawWeightG;

  const totals = emptyNutrients();
  const per100g = emptyNutrients();
  const incompleteNutrients: Nutrient[] = [];

  for (const nutrient of NUTRIENTS) {
    let sum = 0;
    let known = 0;
    for (const ing of ingredients) {
      const value = ing.per100g[nutrient];
      if (value === null) continue;
      sum += (value * ing.grams) / 100;
      known++;
    }

    if (known === 0) continue; // stays null: fully unknown
    if (known < ingredients.length) incompleteNutrients.push(nutrient);

    totals[nutrient] = sum;
    per100g[nutrient] = (sum / finalWeightG) * 100;
  }

  return { totals, per100g, rawWeightG, finalWeightG, incompleteNutrients };
}
