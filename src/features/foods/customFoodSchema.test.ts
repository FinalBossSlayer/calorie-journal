import { type CustomFoodInput, customFoodSchema, emptyPortion } from './customFoodSchema';

function input(overrides: Partial<CustomFoodInput> = {}): CustomFoodInput {
  return {
    nameMk: 'Ајвар',
    nameEn: '',
    kind: 'product',
    nutrients: { kcal: '118', protein: '1,5', carbs: '9', fat: '8', fiber: '', sugar: '7', salt: '1.2' },
    portions: [],
    ...overrides,
  };
}

function issues(value: CustomFoodInput): Record<string, string> {
  const result = customFoodSchema.safeParse(value);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]));
}

describe('customFoodSchema', () => {
  it('parses a label: decimal commas, blank means unknown, names cleaned', () => {
    const result = customFoodSchema.parse(input({ nameEn: '  ' }));
    expect(result.nameMk).toBe('Ајвар');
    expect(result.nameEn).toBeNull();
    expect(result.nutrients).toEqual({ kcal: 118, protein: 1.5, carbs: 9, fat: 8, fiber: null, sugar: 7, salt: 1.2 });
  });

  it('needs a name in at least one language', () => {
    expect(issues(input({ nameMk: ' ', nameEn: '' }))).toEqual({ nameMk: 'required' });
    expect(customFoodSchema.parse(input({ nameMk: '', nameEn: 'Ajvar' })).nameEn).toBe('Ajvar');
  });

  it('needs calories, but not the other nutrients', () => {
    const blank = { kcal: '', protein: '', carbs: '', fat: '', fiber: '', sugar: '', salt: '' };
    expect(issues(input({ nutrients: blank }))).toEqual({ 'nutrients.kcal': 'required' });
  });

  it('rejects values out of range or not numbers', () => {
    const nutrients = { ...input().nutrients, kcal: '950', salt: 'abc', protein: '-1' };
    expect(issues(input({ nutrients }))).toEqual({
      'nutrients.kcal': 'range',
      'nutrients.salt': 'range',
      'nutrients.protein': 'range',
    });
  });

  it('flags impossible combinations on the related field', () => {
    const nutrients = { ...input().nutrients, protein: '50', carbs: '40', fat: '20', sugar: '45' };
    expect(issues(input({ nutrients }))).toEqual({
      'nutrients.fat': 'macroSum',
      'nutrients.sugar': 'sugarOverCarbs',
    });
  });

  it('keeps filled portions, skips empty rows, flags half-filled ones', () => {
    const ok = customFoodSchema.parse(
      input({ portions: [{ portionId: 'p1', name: ' 1 лажица ', grams: '15' }, emptyPortion()] }),
    );
    expect(ok.portions).toEqual([{ portionId: 'p1', name: '1 лажица', grams: 15 }]);

    expect(
      issues(input({ portions: [{ portionId: null, name: '1 тегла', grams: '' }, { portionId: null, name: '', grams: '0' }] })),
    ).toEqual({ 'portions.0.grams': 'range', 'portions.1.name': 'required', 'portions.1.grams': 'range' });
  });
});
