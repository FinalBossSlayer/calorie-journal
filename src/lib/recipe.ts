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

/** Upper bounds, to catch typos like "50000" for one ingredient. */
export const MAX_INGREDIENT_GRAMS = 10_000;
export const MAX_COOKED_WEIGHT_G = 50_000;

/** Rounding for stored per-100g values (seed dishes and user recipes): kcal to 0.1, grams to 0.001. */
export function roundNutrients(values: NutrientValues): NutrientValues {
  const out = { ...values };
  for (const n of NUTRIENTS) {
    const v = out[n];
    const factor = n === 'kcal' ? 10 : 1000;
    if (v !== null) out[n] = Math.round(v * factor) / factor;
  }
  return out;
}

export interface PreviewIngredient {
  /** null while the typed amount isn't a valid number. */
  grams: number | null;
  per100g: NutrientValues;
}

/**
 * Live result while the recipe is being edited. Rows with an invalid amount are
 * left out, and an invalid cooked weight falls back to the raw weight, so the
 * preview keeps working mid-typing. null when there is nothing to compute yet.
 */
export function recipePreview(
  ingredients: readonly PreviewIngredient[],
  cookedWeightG: number | null,
): RecipeNutrition | null {
  const valid = ingredients.flatMap((ing) =>
    ing.grams !== null && Number.isFinite(ing.grams) && ing.grams > 0 && ing.grams <= MAX_INGREDIENT_GRAMS
      ? [{ grams: ing.grams, per100g: ing.per100g }]
      : [],
  );
  if (valid.length === 0) return null;
  const cooked =
    cookedWeightG !== null && cookedWeightG > 0 && cookedWeightG <= MAX_COOKED_WEIGHT_G ? cookedWeightG : null;
  return computeRecipeNutrition(valid, cooked);
}

export interface StoredIngredient {
  id: string;
  ingredientFoodId: string;
  grams: number;
  sortOrder: number;
}

export interface EditedIngredient {
  /** recipeIngredients.id, or null for a row added in this edit. */
  rowId: string | null;
  foodId: string;
  grams: number;
}

export interface IngredientChanges {
  insert: { ingredientFoodId: string; grams: number; sortOrder: number }[];
  /** Only rows that actually changed. */
  update: { id: string; ingredientFoodId: string; grams: number; sortOrder: number }[];
  /** Ids to soft-delete. */
  remove: string[];
}

/** Database changes that save an edited ingredient list. The list order becomes sortOrder. */
export function planIngredientChanges(
  stored: readonly StoredIngredient[],
  edited: readonly EditedIngredient[],
): IngredientChanges {
  const byId = new Map(stored.map((s) => [s.id, s]));
  const kept = new Set<string>();
  const changes: IngredientChanges = { insert: [], update: [], remove: [] };

  edited.forEach((e, sortOrder) => {
    const original = e.rowId ? byId.get(e.rowId) : undefined;
    const row = { ingredientFoodId: e.foodId, grams: e.grams, sortOrder };
    if (!original) {
      changes.insert.push(row);
      return;
    }
    kept.add(original.id);
    if (
      original.ingredientFoodId !== row.ingredientFoodId ||
      original.grams !== row.grams ||
      original.sortOrder !== row.sortOrder
    ) {
      changes.update.push({ id: original.id, ...row });
    }
  });

  for (const s of stored) {
    if (!kept.has(s.id)) changes.remove.push(s.id);
  }
  return changes;
}
