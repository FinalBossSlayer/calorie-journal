/**
 * Builds assets/db/app.db: the app's schema (same migrations) filled with
 * USDA foods, Macedonian translations and seed dishes.
 *
 *   npm run seed:download   (once)
 *   npm run seed:build
 */
import { mkdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { computeRecipeNutrition, roundNutrients } from '../../src/lib/recipe';
import { toSearchKey } from '../../src/lib/translit';

import { dishFoodId, dishIngredientId, dishPortionId, usdaFoodId, usdaPortionId } from './lib/ids';
import { applyMigrations } from './lib/migrate';
import { OUTPUT_DB, SEED_DATA_DIR, USDA_DATASETS, USDA_DIR } from './lib/paths';
import { loadUsdaDataset, MEALS_CATEGORY_ID, type UsdaFood } from './lib/usda';

// Fixed so rebuilding with the same inputs gives the same rows.
// Bump when the seed data changes meaningfully.
const SEED_TIMESTAMP = Date.UTC(2026, 8, 25);

interface Translation {
  fdcId: string;
  usdaDescription: string;
  nameMk: string;
  nameEn: string;
  group: string;
  note?: string;
}

interface Dish {
  slug: string;
  nameMk: string;
  nameEn: string;
  cookedWeightG: number | null;
  note?: string;
  ingredients: { fdcId: string; grams: number }[];
  portions: { nameMk: string; nameEn: string; grams: number }[];
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(SEED_DATA_DIR, file), 'utf8')) as T;
}

function loadFoods(): Map<string, UsdaFood> {
  const all = [
    ...loadUsdaDataset(join(USDA_DIR, USDA_DATASETS.foundation.dir), 'foundation_food'),
    ...loadUsdaDataset(join(USDA_DIR, USDA_DATASETS.srLegacy.dir), 'sr_legacy_food'),
  ];
  // Foods without energy are Foundation lab entries (e.g. "0% moisture" beans) — useless in a calorie app.
  return new Map(all.filter((f) => f.per100g.kcal !== null).map((f) => [f.fdcId, f]));
}

function validate(foods: Map<string, UsdaFood>, translations: Translation[], dishes: Dish[]): void {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const t of translations) {
    const food = foods.get(t.fdcId);
    if (!food) errors.push(`translation: unknown fdcId ${t.fdcId} (${t.nameMk})`);
    else if (food.description !== t.usdaDescription) {
      errors.push(`translation ${t.fdcId}: description mismatch\n  file: ${t.usdaDescription}\n  usda: ${food.description}`);
    }
    if (seen.has(t.fdcId)) errors.push(`translation: duplicate fdcId ${t.fdcId}`);
    seen.add(t.fdcId);
  }
  for (const d of dishes) {
    for (const ing of d.ingredients) {
      if (!foods.has(ing.fdcId)) errors.push(`dish ${d.slug}: unknown ingredient fdcId ${ing.fdcId}`);
    }
  }
  if (errors.length) throw new Error(`Seed data is invalid:\n${errors.join('\n')}`);
}

function main() {
  const foods = loadFoods();
  const translations = readJson<Translation[]>('translations.mk.json');
  const { dishes } = readJson<{ dishes: Dish[] }>('dishes.json');
  validate(foods, translations, dishes);
  const translationById = new Map(translations.map((t) => [t.fdcId, t]));

  mkdirSync(dirname(OUTPUT_DB), { recursive: true });
  for (const suffix of ['', '-wal', '-shm', '-journal']) rmSync(OUTPUT_DB + suffix, { force: true });

  const db = new DatabaseSync(OUTPUT_DB);
  db.exec('PRAGMA foreign_keys = ON');
  applyMigrations(db);

  const insertFood = db.prepare(`
    INSERT INTO foods (id, nameMk, nameEn, searchKey, kind, kcal, protein, carbs, fat, fiber, sugar, salt,
      source, sourceRef, basedOnFoodId, isEstimate, cookedWeightG, incompleteNutrients, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?)`);
  const insertPortion = db.prepare(`
    INSERT INTO portions (id, foodId, nameMk, nameEn, grams, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const insertIngredient = db.prepare(`
    INSERT INTO recipeIngredients (id, recipeFoodId, ingredientFoodId, grams, sortOrder, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const t = SEED_TIMESTAMP;

  let portionCount = 0;
  db.exec('BEGIN');
  try {
    for (const food of foods.values()) {
      const tr = translationById.get(food.fdcId);
      const nameMk = tr?.nameMk ?? null;
      const nameEn = tr?.nameEn ?? food.description;
      // Keep the original USDA wording searchable for translated foods too.
      const searchKey = toSearchKey([nameMk, nameEn, tr ? food.description : null].filter(Boolean).join(' '));
      const n = food.per100g;
      const id = usdaFoodId(food.fdcId);
      insertFood.run(
        id, nameMk, nameEn, searchKey, food.categoryId === MEALS_CATEGORY_ID ? 'dish' : 'ingredient',
        n.kcal, n.protein, n.carbs, n.fat, n.fiber, n.sugar, n.salt,
        'usda', food.fdcId, 0, null, null, t, t,
      );
      for (const p of food.portions) {
        insertPortion.run(usdaPortionId(p.id), id, p.nameMk, p.nameEn, p.grams, t, t);
        portionCount++;
      }
    }

    for (const dish of dishes) {
      const result = computeRecipeNutrition(
        dish.ingredients.map((ing) => ({ grams: ing.grams, per100g: foods.get(ing.fdcId)!.per100g })),
        dish.cookedWeightG,
      );
      const n = roundNutrients(result.per100g);
      const id = dishFoodId(dish.slug);
      insertFood.run(
        id, dish.nameMk, dish.nameEn, toSearchKey(`${dish.nameMk} ${dish.nameEn}`), 'dish',
        n.kcal, n.protein, n.carbs, n.fat, n.fiber, n.sugar, n.salt,
        'seed', dish.slug, 1, dish.cookedWeightG,
        result.incompleteNutrients.length ? JSON.stringify(result.incompleteNutrients) : null, t, t,
      );
      dish.ingredients.forEach((ing, i) => {
        insertIngredient.run(dishIngredientId(dish.slug, i), id, usdaFoodId(ing.fdcId), ing.grams, i, t, t);
      });
      dish.portions.forEach((p, i) => {
        insertPortion.run(dishPortionId(dish.slug, i), id, p.nameMk, p.nameEn, p.grams, t, t);
        portionCount++;
      });
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  db.exec('PRAGMA journal_mode = DELETE');
  db.exec('VACUUM');
  db.close();

  const sizeMb = statSync(OUTPUT_DB).size / 1e6;
  console.log(`✓ ${OUTPUT_DB}`);
  console.log(`  ${foods.size} USDA foods (${translations.length} translated), ${dishes.length} dishes, ${portionCount} portions, ${sizeMb.toFixed(1)} MB`);
  console.table(
    Object.fromEntries(
      dishes.map((d) => {
        const r = computeRecipeNutrition(
          d.ingredients.map((ing) => ({ grams: ing.grams, per100g: foods.get(ing.fdcId)!.per100g })),
          d.cookedWeightG,
        );
        const n = roundNutrients(r.per100g);
        return [d.nameMk, { kcal: n.kcal, protein: n.protein, carbs: n.carbs, fat: n.fat, incomplete: r.incompleteNutrients.join(',') }];
      }),
    ),
  );
}

main();
