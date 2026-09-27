import type { LoadedRecipe } from '@/db/queries/userFoods';
import { emptyPortion } from '@/features/foods/customFoodSchema';
import type { Language } from '@/i18n';
import { portionDisplayName } from '@/lib/portions';

import type { RecipeInput } from './recipeSchema';

export function emptyRecipeInput(): RecipeInput {
  return { nameMk: '', nameEn: '', ingredients: [], cookedWeight: '', portions: [emptyPortion()] };
}

/** A loaded recipe as form values, for editing it. */
export function recipeToInput(recipe: LoadedRecipe, language: Language): RecipeInput {
  return {
    nameMk: recipe.food.nameMk ?? '',
    nameEn: recipe.food.nameEn ?? '',
    ingredients: recipe.ingredients.map((ing) => ({ ...ing, grams: String(ing.grams) })),
    cookedWeight: recipe.food.cookedWeightG === null ? '' : String(recipe.food.cookedWeightG),
    portions: recipe.portions.map((p) => ({
      portionId: p.id,
      name: portionDisplayName(p, language),
      grams: String(p.grams),
    })),
  };
}

/**
 * Form values for "Make my version" of a seed dish: same ingredients, cooked
 * weight and portions, but every row is new (nothing is shared with the dish)
 * and the names get a suffix such as "(моја верзија)" so the two are easy to tell apart.
 */
export function cloneRecipeInput(
  source: LoadedRecipe,
  language: Language,
  suffix: Record<Language, string>,
): RecipeInput {
  const input = recipeToInput(source, language);
  const withSuffix = (name: string, lang: Language) => (name ? `${name} ${suffix[lang]}` : '');
  return {
    ...input,
    nameMk: withSuffix(input.nameMk, 'mk'),
    nameEn: withSuffix(input.nameEn, 'en'),
    ingredients: input.ingredients.map((ing) => ({ ...ing, rowId: null })),
    portions: input.portions.map((p, i) => {
      const { nameMk, nameEn } = source.portions[i]!;
      return { ...p, portionId: null, copiedNames: { nameMk, nameEn } };
    }),
  };
}
