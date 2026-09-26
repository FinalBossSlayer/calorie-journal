import { scaleNutrients } from './nutrition';

describe('scaleNutrients', () => {
  it('scales per-100g values to the logged grams and keeps unknowns null', () => {
    const per100g = { kcal: 200, protein: 10, carbs: 20, fat: 5, fiber: null, sugar: 2, salt: 0.5 };
    expect(scaleNutrients(per100g, 150)).toEqual({
      kcal: 300,
      protein: 15,
      carbs: 30,
      fat: 7.5,
      fiber: null,
      sugar: 3,
      salt: 0.75,
    });
  });
});
