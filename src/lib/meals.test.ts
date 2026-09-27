import { canHide, checkDelete, fillMealNames, moveMeal, nextSortOrder } from './meals';

const meals = [
  { id: 'lunch', sortOrder: 1, isHidden: false },
  { id: 'breakfast', sortOrder: 0, isHidden: false },
  { id: 'snacks', sortOrder: 3, isHidden: true },
  { id: 'dinner', sortOrder: 2, isHidden: false },
];

describe('moveMeal', () => {
  it('swaps with the neighbour below', () => {
    expect(moveMeal(meals, 'breakfast', 1)).toEqual([
      { id: 'lunch', sortOrder: 0 },
      { id: 'breakfast', sortOrder: 1 },
    ]);
  });

  it('swaps with the neighbour above, hidden meals included', () => {
    expect(moveMeal(meals, 'snacks', -1)).toEqual([
      { id: 'snacks', sortOrder: 2 },
      { id: 'dinner', sortOrder: 3 },
    ]);
  });

  it('does nothing past either end or for an unknown id', () => {
    expect(moveMeal(meals, 'breakfast', -1)).toEqual([]);
    expect(moveMeal(meals, 'snacks', 1)).toEqual([]);
    expect(moveMeal(meals, 'nope', 1)).toEqual([]);
  });

  it('renumbers gaps and duplicates', () => {
    const messy = [
      { id: 'a', sortOrder: 0, isHidden: false },
      { id: 'b', sortOrder: 5, isHidden: false },
      { id: 'c', sortOrder: 5, isHidden: false },
    ];
    expect(moveMeal(messy, 'a', 1)).toEqual([
      { id: 'b', sortOrder: 0 },
      { id: 'a', sortOrder: 1 },
      { id: 'c', sortOrder: 2 },
    ]);
  });
});

describe('canHide', () => {
  it('allows hiding while another meal stays visible', () => {
    expect(canHide(meals, 'lunch')).toBe(true);
  });

  it('keeps the last visible meal', () => {
    const one = [
      { id: 'a', sortOrder: 0, isHidden: false },
      { id: 'b', sortOrder: 1, isHidden: true },
    ];
    expect(canHide(one, 'a')).toBe(false);
  });
});

describe('nextSortOrder', () => {
  it('goes after the last meal', () => {
    expect(nextSortOrder(meals)).toBe(4);
    expect(nextSortOrder([])).toBe(0);
  });
});

describe('fillMealNames', () => {
  it('copies the only name into the other language', () => {
    expect(fillMealNames({ nameMk: 'Доручек', nameEn: null })).toEqual({ nameMk: 'Доручек', nameEn: 'Доручек' });
    expect(fillMealNames({ nameMk: null, nameEn: 'Brunch' })).toEqual({ nameMk: 'Brunch', nameEn: 'Brunch' });
  });

  it('keeps both when both are given', () => {
    expect(fillMealNames({ nameMk: 'Ужина', nameEn: 'Snack' })).toEqual({ nameMk: 'Ужина', nameEn: 'Snack' });
  });
});

describe('checkDelete', () => {
  it('allows deleting an unused meal', () => {
    expect(checkDelete(meals, 'lunch', 0)).toBe('ok');
  });

  it('refuses a meal with logged food', () => {
    expect(checkDelete(meals, 'lunch', 3)).toBe('hasEntries');
  });

  it('keeps the last visible meal, but a hidden one can go', () => {
    const one = [
      { id: 'a', sortOrder: 0, isHidden: false },
      { id: 'b', sortOrder: 1, isHidden: true },
    ];
    expect(checkDelete(one, 'a', 0)).toBe('lastVisible');
    expect(checkDelete(one, 'b', 0)).toBe('ok');
  });
});
