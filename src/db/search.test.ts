/// <reference types="node" />
/** Runs the real search SQL against the real migrations (Node SQLite). */
import type { DatabaseSync } from 'node:sqlite';

import { buildSearch, recentCutoff } from '@/lib/search';
import { toSearchKey } from '@/lib/translit';

import { DEFAULT_MEAL_IDS } from './defaults';
import { type FoodSearchRow, RECENT_FOODS_SQL, SEARCH_FOODS_SQL } from './search';
import { migratedDb } from './testing';

const NOW = Date.UTC(2026, 8, 26, 12);
const DAY = 24 * 60 * 60 * 1000;

function insertFood(db: DatabaseSync, id: string, nameEn: string, source: 'usda' | 'seed' | 'user') {
  db.prepare(
    `INSERT INTO foods (id, nameEn, searchKey, kind, source, sourceRef, createdAt, updatedAt)
     VALUES (?, ?, ?, 'ingredient', ?, ?, 0, 0)`,
  ).run(id, nameEn, toSearchKey(nameEn), source, source === 'usda' ? id : null);
}

let entryId = 0;
function logFood(db: DatabaseSync, foodId: string, createdAt: number, deletedAt: number | null = null) {
  db.prepare(
    `INSERT INTO logEntries (id, date, mealId, foodId, grams, createdAt, updatedAt, deletedAt)
     VALUES (?, '2026-09-26', ?, ?, 100, ?, ?, ?)`,
  ).run(`e${entryId++}`, DEFAULT_MEAL_IDS.lunch, foodId, createdAt, createdAt, deletedAt);
}

function search(db: DatabaseSync, query: string): string[] {
  const params = buildSearch(query);
  if (!params) throw new Error(`unsearchable query: ${query}`);
  const rows = db
    .prepare(SEARCH_FOODS_SQL)
    .all(params.match, recentCutoff(NOW), params.startsWith, 50) as unknown as FoodSearchRow[];
  return rows.map((r) => r.id);
}

describe('food search SQL', () => {
  let db: DatabaseSync;
  beforeEach(() => {
    db = migratedDb();
  });
  afterEach(() => db.close());

  it('ranks user foods, then seed dishes, then USDA', () => {
    insertFood(db, 'usda', 'Cheese pie', 'usda');
    insertFood(db, 'seed', 'Cheese burek', 'seed');
    insertFood(db, 'user', 'Cheese sandwich', 'user');
    expect(search(db, 'cheese')).toEqual(['user', 'seed', 'usda']);
  });

  it('puts recently used foods of any source in the first tier, newest first', () => {
    insertFood(db, 'user', 'Milk homemade', 'user');
    insertFood(db, 'seed', 'Milk pie', 'seed');
    insertFood(db, 'usda1', 'Milk, whole', 'usda');
    insertFood(db, 'usda2', 'Milk, skim', 'usda');
    logFood(db, 'usda2', NOW - 2 * DAY);
    logFood(db, 'usda1', NOW - DAY);
    expect(search(db, 'milk')).toEqual(['usda1', 'usda2', 'user', 'seed']);
  });

  it('ignores old and deleted log entries for the recent tier', () => {
    insertFood(db, 'seed', 'Bean stew', 'seed');
    insertFood(db, 'old', 'Beans, raw', 'usda');
    insertFood(db, 'deleted', 'Beans, canned', 'usda');
    logFood(db, 'old', NOW - 60 * DAY);
    logFood(db, 'deleted', NOW, NOW);
    expect(search(db, 'bean')[0]).toBe('seed');
  });

  it('prefers names that start with the query', () => {
    insertFood(db, 'sheep', 'Sheep milk', 'usda');
    insertFood(db, 'milk', 'Milk, producer, fluid', 'usda');
    expect(search(db, 'milk')).toEqual(['milk', 'sheep']);
  });

  it('prefers shorter names among equal matches', () => {
    insertFood(db, 'long', 'Milk, dry, nonfat, instant', 'usda');
    insertFood(db, 'short', 'Milk', 'usda');
    expect(search(db, 'milk')).toEqual(['short', 'long']);
  });

  it('does not penalise foods named in both languages', () => {
    db.prepare(
      `INSERT INTO foods (id, nameMk, nameEn, searchKey, kind, source, sourceRef, createdAt, updatedAt)
       VALUES ('both', 'Млеко (2%)', 'Milk (2%)', ?, 'ingredient', 'usda', 'both', 0, 0)`,
    ).run(toSearchKey('Млеко (2%) Milk (2%)'));
    insertFood(db, 'en', 'Milk and cereal bar', 'usda');
    expect(search(db, 'milk')).toEqual(['both', 'en']);
  });

  it('hides soft-deleted foods', () => {
    insertFood(db, 'a', 'Burek', 'user');
    db.prepare(`UPDATE foods SET deletedAt = 1 WHERE id = 'a'`).run();
    expect(search(db, 'burek')).toEqual([]);
  });

  it('lists recent foods by last use', () => {
    insertFood(db, 'a', 'Apple', 'usda');
    insertFood(db, 'b', 'Bread', 'usda');
    insertFood(db, 'c', 'Cheese', 'usda');
    logFood(db, 'a', NOW - 3 * DAY);
    logFood(db, 'b', NOW - DAY);
    logFood(db, 'a', NOW - 5 * DAY);
    logFood(db, 'c', NOW, NOW); // deleted entry doesn't count
    const rows = db.prepare(RECENT_FOODS_SQL).all(10) as unknown as FoodSearchRow[];
    expect(rows.map((r) => r.id)).toEqual(['b', 'a']);
    expect(rows[1].lastUsedAt).toBe(NOW - 3 * DAY);
  });
});
