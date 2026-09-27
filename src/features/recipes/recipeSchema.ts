import { z } from 'zod';

import { parseNames, parsePortions, type PortionInput, portionsInput } from '@/features/foods/customFoodSchema';
import { type NutrientValues, NUTRIENTS, type Nutrient } from '@/lib/nutrition';
import { parseDecimal } from '@/lib/numbers';
import { MAX_COOKED_WEIGHT_G, MAX_INGREDIENT_GRAMS } from '@/lib/recipe';

/** One row of the ingredient list. */
export type IngredientInput = {
  /** recipeIngredients.id, or null for a row added in this edit. */
  rowId: string | null;
  foodId: string;
  nameMk: string | null;
  nameEn: string | null;
  /** The ingredient food's current values, for the live preview and the saved result. */
  per100g: NutrientValues;
  /** Text as typed. */
  grams: string;
};

/** What the form holds while editing. */
export type RecipeInput = {
  nameMk: string;
  nameEn: string;
  ingredients: IngredientInput[];
  /** Weight of the whole pot after cooking; empty = use the raw weight. */
  cookedWeight: string;
  portions: PortionInput[];
};

/** Amount typed for an ingredient, or null if it isn't a valid one. */
export function ingredientGrams(text: string): number | null {
  const g = parseDecimal(text);
  return g !== null && g > 0 && g <= MAX_INGREDIENT_GRAMS ? g : null;
}

/** The cooked weight typed, or null when empty or invalid. */
export function cookedWeightG(text: string): number | null {
  const g = parseDecimal(text);
  return g !== null && g > 0 && g <= MAX_COOKED_WEIGHT_G ? g : null;
}

const per100gSchema = z.object(
  Object.fromEntries(NUTRIENTS.map((n) => [n, z.number().nullable()])) as Record<
    Nutrient,
    z.ZodNullable<z.ZodNumber>
  >,
);

/** Error messages are keys: 'required' and 'range'. Each field shows its own translated message. */
export const recipeSchema = z
  .object({
    nameMk: z.string(),
    nameEn: z.string(),
    ingredients: z.array(
      z.object({
        rowId: z.string().nullable(),
        foodId: z.string(),
        nameMk: z.string().nullable(),
        nameEn: z.string().nullable(),
        per100g: per100gSchema,
        grams: z.string(),
      }),
    ),
    cookedWeight: z.string(),
    portions: portionsInput,
  })
  .transform((input, ctx) => {
    const { nameMk, nameEn } = parseNames(input, ctx);

    if (input.ingredients.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['ingredients'], message: 'required' });
    }
    const ingredients = input.ingredients.flatMap((ing, i) => {
      const grams = ingredientGrams(ing.grams);
      if (grams === null) {
        ctx.addIssue({ code: 'custom', path: ['ingredients', i, 'grams'], message: 'range' });
        return [];
      }
      return [{ rowId: ing.rowId, foodId: ing.foodId, grams, per100g: ing.per100g }];
    });

    let cooked: number | null = null;
    if (input.cookedWeight.trim() !== '') {
      cooked = cookedWeightG(input.cookedWeight);
      if (cooked === null) ctx.addIssue({ code: 'custom', path: ['cookedWeight'], message: 'range' });
    }

    const portions = parsePortions(input.portions, ctx);
    return { nameMk, nameEn, ingredients, cookedWeightG: cooked, portions };
  });

/** Validated values, ready to save. */
export type RecipeValues = z.output<typeof recipeSchema>;
