import { seedUuid, usdaFoodId } from './ids';

describe('seedUuid', () => {
  it('is deterministic', () => {
    expect(usdaFoodId('171287')).toBe(usdaFoodId('171287'));
    expect(usdaFoodId('171287')).not.toBe(usdaFoodId('171288'));
  });

  it('produces an RFC 4122 version-5 UUID', () => {
    expect(seedUuid('anything')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('never changes for an existing name (IDs are referenced by user data)', () => {
    expect(usdaFoodId('171287')).toMatchInlineSnapshot(`"90a32229-eee9-58d6-aeab-08e5b3217533"`);
  });
});
