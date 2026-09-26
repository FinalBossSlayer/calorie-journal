import type { TFunction } from 'i18next';

import type { FOOD_SOURCES } from '@/db/schema';

/** "Macedonian dish · estimate": where a food comes from, for search rows and the food header. */
export function foodTags(
  t: TFunction,
  // isEstimate is 0/1 from raw SQL, boolean from Drizzle.
  food: { source: (typeof FOOD_SOURCES)[number]; isEstimate: boolean | number },
): string {
  const tags = [t(`search.source.${food.source}`)];
  if (food.isEstimate) tags.push(t('search.estimate'));
  return tags.join(' · ');
}
