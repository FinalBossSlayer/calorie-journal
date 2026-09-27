import { makeFormat } from './format';

describe('makeFormat', () => {
  const mk = makeFormat('mk');
  const en = makeFormat('en');

  it('formats numbers for the given language', () => {
    expect(en.formatNumber(4.5, 1)).toBe('4.5');
    expect(mk.formatNumber(4.5, 1)).toBe('4,5');
  });

  it('shows unknown as a dash and lower bounds with ≥', () => {
    expect(en.formatNutrient(null)).toBe('—');
    expect(en.formatNutrient(0)).toBe('0');
    expect(en.formatNutrient(12, true)).toBe('≥ 12');
  });

  it('picks the name in the language, falling back to the other', () => {
    expect(mk.localizedName('Ручек', 'Lunch')).toBe('Ручек');
    expect(en.localizedName('Ручек', 'Lunch')).toBe('Lunch');
    expect(en.localizedName('Ајвар', null)).toBe('Ајвар');
  });
});
