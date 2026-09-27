import type { NutrientValues } from './nutrition';
import {
  computeRecipeNutrition,
  planIngredientChanges,
  type RecipeIngredientInput,
  recipePreview,
  roundNutrients,
  type StoredIngredient,
} from './recipe';

function food(values: Partial<NutrientValues>): NutrientValues {
  return {
    kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, salt: 0,
    ...values,
  };
}

// Simplified tavče gravče: dry beans + onion + oil + water.
const beans = food({ kcal: 333, protein: 23.4, carbs: 60, fat: 0.8, fiber: 15.2, sugar: 2.2, salt: 0.03 });
const onion = food({ kcal: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7, sugar: 4.2, salt: 0.01 });
const oil = food({ kcal: 884, fat: 100 });
const water = food({});

const tavce: RecipeIngredientInput[] = [
  { grams: 500, per100g: beans },
  { grams: 200, per100g: onion },
  { grams: 50, per100g: oil },
  { grams: 1250, per100g: water },
];

describe('computeRecipeNutrition', () => {
  describe('without cooked weight', () => {
    it('sums totals for each ingredient amount', () => {
      const r = computeRecipeNutrition(tavce);
      // 5×333 + 2×40 + 0.5×884 = 1665 + 80 + 442
      expect(r.totals.kcal).toBeCloseTo(2187);
      expect(r.totals.protein).toBeCloseTo(5 * 23.4 + 2 * 1.1);
      expect(r.totals.fat).toBeCloseTo(5 * 0.8 + 2 * 0.1 + 50);
    });

    it('divides by the raw ingredient weight', () => {
      const r = computeRecipeNutrition(tavce);
      expect(r.rawWeightG).toBe(2000);
      expect(r.finalWeightG).toBe(2000);
      expect(r.per100g.kcal).toBeCloseTo(2187 / 20);
    });

    it('returns the ingredient values unchanged for a single ingredient', () => {
      const r = computeRecipeNutrition([{ grams: 250, per100g: beans }]);
      expect(r.per100g.kcal).toBeCloseTo(333);
      expect(r.per100g.protein).toBeCloseTo(23.4);
      expect(r.per100g.salt).toBeCloseTo(0.03);
    });

    it('treats undefined and null cooked weight the same', () => {
      expect(computeRecipeNutrition(tavce, null)).toEqual(computeRecipeNutrition(tavce));
    });
  });

  describe('with cooked weight', () => {
    it('makes values denser when water evaporates', () => {
      const r = computeRecipeNutrition(tavce, 1500);
      expect(r.finalWeightG).toBe(1500);
      expect(r.rawWeightG).toBe(2000);
      expect(r.per100g.kcal).toBeCloseTo(2187 / 15);
      // Totals don't depend on cooked weight.
      expect(r.totals.kcal).toBeCloseTo(2187);
    });

    it('makes values thinner when food absorbs water', () => {
      // 100 g dry rice cooks to ~300 g.
      const rice = food({ kcal: 360, carbs: 80 });
      const r = computeRecipeNutrition([{ grams: 100, per100g: rice }], 300);
      expect(r.per100g.kcal).toBeCloseTo(120);
      expect(r.per100g.carbs).toBeCloseTo(80 / 3);
    });

    it('matches the raw result when cooked weight equals raw weight', () => {
      const raw = computeRecipeNutrition(tavce);
      const cooked = computeRecipeNutrition(tavce, 2000);
      expect(cooked.per100g).toEqual(raw.per100g);
    });
  });

  describe('unknown nutrients', () => {
    it('flags a nutrient as incomplete when some ingredients are unknown', () => {
      const r = computeRecipeNutrition([
        { grams: 100, per100g: food({ sugar: 10 }) },
        { grams: 100, per100g: food({ sugar: null }) },
      ]);
      expect(r.incompleteNutrients).toEqual(['sugar']);
      // Lower bound from the known ingredient, spread over the full weight.
      expect(r.totals.sugar).toBeCloseTo(10);
      expect(r.per100g.sugar).toBeCloseTo(5);
    });

    it('returns null (not 0) when every ingredient is unknown', () => {
      const r = computeRecipeNutrition([
        { grams: 100, per100g: food({ fiber: null }) },
        { grams: 50, per100g: food({ fiber: null }) },
      ]);
      expect(r.totals.fiber).toBeNull();
      expect(r.per100g.fiber).toBeNull();
      expect(r.incompleteNutrients).not.toContain('fiber');
    });

    it('keeps a known 0 as 0', () => {
      const r = computeRecipeNutrition([{ grams: 100, per100g: oil }]);
      expect(r.per100g.protein).toBe(0);
      expect(r.incompleteNutrients).toEqual([]);
    });

    it('lists incomplete nutrients in canonical order', () => {
      const r = computeRecipeNutrition([
        { grams: 100, per100g: food({ salt: 1, fiber: 2 }) },
        { grams: 100, per100g: food({ salt: null, fiber: null }) },
      ]);
      expect(r.incompleteNutrients).toEqual(['fiber', 'salt']);
    });

    it('ignores unknown values on zero-gram ingredients for totals but still flags them', () => {
      const r = computeRecipeNutrition([
        { grams: 100, per100g: food({ kcal: 100 }) },
        { grams: 0, per100g: food({ kcal: null }) },
      ]);
      expect(r.per100g.kcal).toBeCloseTo(100);
      expect(r.incompleteNutrients).toEqual(['kcal']);
    });
  });

  describe('validation', () => {
    it('rejects an empty ingredient list', () => {
      expect(() => computeRecipeNutrition([])).toThrow(RangeError);
    });

    it('rejects a total weight of 0', () => {
      expect(() => computeRecipeNutrition([{ grams: 0, per100g: beans }])).toThrow(RangeError);
    });

    it.each([-1, NaN, Infinity])('rejects ingredient grams of %s', (grams) => {
      expect(() => computeRecipeNutrition([{ grams, per100g: beans }])).toThrow(RangeError);
    });

    it.each([0, -100, NaN])('rejects cooked weight of %s', (cooked) => {
      expect(() => computeRecipeNutrition(tavce, cooked)).toThrow(RangeError);
    });
  });
});

