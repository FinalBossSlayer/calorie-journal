import {
  groupByMeal,
  nutrientProgress,
  ringValues,
  sumNutrients,
  type NutrientSnapshot,
} from './day';

function snap(values: Partial<NutrientSnapshot>): NutrientSnapshot {
  return { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, salt: 0, ...values };
}

describe('sumNutrients', () => {
  it('returns known zeros when nothing was eaten', () => {
    const { values, incomplete } = sumNutrients([]);
    expect(values.kcal).toBe(0);
    expect(values.fiber).toBe(0);
    expect(incomplete).toEqual([]);
  });

  it('adds up every nutrient', () => {
    const { values } = sumNutrients([snap({ kcal: 250, protein: 10.5 }), snap({ kcal: 100, protein: 2 })]);
    expect(values.kcal).toBe(350);
    expect(values.protein).toBe(12.5);
  });

  it('flags the total as incomplete when some entries are unknown', () => {
    const { values, incomplete } = sumNutrients([snap({ fiber: 3 }), snap({ fiber: null })]);
    expect(values.fiber).toBe(3);
    expect(incomplete).toEqual(['fiber']);
  });

  it('returns null (not 0) when every entry is unknown', () => {
    const { values, incomplete } = sumNutrients([snap({ sugar: null }), snap({ sugar: null })]);
    expect(values.sugar).toBeNull();
    expect(incomplete).not.toContain('sugar');
  });

  it('carries over incomplete values from recipe snapshots', () => {
    const { incomplete } = sumNutrients([snap({ salt: 1, incompleteNutrients: ['salt'] }), snap({ salt: 0.5 })]);
    expect(incomplete).toEqual(['salt']);
  });
});

describe('groupByMeal', () => {
  const meals = [
    { id: 'dinner', sortOrder: 2, isHidden: false },
    { id: 'breakfast', sortOrder: 0, isHidden: false },
    { id: 'hidden', sortOrder: 3, isHidden: true },
    { id: 'lunch', sortOrder: 1, isHidden: false },
  ];

  it('orders meals by sortOrder and keeps empty visible meals', () => {
    const groups = groupByMeal(meals, [{ ...snap({ kcal: 300 }), mealId: 'lunch' }]);
    expect(groups.map((g) => g.meal.id)).toEqual(['breakfast', 'lunch', 'dinner']);
    expect(groups[0].entries).toEqual([]);
    expect(groups[0].totals.values.kcal).toBe(0);
    expect(groups[1].totals.values.kcal).toBe(300);
  });

  it('shows a hidden meal only when it has entries', () => {
    const groups = groupByMeal(meals, [{ ...snap({ kcal: 50 }), mealId: 'hidden' }]);
    expect(groups.map((g) => g.meal.id)).toContain('hidden');
  });

  it('keeps entry order within a meal', () => {
    const entries = [
      { ...snap({}), mealId: 'lunch', id: 'a' },
      { ...snap({}), mealId: 'lunch', id: 'b' },
    ];
    const lunch = groupByMeal(meals, entries).find((g) => g.meal.id === 'lunch');
    expect(lunch?.entries.map((e) => e.id)).toEqual(['a', 'b']);
  });
});

describe('nutrientProgress', () => {
  it('clamps the fraction to 0..1', () => {
    expect(nutrientProgress('protein', 50, 100).fraction).toBe(0.5);
    expect(nutrientProgress('protein', 150, 100).fraction).toBe(1);
  });

  it('marks kcal and max-type limits as over', () => {
    expect(nutrientProgress('kcal', 2100, 2000).over).toBe(true);
    expect(nutrientProgress('salt', 6, 5).over).toBe(true);
    expect(nutrientProgress('sugar', 50, 50).over).toBe(false);
  });

  it('never marks goal or min targets as over', () => {
    expect(nutrientProgress('protein', 200, 100).over).toBe(false);
    expect(nutrientProgress('fiber', 60, 30).over).toBe(false);
  });

  it('treats unknown values as no progress', () => {
    expect(nutrientProgress('fiber', null, 30)).toEqual({ fraction: 0, over: false });
  });

  it('handles a zero target without dividing by zero', () => {
    expect(nutrientProgress('sugar', 5, 0)).toEqual({ fraction: 0, over: true });
    expect(nutrientProgress('protein', 5, 0)).toEqual({ fraction: 0, over: false });
  });
});

describe('ringValues', () => {
  it('shows kcal eaten in eaten mode', () => {
    expect(ringValues(500, 2000, 'eaten')).toEqual({ value: 500, label: 'eaten', fraction: 0.25, over: false });
  });

  it('shows kcal left in left mode', () => {
    expect(ringValues(500, 2000, 'left')).toMatchObject({ value: 1500, label: 'left' });
  });

  it('switches to "over" once past the target in left mode', () => {
    expect(ringValues(2300, 2000, 'left')).toEqual({ value: 300, label: 'over', fraction: 1, over: true });
  });

  it('keeps counting up in eaten mode when over', () => {
    expect(ringValues(2300, 2000, 'eaten')).toMatchObject({ value: 2300, label: 'eaten', over: true });
  });

  it('shows an unknown value instead of a fake number', () => {
    expect(ringValues(null, 2000, 'eaten').value).toBeNull();
    expect(ringValues(null, 2000, 'left')).toMatchObject({ value: null, label: 'left' });
  });
});
