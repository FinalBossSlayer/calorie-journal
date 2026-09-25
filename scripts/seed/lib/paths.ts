import { join } from 'node:path';

export const ROOT = join(__dirname, '..', '..', '..');
export const SEED_DATA_DIR = join(ROOT, 'scripts', 'seed', 'data');
export const USDA_DIR = join(SEED_DATA_DIR, 'usda');
export const MIGRATIONS_DIR = join(ROOT, 'src', 'db', 'migrations');
export const OUTPUT_DB = join(ROOT, 'assets', 'db', 'app.db');

export const USDA_DATASETS = {
  foundation: { zip: 'FoodData_Central_foundation_food_csv_2026-04-30.zip', dir: 'foundation' },
  srLegacy: { zip: 'FoodData_Central_sr_legacy_food_csv_2018-04.zip', dir: 'sr_legacy' },
} as const;