describe('roundNutrients', () => {
  it('rounds kcal to 0.1 and grams to 0.001, keeping unknowns', () => {
    const r = roundNutrients(food({ kcal: 123.456, protein: 1.23456, salt: null }));
    expect(r.kcal).toBe(123.5);
    expect(r.protein).toBe(1.235);
    expect(r.salt).toBeNull();
  });
});

describe('recipePreview', () => {
  it('is null until some ingredient has a valid amount', () => {
    expect(recipePreview([], null)).toBeNull();
    expect(recipePreview([{ grams: null, per100g: beans }, { grams: 0, per100g: onion }], null)).toBeNull();
  });

  it('leaves out rows still being typed', () => {
    const r = recipePreview([{ grams: 100, per100g: beans }, { grams: null, per100g: oil }], null);
    expect(r?.per100g.kcal).toBeCloseTo(333);
  });

  it('uses the cooked weight when valid, the raw weight otherwise', () => {
    const rows = [{ grams: 500, per100g: beans }];
    expect(recipePreview(rows, 1000)?.per100g.kcal).toBeCloseTo(166.5);
    expect(recipePreview(rows, 0)?.per100g.kcal).toBeCloseTo(333);
    expect(recipePreview(rows, null)?.finalWeightG).toBe(500);
  });
});

describe('planIngredientChanges', () => {
  const beansRow: StoredIngredient = { id: 'r1', ingredientFoodId: 'beans', grams: 500, sortOrder: 0 };
  const onionRow: StoredIngredient = { id: 'r2', ingredientFoodId: 'onion', grams: 200, sortOrder: 1 };

  it('does nothing when nothing changed', () => {
    const edited = [
      { rowId: 'r1', foodId: 'beans', grams: 500 },
      { rowId: 'r2', foodId: 'onion', grams: 200 },
    ];
    expect(planIngredientChanges([beansRow, onionRow], edited)).toEqual({ insert: [], update: [], remove: [] });
  });

  it('inserts new rows, updates changed amounts and order, removes missing rows', () => {
    const edited = [
      { rowId: null, foodId: 'oil', grams: 50 },
      { rowId: 'r1', foodId: 'beans', grams: 450 },
    ];
    expect(planIngredientChanges([beansRow, onionRow], edited)).toEqual({
      insert: [{ ingredientFoodId: 'oil', grams: 50, sortOrder: 0 }],
      update: [{ id: 'r1', ingredientFoodId: 'beans', grams: 450, sortOrder: 1 }],
      remove: ['r2'],
    });
  });
});
