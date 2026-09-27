import { create } from 'zustand';

import type { NutrientValues } from '@/lib/nutrition';

export interface PickedIngredient {
  foodId: string;
  nameMk: string | null;
  nameEn: string | null;
  per100g: NutrientValues;
}

type IngredientPickerState = {
  picked: PickedIngredient | null;
  pick: (ingredient: PickedIngredient) => void;
  /** Returns the picked ingredient once and clears it. */
  take: () => PickedIngredient | null;
};

/**
 * Hands the food chosen on the "Add ingredient" screen back to the recipe
 * builder, which takes it when it regains focus. Routes can't return values.
 */
export const useIngredientPickerStore = create<IngredientPickerState>()((set, get) => ({
  picked: null,
  pick: (ingredient) => set({ picked: ingredient }),
  take: () => {
    const { picked } = get();
    if (picked) set({ picked: null });
    return picked;
  },
}));
