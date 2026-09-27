import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import { randomUUID } from 'expo-crypto';

import type { Language } from '@/i18n';
import { type CustomFoodKind, foodSearchKey } from '@/lib/customFood';
import { NUTRIENTS, type NutrientValues } from '@/lib/nutrition';
import { type EditedPortion, type PortionChanges, planPortionChanges } from '@/lib/portions';
import {
  computeRecipeNutrition,
  type EditedIngredient,
  planIngredientChanges,
  roundNutrients,
} from '@/lib/recipe';

import { type AppDatabase, getDb } from '../client';
import { foods, portions, recipeIngredients } from '../schema';

/** Inside db.transaction(). expo-sqlite transactions are synchronous: use .run()/.all(), not await. */
type Tx = Parameters<Parameters<AppDatabase['transaction']>[0]>[0];

export interface CustomFoodFields {
  nameMk: string | null;
  nameEn: string | null;
  kind: CustomFoodKind;
  /** Per 100 g; null = unknown. */
  nutrients: NutrientValues;
  portions: EditedPortion[];
}

/**
 * Creates (id = null) or updates one of the user's own foods, with its portions,
 * in one transaction. Returns the food id. Past log entries keep their snapshot.
 */
export async function saveCustomFood(id: string | null, fields: CustomFoodFields, language: Language): Promise<string> {
  const foodId = id ?? randomUUID();
  const row = {
    nameMk: fields.nameMk,
    nameEn: fields.nameEn,
    searchKey: foodSearchKey(fields.nameMk, fields.nameEn),
    kind: fields.kind,
    ...fields.nutrients,
    incompleteNutrients: null,
  };

  getDb().transaction((tx) => {
    if (id) {
      const updated = tx
        .update(foods)
        .set(row)
        .where(and(eq(foods.id, id), eq(foods.source, 'user')))
        .run();
      if (updated.changes === 0) throw new Error(`Not a user food: ${id}`);
    } else {
      tx.insert(foods).values({ id: foodId, ...row, source: 'user' }).run();
    }
    savePortions(tx, foodId, fields.portions, language);
  });
  return foodId;
}

/** Soft-deletes one of the user's own foods or recipes. Log entries that use it keep working. */
export async function softDeleteUserFood(id: string): Promise<void> {
  await getDb()
    .update(foods)
    .set({ deletedAt: new Date() })
    .where(and(eq(foods.id, id), eq(foods.source, 'user')));
}

type Food = typeof foods.$inferSelect;
type Portion = typeof portions.$inferSelect;

export interface RecipeFields {
  nameMk: string | null;
  nameEn: string | null;
  /** In list order; each with the ingredient food's current per-100g values. */
  ingredients: (EditedIngredient & { per100g: NutrientValues })[];
  cookedWeightG: number | null;
  portions: EditedPortion[];
}

/**
 * Creates (id = null) or updates one of the user's recipes, with its ingredients
 * and portions, in one transaction. Per-100g values are recomputed and stored on
 * the recipe's food row. `basedOnFoodId` is only used when creating. Returns the id.
 */
