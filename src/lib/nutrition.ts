/** The 7 nutrients tracked everywhere in the app. Units: kcal, grams (salt in g). */
export const NUTRIENTS = ['kcal', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'salt'] as const;

export type Nutrient = (typeof NUTRIENTS)[number];

/** null means "unknown" — never display it as 0. */
export type NutrientValues = Record<Nutrient, number | null>;

export function emptyNutrients(): NutrientValues {
  return { kcal: null, protein: null, carbs: null, fat: null, fiber: null, sugar: null, salt: null };
}

/** Nutrients for `grams` of a food, from its per-100g values. Unknown stays unknown. */
export function scaleNutrients(per100g: NutrientValues, grams: number): NutrientValues {
  const out = emptyNutrients();
  for (const n of NUTRIENTS) {
    const v = per100g[n];
    out[n] = v === null ? null : (v * grams) / 100;
  }
  return out;
}
