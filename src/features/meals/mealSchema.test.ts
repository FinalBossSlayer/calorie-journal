import { mealFormSchema } from './mealSchema';

describe('mealFormSchema', () => {
  it('fills the empty name from the other one', () => {
    expect(mealFormSchema.parse({ nameMk: '  Доручек ', nameEn: '' })).toEqual({
      nameMk: 'Доручек',
      nameEn: 'Доручек',
    });
  });

  it('requires at least one name', () => {
    const result = mealFormSchema.safeParse({ nameMk: ' ', nameEn: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({ path: ['nameMk'], message: 'required' });
  });
});