export async function saveRecipe(
  id: string | null,
  fields: RecipeFields,
  language: Language,
  basedOnFoodId: string | null = null,
): Promise<string> {
  const foodId = id ?? randomUUID();
  if (fields.ingredients.some((ing) => ing.foodId === foodId)) {
    throw new Error('A recipe cannot contain itself');
  }
  const result = computeRecipeNutrition(fields.ingredients, fields.cookedWeightG);
  const row = {
    nameMk: fields.nameMk,
    nameEn: fields.nameEn,
    searchKey: foodSearchKey(fields.nameMk, fields.nameEn),
    kind: 'recipe' as const,
    ...roundNutrients(result.per100g),
    cookedWeightG: fields.cookedWeightG,
    incompleteNutrients: result.incompleteNutrients.length > 0 ? result.incompleteNutrients : null,
    isEstimate: false,
  };

  getDb().transaction((tx) => {
    if (id) {
      const updated = tx
        .update(foods)
        .set(row)
        .where(and(eq(foods.id, id), eq(foods.source, 'user'), eq(foods.kind, 'recipe')))
        .run();
      if (updated.changes === 0) throw new Error(`Not a user recipe: ${id}`);
    } else {
      tx.insert(foods).values({ id: foodId, ...row, source: 'user', basedOnFoodId }).run();
    }

    const stored = tx
      .select({
        id: recipeIngredients.id,
        ingredientFoodId: recipeIngredients.ingredientFoodId,
        grams: recipeIngredients.grams,
        sortOrder: recipeIngredients.sortOrder,
      })
      .from(recipeIngredients)
      .where(and(eq(recipeIngredients.recipeFoodId, foodId), isNull(recipeIngredients.deletedAt)))
      .all();
    const changes = planIngredientChanges(stored, fields.ingredients);
    for (const ing of changes.insert) {
      tx.insert(recipeIngredients).values({ id: randomUUID(), recipeFoodId: foodId, ...ing }).run();
    }
    for (const { id: rowId, ...ing } of changes.update) {
      tx.update(recipeIngredients).set(ing).where(eq(recipeIngredients.id, rowId)).run();
    }
    if (changes.remove.length > 0) {
      tx.update(recipeIngredients)
        .set({ deletedAt: new Date() })
        .where(inArray(recipeIngredients.id, changes.remove))
        .run();
    }

    savePortions(tx, foodId, fields.portions, language);
  });
  return foodId;
}

export interface LoadedIngredient {
  rowId: string;
  foodId: string;
  nameMk: string | null;
  nameEn: string | null;
  /** The ingredient food's current values (not a snapshot). */
  per100g: NutrientValues;
  grams: number;
}

export interface LoadedRecipe {
  food: Food;
  ingredients: LoadedIngredient[];
  portions: Portion[];
}

/**
 * A recipe (user recipe or seed dish) with its ingredients and portions, read
 * once to fill the builder. null if there is no such food.
 */
export async function loadRecipe(id: string): Promise<LoadedRecipe | null> {
  const db = getDb();
  const [food] = await db.select().from(foods).where(eq(foods.id, id));
  if (!food) return null;

  const rows = await db
    .select({ rowId: recipeIngredients.id, grams: recipeIngredients.grams, ingredient: foods })
    .from(recipeIngredients)
    .innerJoin(foods, eq(foods.id, recipeIngredients.ingredientFoodId))
    .where(and(eq(recipeIngredients.recipeFoodId, id), isNull(recipeIngredients.deletedAt)))
    .orderBy(asc(recipeIngredients.sortOrder));

  const portionRows = await db
    .select()
    .from(portions)
    .where(and(eq(portions.foodId, id), isNull(portions.deletedAt)))
    .orderBy(asc(portions.grams));

  return {
    food,
    ingredients: rows.map(({ rowId, grams, ingredient }) => ({
      rowId,
      foodId: ingredient.id,
      nameMk: ingredient.nameMk,
      nameEn: ingredient.nameEn,
      per100g: nutrientsOf(ingredient),
      grams,
    })),
    portions: portionRows,
  };
}

/** Just the 7 per-100g values of a food row. */
export function nutrientsOf(food: NutrientValues): NutrientValues {
  return Object.fromEntries(NUTRIENTS.map((n) => [n, food[n]])) as NutrientValues;
}

/** Brings a food's portions in line with the edited list: insert, update, soft-delete. */
export function savePortions(tx: Tx, foodId: string, edited: readonly EditedPortion[], language: Language): void {
  const stored = tx
    .select()
    .from(portions)
    .where(and(eq(portions.foodId, foodId), isNull(portions.deletedAt)))
    .all();
  applyPortionChanges(tx, foodId, planPortionChanges(stored, edited, language));
}

function applyPortionChanges(tx: Tx, foodId: string, changes: PortionChanges): void {
  for (const p of changes.insert) {
    tx.insert(portions).values({ id: randomUUID(), foodId, ...p }).run();
  }
  for (const { id, ...p } of changes.update) {
    tx.update(portions).set(p).where(eq(portions.id, id)).run();
  }
  if (changes.remove.length > 0) {
    tx.update(portions).set({ deletedAt: new Date() }).where(inArray(portions.id, changes.remove)).run();
  }
}
