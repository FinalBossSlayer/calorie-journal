import type { Href } from 'expo-router';

/** The id in the URL when creating a recipe. */
export const NEW_RECIPE_ID = 'new';

export function recipeHref(id: string = NEW_RECIPE_ID): Href {
  return { pathname: '/recipe/[id]', params: { id } };
}

/** "Make my version": a new recipe pre-filled from a seed dish. */
export function myVersionHref(seedDishId: string): Href {
  return { pathname: '/recipe/[id]', params: { id: NEW_RECIPE_ID, from: seedDishId } };
}

/** The ingredient search. `recipeId` (when editing) is left out of the results. */
export function addIngredientHref(recipeId: string | null): Href {
  return { pathname: '/recipe/add-ingredient', params: recipeId ? { exclude: recipeId } : {} };
}
