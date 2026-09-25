/// <reference types="node" />
/**
 * Applies the real migration files to Node's built-in SQLite, the same way
 * the Expo migrator does (one statement per breakpoint), and checks the
 * parts Drizzle can't type-check: FTS triggers, constraints, seeded rows.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { toSearchKey } from '@/lib/translit';

import { DEFAULT_MEAL_IDS } from './defaults';
import journal from './migrations/meta/_journal.json';

function migratedDb(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  for (const entry of journal.entries) {
    const file = readFileSync(join(__dirname, 'migrations', `${entry.tag}.sql`), 'utf8');
    for (const statement of file.split('--> statement-breakpoint')) {
      if (statement.trim()) db.exec(statement);
    }
  }
  return db;
}

let now = 1_700_000_000_000;

function insertFood(db: DatabaseSync, id: string, nameMk: string | null, nameEn: string | null) {
  db.prepare(
    `INSERT INTO foods (id, nameMk, nameEn, searchKey, kind, source, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, 'dish', 'user', ?, ?)`,
  ).run(id, nameMk, nameEn, toSearchKey(`${nameMk ?? ''} ${nameEn ?? ''}`), now, now++);
}

function search(db: DatabaseSync, query: string): string[] {
  const match = toSearchKey(query)
    .split(' ')
    .map((term) => `"${term}"*`)
    .join(' ');
  return db
    .prepare(
      `SELECT f.id FROM foods_fts
       JOIN foods f ON f.id = foods_fts.foodId
       WHERE foods_fts.searchKey MATCH ? AND f.deletedAt IS NULL
       ORDER BY rank`,
    )
    .all(match)
    .map((row) => String(row.id));
}

describe('migrations', () => {
  let db: DatabaseSync;
  beforeEach(() => {
    db = migratedDb();
  });
  afterEach(() => db.close());

  it('creates all tables', () => {
    const names = db
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'foods_fts_%'`)
      .all()
      .map((row) => row.name);
    expect(names).toEqual(
      expect.arrayContaining(['profile', 'foods', 'portions', 'recipeIngredients', 'meals', 'logEntries', 'foods_fts']),
    );
  });

  it('seeds the four default meals in order', () => {
    const rows = db.prepare('SELECT id, nameMk, nameEn, isDefault, isHidden FROM meals ORDER BY sortOrder').all();
    expect(rows).toEqual([
      { id: DEFAULT_MEAL_IDS.breakfast, nameMk: 'Појадок', nameEn: 'Breakfast', isDefault: 1, isHidden: 0 },
      { id: DEFAULT_MEAL_IDS.lunch, nameMk: 'Ручек', nameEn: 'Lunch', isDefault: 1, isHidden: 0 },
      { id: DEFAULT_MEAL_IDS.dinner, nameMk: 'Вечера', nameEn: 'Dinner', isDefault: 1, isHidden: 0 },
      { id: DEFAULT_MEAL_IDS.snacks, nameMk: 'Ужина', nameEn: 'Snacks', isDefault: 1, isHidden: 0 },
    ]);
  });

  describe('foods_fts', () => {
    it('indexes new foods and finds them by any spelling', () => {
      insertFood(db, 'a', 'Тавче гравче', 'Baked beans');
      insertFood(db, 'b', 'Сарма', null);
      for (const q of ['тавче', 'tavče', 'tavche', 'tavce', 'tav', 'TAVCE GRAV']) {
        expect(search(db, q)).toEqual(['a']);
      }
      expect(search(db, 'sarma')).toEqual(['b']);
    });

    it('re-indexes on rename', () => {
      insertFood(db, 'a', 'Сарма', null);
      db.prepare(`UPDATE foods SET nameMk = 'Бурек', searchKey = ? WHERE id = 'a'`).run(toSearchKey('Бурек'));
      expect(search(db, 'sarma')).toEqual([]);
      expect(search(db, 'burek')).toEqual(['a']);
      expect(db.prepare('SELECT count(*) AS n FROM foods_fts').get()).toEqual({ n: 1 });
    });

    it('hides soft-deleted foods from search', () => {
      insertFood(db, 'a', 'Сарма', null);
      db.prepare(`UPDATE foods SET deletedAt = ? WHERE id = 'a'`).run(now);
      expect(search(db, 'sarma')).toEqual([]);
    });

    it('removes the index row on hard delete', () => {
      insertFood(db, 'a', 'Сарма', null);
      db.prepare(`DELETE FROM foods WHERE id = 'a'`).run();
      expect(db.prepare('SELECT count(*) AS n FROM foods_fts').get()).toEqual({ n: 0 });
    });
  });

  describe('constraints', () => {
    it('requires at least one food name', () => {
      expect(() => insertFood(db, 'x', null, null)).toThrow(/CHECK constraint failed/);
    });

    it('enforces foreign keys', () => {
      expect(() =>
        db
          .prepare(
            `INSERT INTO portions (id, foodId, nameEn, grams, createdAt, updatedAt)
             VALUES ('p', 'missing', 'piece', 100, 0, 0)`,
          )
          .run(),
      ).toThrow(/FOREIGN KEY constraint failed/);
    });

    it('rejects non-positive portion grams', () => {
      insertFood(db, 'a', 'Бурек', null);
      expect(() =>
        db
          .prepare(
            `INSERT INTO portions (id, foodId, nameMk, grams, createdAt, updatedAt)
             VALUES ('p', 'a', '1 парче', 0, 0, 0)`,
          )
          .run(),
      ).toThrow(/CHECK constraint failed/);
    });
  });
});
