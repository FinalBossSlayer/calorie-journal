import { defaultMealId, entryGrams, MAX_ENTRY_GRAMS, mealSlotForHour, rescaleSnapshot, resolveAmount } from './logging';
import type { NutrientValues } from './nutrition';

describe('entryGrams', () => {
  it('uses the amount as grams without a portion', () => {
    expect(entryGrams(150, null)).toBe(150);
  });

  it('multiplies quantity by portion grams', () => {
    expect(entryGrams(1.5, 180)).toBe(270);
  });
});

describe('resolveAmount', () => {
  const piece = { id: 'p', grams: 180 };

  it('keeps grams as typed without a portion', () => {
    expect(resolveAmount(150, null)).toEqual({ grams: 150, portionId: null, quantity: null });
  });

  it('records portion and quantity', () => {
    expect(resolveAmount(1.5, piece)).toEqual({ grams: 270, portionId: 'p', quantity: 1.5 });
  });

  it('rejects missing, zero and negative amounts', () => {
    expect(resolveAmount(null, null)).toBeNull();
    expect(resolveAmount(0, piece)).toBeNull();
    expect(resolveAmount(-5, null)).toBeNull();
    expect(resolveAmount(Number.NaN, null)).toBeNull();
  });

  it('rejects amounts over the limit, including via portions', () => {
    expect(resolveAmount(MAX_ENTRY_GRAMS, null)).not.toBeNull();
    expect(resolveAmount(MAX_ENTRY_GRAMS + 1, null)).toBeNull();
    expect(resolveAmount(30, piece)).toBeNull(); // 5400 g
  });
});

describe('rescaleSnapshot', () => {
  const snapshot: NutrientValues = { kcal: 300, protein: 12, carbs: 30, fat: 15, fiber: null, sugar: 2, salt: 1.5 };

  it('scales every known nutrient by the new amount', () => {
    expect(rescaleSnapshot(snapshot, 200, 300)).toEqual({
      kcal: 450, protein: 18, carbs: 45, fat: 22.5, fiber: null, sugar: 3, salt: 2.25,
    });
  });

  it('keeps unknown values unknown', () => {
    expect(rescaleSnapshot(snapshot, 100, 50).fiber).toBeNull();
  });
});

describe('mealSlotForHour', () => {
  it.each([
    [7, 'breakfast'],
    [11, 'snacks'],
    [14, 'lunch'],
    [18, 'snacks'],
    [20, 'dinner'],
    [23, 'snacks'],
    [2, 'snacks'],
  ])('%i:00 → %s', (hour, slot) => {
    expect(mealSlotForHour(hour)).toBe(slot);
  });
});

describe('defaultMealId', () => {
  const slots = { breakfast: 'b', lunch: 'l', dinner: 'd', snacks: 's' };
  const meals = [
    { id: 'l', sortOrder: 1, isHidden: false },
    { id: 'b', sortOrder: 0, isHidden: false },
    { id: 'd', sortOrder: 2, isHidden: true },
    { id: 's', sortOrder: 3, isHidden: false },
  ];

  it('picks the meal for the time of day', () => {
    expect(defaultMealId(meals, 14, slots)).toBe('l');
  });

  it('falls back to the first visible meal when that one is hidden', () => {
    expect(defaultMealId(meals, 20, slots)).toBe('b');
  });

  it('returns null without visible meals', () => {
    expect(defaultMealId([], 8, slots)).toBeNull();
  });
});
