import { emptyNutrients } from '@/lib/nutrition';

import { useIngredientPickerStore } from './ingredientPicker';

const onion = { foodId: 'onion', nameMk: 'Кромид', nameEn: 'Onion', per100g: emptyNutrients() };

beforeEach(() => useIngredientPickerStore.setState({ picked: null }));

describe('ingredient picker store', () => {
  it('hands over the picked ingredient exactly once', () => {
    useIngredientPickerStore.getState().pick(onion);
    expect(useIngredientPickerStore.getState().take()).toEqual(onion);
    expect(useIngredientPickerStore.getState().take()).toBeNull();
  });

  it('returns null when nothing was picked', () => {
    expect(useIngredientPickerStore.getState().take()).toBeNull();
  });
});
