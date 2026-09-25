/**
 * USDA FoodData Central (CSV) → app foods and portions.
 * Pure transforms are exported separately so they can be unit-tested.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { parse } from 'csv-parse/sync';

import { emptyNutrients, type Nutrient, type NutrientValues } from '../../../src/lib/nutrition';

export type UsdaDataType = 'foundation_food' | 'sr_legacy_food';

export interface UsdaPortion {
  id: string; // food_portion.id
  nameEn: string;
  nameMk: string | null;
  grams: number;
}

export interface UsdaFood {
  fdcId: string;
  dataType: UsdaDataType;
  description: string;
  categoryId: number;
  per100g: NutrientValues;
  portions: UsdaPortion[];
}

// Food categories left out of the app (IDs are shared by both datasets).
export const EXCLUDED_CATEGORY_IDS = new Set([
  3, // Baby Foods
  21, // Fast Foods
  24, // American Indian/Alaska Native Foods
  25, // Restaurant Foods
  26, // Branded Food Products Database
  27, // Quality Control Materials
]);

export const MEALS_CATEGORY_ID = 22; // Meals, Entrees, and Side Dishes

// USDA nutrient IDs in order of preference. Foundation Foods often only has
// the Atwater energy values, carbs "by summation", or the NLEA fat/sugar IDs.
const NUTRIENT_SOURCES: Record<Exclude<Nutrient, 'salt'>, number[]> = {
  kcal: [1008, 2048, 2047],
  protein: [1003],
  carbs: [1005, 1050],
  fat: [1004, 1085],
  fiber: [1079],
  sugar: [2000, 1063],
};
const SODIUM_MG = 1093;

export const WANTED_NUTRIENT_IDS = new Set([...Object.values(NUTRIENT_SOURCES).flat(), SODIUM_MG]);

function round(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

/** Picks the 7 app nutrients (per 100 g) from USDA nutrient_id → amount. */
export function pickNutrients(amounts: ReadonlyMap<number, number>): NutrientValues {
  const result = emptyNutrients();
  for (const [nutrient, ids] of Object.entries(NUTRIENT_SOURCES) as [Nutrient, number[]][]) {
    const id = ids.find((candidate) => amounts.has(candidate));
    if (id !== undefined) result[nutrient] = round(amounts.get(id)!, nutrient === 'kcal' ? 1 : 2);
  }
  const sodiumMg = amounts.get(SODIUM_MG);
  if (sodiumMg !== undefined) result.salt = round((sodiumMg / 1000) * 2.5, 3);
  return result;
}

// Portions in imperial weight/volume units are noise for Macedonian users,
// who weigh in grams. Units that describe a thing (cup, slice, piece) stay.
const SKIPPED_PORTION_PREFIXES = ['oz', 'lb', 'fl oz', 'cubic inch', 'quart', 'gallon', 'pint'];

// Macedonian names for portions that are exactly "1 <unit>".
const PORTION_UNITS_MK: Record<string, string> = {
  cup: 'шолја',
  tbsp: 'лажица',
  tablespoon: 'лажица',
  tsp: 'лажиче',
  teaspoon: 'лажиче',
  slice: 'парче',
  piece: 'парче',
  medium: 'средно',
  large: 'големо',
  small: 'мало',
  serving: 'порција',
  'nlea serving': 'порција',
  fillet: 'филе',
  egg: 'јајце',
  clove: 'чешне',
  leaf: 'лист',
};

export interface RawPortion {
  amount: string;
  unitName: string | null; // measure_unit.name, null/undetermined for SR Legacy
  modifier: string;
  portionDescription: string;
  gramWeight: string;
}

function formatAmount(raw: string): string {
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? String(round(n, 2)) : '1';
}

/** Builds a readable portion name, or null if the portion should be skipped. */
export function formatPortion(raw: RawPortion): Omit<UsdaPortion, 'id'> | null {
  const grams = Number.parseFloat(raw.gramWeight);
  if (!Number.isFinite(grams) || grams <= 0) return null;

  const unit = raw.unitName && raw.unitName !== 'undetermined' ? raw.unitName.trim() : '';
  const modifier = raw.modifier.trim();
  const label = [unit, modifier].filter(Boolean).join(', ') || raw.portionDescription.trim();
  if (!label) return null;

  const clean = label.replace(/\s+/g, ' ').trim();
  const lower = clean.toLowerCase();
  if (SKIPPED_PORTION_PREFIXES.some((p) => lower === p || lower.startsWith(`${p} `) || lower.startsWith(`${p},`))) {
    return null;
  }

  const amount = formatAmount(raw.amount);
  const mkUnit = amount === '1' ? PORTION_UNITS_MK[lower] : undefined;
  return {
    nameEn: `${amount} ${clean}`,
    nameMk: mkUnit ? `1 ${mkUnit}` : null,
    grams: round(grams, 1),
  };
}

type Row = Record<string, string>;

function readCsv(path: string): Row[] {
  return parse(readFileSync(path), { columns: true, skip_empty_lines: true }) as Row[];
}

/** Loads one dataset folder (as unzipped by download.ts). */
export function loadUsdaDataset(dir: string, dataType: UsdaDataType): UsdaFood[] {
  const foods = new Map<string, UsdaFood>();
  for (const row of readCsv(join(dir, 'food.csv'))) {
    const categoryId = Number(row.food_category_id);
    if (row.data_type !== dataType || EXCLUDED_CATEGORY_IDS.has(categoryId)) continue;
    foods.set(row.fdc_id, {
      fdcId: row.fdc_id,
      dataType,
      description: row.description.trim(),
      categoryId,
      per100g: emptyNutrients(),
      portions: [],
    });
  }

  const amounts = new Map<string, Map<number, number>>();
  for (const row of readCsv(join(dir, 'food_nutrient.csv'))) {
    const nutrientId = Number(row.nutrient_id);
    if (!foods.has(row.fdc_id) || !WANTED_NUTRIENT_IDS.has(nutrientId) || row.amount === '') continue;
    const amount = Number(row.amount);
    if (!Number.isFinite(amount) || amount < 0) continue;
    let map = amounts.get(row.fdc_id);
    if (!map) amounts.set(row.fdc_id, (map = new Map()));
    map.set(nutrientId, amount);
  }
  for (const [fdcId, map] of amounts) foods.get(fdcId)!.per100g = pickNutrients(map);

  const units = new Map(readCsv(join(dir, 'measure_unit.csv')).map((r) => [r.id, r.name]));
  for (const row of readCsv(join(dir, 'food_portion.csv'))) {
    const food = foods.get(row.fdc_id);
    if (!food) continue;
    const portion = formatPortion({
      amount: row.amount,
      unitName: units.get(row.measure_unit_id) ?? null,
      modifier: row.modifier,
      portionDescription: row.portion_description,
      gramWeight: row.gram_weight,
    });
    if (portion && !food.portions.some((p) => p.nameEn === portion.nameEn)) {
      food.portions.push({ id: row.id, ...portion });
    }
  }

  return [...foods.values()];
}
