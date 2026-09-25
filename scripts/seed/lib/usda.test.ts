import { formatPortion, pickNutrients, type RawPortion } from './usda';

describe('pickNutrients', () => {
  it('maps the standard SR Legacy nutrient IDs', () => {
    const r = pickNutrients(
      new Map([
        [1008, 333],
        [1003, 23.36],
        [1005, 60.01],
        [1004, 0.83],
        [1079, 15.2],
        [2000, 2.23],
        [1093, 12],
      ]),
    );
    expect(r).toEqual({ kcal: 333, protein: 23.36, carbs: 60.01, fat: 0.83, fiber: 15.2, sugar: 2.23, salt: 0.03 });
  });

  it('converts sodium mg to salt g (× 2.5)', () => {
    expect(pickNutrients(new Map([[1093, 400]])).salt).toBe(1);
  });

  it('falls back to Atwater energy, preferring specific factors', () => {
    expect(pickNutrients(new Map([[2047, 100], [2048, 95]])).kcal).toBe(95);
    expect(pickNutrients(new Map([[2047, 100]])).kcal).toBe(100);
    expect(pickNutrients(new Map([[1008, 90], [2048, 95]])).kcal).toBe(90);
  });

  it('falls back to carbs by summation, NLEA fat and NLEA sugars', () => {
    const r = pickNutrients(new Map([[1050, 10], [1085, 5], [1063, 3]]));
    expect(r.carbs).toBe(10);
    expect(r.fat).toBe(5);
    expect(r.sugar).toBe(3);
  });

  it('leaves missing nutrients null, and keeps a real 0', () => {
    const r = pickNutrients(new Map([[1003, 0]]));
    expect(r.protein).toBe(0);
    expect(r.kcal).toBeNull();
    expect(r.fiber).toBeNull();
    expect(r.salt).toBeNull();
  });

  it('rounds to a sensible precision', () => {
    const r = pickNutrients(new Map([[1008, 123.456], [1003, 1.23456], [1093, 1.2345]]));
    expect(r.kcal).toBe(123.5);
    expect(r.protein).toBe(1.23);
    expect(r.salt).toBe(0.003);
  });
});

describe('formatPortion', () => {
  const base: RawPortion = { amount: '1', unitName: null, modifier: '', portionDescription: '', gramWeight: '100' };

  it('uses the SR Legacy modifier as the label', () => {
    expect(formatPortion({ ...base, unitName: 'undetermined', modifier: 'cup, chopped', gramWeight: '160' })).toEqual({
      nameEn: '1 cup, chopped',
      nameMk: null,
      grams: 160,
    });
  });

  it('combines the Foundation unit and modifier', () => {
    expect(formatPortion({ ...base, amount: '1.0', unitName: 'fruit', modifier: 'medium (2-2/3" dia)' })?.nameEn).toBe(
      '1 fruit, medium (2-2/3" dia)',
    );
    expect(formatPortion({ ...base, amount: '2.0', unitName: 'tablespoon' })?.nameEn).toBe('2 tablespoon');
  });

  it('translates simple single units to Macedonian', () => {
    expect(formatPortion({ ...base, modifier: 'cup' })?.nameMk).toBe('1 шолја');
    expect(formatPortion({ ...base, amount: '1.0', unitName: 'tablespoon' })?.nameMk).toBe('1 лажица');
    expect(formatPortion({ ...base, modifier: 'slice' })?.nameMk).toBe('1 парче');
  });

  it('does not translate amounts other than 1 (plural forms)', () => {
    expect(formatPortion({ ...base, amount: '2', modifier: 'cup' })?.nameMk).toBeNull();
  });

  it('skips imperial weight and volume units', () => {
    expect(formatPortion({ ...base, modifier: 'oz' })).toBeNull();
    expect(formatPortion({ ...base, modifier: 'oz (3 oz)' })).toBeNull();
    expect(formatPortion({ ...base, modifier: 'lb' })).toBeNull();
    expect(formatPortion({ ...base, modifier: 'fl oz' })).toBeNull();
    expect(formatPortion({ ...base, unitName: 'cubic inch' })).toBeNull();
  });

  it('keeps packages that mention oz in parentheses', () => {
    expect(formatPortion({ ...base, modifier: 'package (10 oz)' })?.nameEn).toBe('1 package (10 oz)');
  });

  it('skips portions without weight or label', () => {
    expect(formatPortion({ ...base, modifier: 'cup', gramWeight: '0' })).toBeNull();
    expect(formatPortion({ ...base, modifier: 'cup', gramWeight: '' })).toBeNull();
    expect(formatPortion(base)).toBeNull();
  });

  it('collapses whitespace', () => {
    expect(formatPortion({ ...base, unitName: 'serving', modifier: 'NLEA ' })?.nameEn).toBe('1 serving, NLEA');
  });
});
