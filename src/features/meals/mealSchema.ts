import { z } from 'zod';

import { parseNames } from '@/features/foods/customFoodSchema';
import { fillMealNames } from '@/lib/meals';

export type MealFormInput = { nameMk: string; nameEn: string };

/** Same name rules as foods (one language is enough); the other name is filled in. */
export const mealFormSchema = z
  .object({ nameMk: z.string(), nameEn: z.string() })
  .transform((input, ctx) => fillMealNames(parseNames(input, ctx)));

export type MealFormValues = z.output<typeof mealFormSchema>;
