import type { LoadedRecipe } from '@/db/queries/userFoods';
import { emptyNutrients } from '@/lib/nutrition';

import { cloneRecipeInput, recipeToInput } from './recipeInput';

const tavce = {
  food: { id: 'seed-tavce', nameMk: 'Тавче гравче', nameEn: 'Tavče gravče (baked beans)', cookedWeightG: 1800 },
  ingredients: [
    { rowId: 'r1', foodId: 'beans', nameMk: 'Грав', nameEn: 'Beans', per100g: emptyNutrients(), grams: 500 },
  ],
  portions: [{ id: 'p1', nameMk: '1 чинија', nameEn: '1 plate', grams: 300 }],
} as unknown as LoadedRecipe; // only the fields these helpers read

const suffix = { mk: '(моја верзија)', en: '(my version)' };

describe('recipeToInput', () => {
  it('keeps row ids so saving updates the same rows', () => {
    const input = recipeToInput(tavce, 'mk');
    expect(input.ingredients[0]).toMatchObject({ rowId: 'r1', foodId: 'beans', grams: '500' });
    expect(input.portions).toEqual([{ portionId: 'p1', name: '1 чинија', grams: '300' }]);
    expect(input.cookedWeight).toBe('1800');
  });
});

describe('cloneRecipeInput', () => {
  it('copies everything as new rows, with a suffix on both names', () => {
    const input = cloneRecipeInput(tavce, 'en', suffix);
    expect(input.nameMk).toBe('Тавче гравче (моја верзија)');
    expect(input.nameEn).toBe('Tavče gravče (baked beans) (my version)');
    expect(input.cookedWeight).toBe('1800');
    expect(input.ingredients).toEqual([
      { rowId: null, foodId: 'beans', nameMk: 'Грав', nameEn: 'Beans', per100g: emptyNutrients(), grams: '500' },
    ]);
    expect(input.portions).toEqual([
      { portionId: null, name: '1 plate', grams: '300', copiedNames: { nameMk: '1 чинија', nameEn: '1 plate' } },
    ]);
  });

  it('leaves a missing name empty', () => {
    const noEnglish = { ...tavce, food: { ...tavce.food, nameEn: null } } as LoadedRecipe;
    expect(cloneRecipeInput(noEnglish, 'mk', suffix).nameEn).toBe('');
  });
});
