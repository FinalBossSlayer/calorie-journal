import { cleanName, foodSearchKey, nutrientProblems } from './customFood';
import { emptyNutrients, type NutrientValues } from './nutrition';

function values(v: Partial<NutrientValues>): NutrientValues {
  return { ...emptyNutrients(), ...v };
}

describe('nutrientProblems', () => {
  it('accepts a normal label', () => {
    // Ajvar: 118 kcal, 1.5 g protein, 9 g carbs (7 g sugar), 8 g fat, 1.2 g salt
    expect(nutrientProblems(values({ kcal: 118, protein: 1.5, carbs: 9, sugar: 7, fat: 8, salt: 1.2 }))).toEqual([]);
  });

  it('accepts all values unknown', () => {
    expect(nutrientProblems(emptyNutrients())).toEqual([]);
  });

  it('flags protein + carbs + fat over 100 g, allowing label rounding', () => {
    expect(nutrientProblems(values({ protein: 30, carbs: 40, fat: 31 }))).toEqual([]);
    expect(nutrientProblems(values({ protein: 30, carbs: 40, fat: 32 }))).toEqual(['macroSum']);
  });

  it('flags sugar above carbs only when both are known', () => {
    expect(nutrientProblems(values({ carbs: 5, sugar: 6 }))).toEqual(['sugarOverCarbs']);
    expect(nutrientProblems(values({ sugar: 6 }))).toEqual([]);
  });
});

describe('cleanName', () => {
  it('trims and collapses spaces', () => {
    expect(cleanName('  Ајвар   Жито ')).toBe('Ајвар Жито');
  });

  it('returns null for blank names', () => {
    expect(cleanName('   ')).toBeNull();
  });
});

describe('foodSearchKey', () => {
  it('joins both names and transliterates', () => {
    expect(foodSearchKey('Ајвар', 'Ajvar')).toBe('ajvar ajvar');
    expect(foodSearchKey(null, 'Ajvar')).toBe('ajvar');
  });
});
