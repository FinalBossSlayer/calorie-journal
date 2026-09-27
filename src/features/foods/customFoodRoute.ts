import type { Href } from 'expo-router';

/** The id in the URL when creating a food. */
export const NEW_FOOD_ID = 'new';

/** Route to create a food, optionally prefilled with a name and a meal to log it to afterwards. */
export function newCustomFoodHref(name?: string, meal?: string): Href {
  const params: { id: string; name?: string; meal?: string } = { id: NEW_FOOD_ID };
  if (name?.trim()) params.name = name.trim();
  if (meal) params.meal = meal;
  return { pathname: '/custom-food/[id]', params };
}
