import { planPortionChanges, portionDisplayName, portionNames, type StoredPortion } from './portions';

const slice: StoredPortion = { id: 'p1', nameMk: '1 парче', nameEn: '1 slice', grams: 30 };
const spoon: StoredPortion = { id: 'p2', nameMk: '1 лажица', nameEn: null, grams: 15 };

describe('portionDisplayName', () => {
  it('uses the UI language, falling back to the other one', () => {
    expect(portionDisplayName(slice, 'en')).toBe('1 slice');
    expect(portionDisplayName(spoon, 'en')).toBe('1 лажица');
    expect(portionDisplayName({ nameMk: null, nameEn: null }, 'mk')).toBe('');
  });
});

describe('portionNames', () => {
  it('stores a new name in the UI language only', () => {
    expect(portionNames('  1 чаша ', 'mk')).toEqual({ nameMk: '1 чаша', nameEn: null });
    expect(portionNames('1 cup', 'en')).toEqual({ nameMk: null, nameEn: '1 cup' });
  });

  it('keeps both names when the shown name is unchanged', () => {
    expect(portionNames('1 slice', 'en', slice)).toEqual({ nameMk: '1 парче', nameEn: '1 slice' });
  });

  it('drops the other language when the name was changed', () => {
    expect(portionNames('1 thin slice', 'en', slice)).toEqual({ nameMk: null, nameEn: '1 thin slice' });
  });
});

describe('planPortionChanges', () => {
  it('inserts new rows, updates changed ones, removes missing ones', () => {
    const changes = planPortionChanges(
      [slice, spoon],
      [
        { portionId: 'p1', name: '1 парче', grams: 35 },
        { portionId: null, name: '1 чаша', grams: 200 },
      ],
      'mk',
    );
    expect(changes).toEqual({
      insert: [{ nameMk: '1 чаша', nameEn: null, grams: 200 }],
      update: [{ id: 'p1', nameMk: '1 парче', nameEn: '1 slice', grams: 35 }],
      remove: ['p2'],
    });
  });

  it('does nothing when nothing changed', () => {
    const changes = planPortionChanges(
      [slice, spoon],
      [
        { portionId: 'p1', name: '1 slice', grams: 30 },
        { portionId: 'p2', name: '1 лажица', grams: 15 },
      ],
      'en',
    );
    expect(changes).toEqual({ insert: [], update: [], remove: [] });
  });

  it('keeps both copied names on a new row whose name was not changed', () => {
    const copiedNames = { nameMk: '1 чинија', nameEn: '1 plate' };
    expect(planPortionChanges([], [{ portionId: null, name: '1 чинија', grams: 300, copiedNames }], 'mk').insert).toEqual([
      { nameMk: '1 чинија', nameEn: '1 plate', grams: 300 },
    ]);
    expect(planPortionChanges([], [{ portionId: null, name: '1 голема чинија', grams: 400, copiedNames }], 'mk').insert).toEqual([
      { nameMk: '1 голема чинија', nameEn: null, grams: 400 },
    ]);
  });

  it('treats an unknown portion id as a new row', () => {
    const changes = planPortionChanges([], [{ portionId: 'gone', name: '1 cup', grams: 240 }], 'en');
    expect(changes.insert).toEqual([{ nameMk: null, nameEn: '1 cup', grams: 240 }]);
  });
});
