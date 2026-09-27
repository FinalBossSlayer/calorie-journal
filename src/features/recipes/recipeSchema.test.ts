import { emptyNutrients } from '@/lib/nutrition';

import { type IngredientInput, type RecipeInput, recipeSchema } from './recipeSchema';

const beans: IngredientInput = {
  rowId: null,
  foodId: 'beans',
  nameMk: 'Грав',
  nameEn: 'Beans',
  per100g: { ...emptyNutrients(), kcal: 333 },
  grams: '500',
};

function input(overrides: Partial<RecipeInput> = {}): RecipeInput {
  return { nameMk: 'Тавче гравче', nameEn: '', ingredients: [beans], cookedWeight: '', portions: [], ...overrides };
}

function issues(value: RecipeInput): Record<string, string> {
  const result = recipeSchema.safeParse(value);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]));
}

describe('recipeSchema', () => {
  it('parses ingredients and an empty cooked weight as "use raw weight"', () => {
    const r = recipeSchema.parse(input({ ingredients: [{ ...beans, grams: '500,5' }] }));
    expect(r.ingredients).toEqual([{ rowId: null, foodId: 'beans', grams: 500.5, per100g: beans.per100g }]);
    expect(r.cookedWeightG).toBeNull();
    expect(r.nameEn).toBeNull();
  });

  it('parses a cooked weight', () => {
    expect(recipeSchema.parse(input({ cookedWeight: '1800' })).cookedWeightG).toBe(1800);
  });

  it('needs a name and at least one ingredient', () => {
    expect(issues(input({ nameMk: '', ingredients: [] }))).toEqual({ nameMk: 'required', ingredients: 'required' });
  });

  it('flags invalid amounts and cooked weights', () => {
    expect(
      issues(input({ ingredients: [{ ...beans, grams: '0' }, { ...beans, grams: '20000' }], cookedWeight: 'x' })),
    ).toEqual({ 'ingredients.0.grams': 'range', 'ingredients.1.grams': 'range', cookedWeight: 'range' });
  });
});
