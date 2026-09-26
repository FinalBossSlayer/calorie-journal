import { z } from 'zod';

import { ACTIVITY_LEVELS, GOALS, LANGUAGES, SEXES } from '@/db/schema';
import { todayString } from '@/lib/dates';
import { parseDecimal } from '@/lib/numbers';
import { ageOn } from '@/lib/targets';

export const HEIGHT_RANGE_CM = { min: 100, max: 250 } as const;
export const WEIGHT_RANGE_KG = { min: 30, max: 300 } as const;
// Mifflin-St Jeor and the safety floors are meant for adults and older teens.
export const AGE_RANGE = { min: 16, max: 100 } as const;

/** Text input → number (see parseDecimal). */
function decimalInRange(range: { min: number; max: number }) {
  return z
    .string()
    .transform((s) => parseDecimal(s) ?? Number.NaN)
    .pipe(z.number().min(range.min).max(range.max));
}

/**
 * Onboarding and "Edit profile" form. Error messages are not set here: each
 * field shows its own translated message.
 */
export const profileFormSchema = z
  .object({
    language: z.enum(LANGUAGES),
    sex: z.enum(SEXES),
    birthDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((d) => {
        const age = ageOn(d, todayString());
        return age >= AGE_RANGE.min && age <= AGE_RANGE.max;
      }),
    heightCm: decimalInRange(HEIGHT_RANGE_CM),
    weightKg: decimalInRange(WEIGHT_RANGE_KG),
    activityLevel: z.enum(ACTIVITY_LEVELS),
    goal: z.enum(GOALS),
    goalRateKgPerWeek: z.number().min(0).max(1),
  })
  .transform((v) => ({ ...v, goalRateKgPerWeek: v.goal === 'maintain' ? 0 : v.goalRateKgPerWeek }));

/** What the form holds while editing (numbers are still text). */
export type ProfileFormInput = z.input<typeof profileFormSchema>;
/** Validated values, ready to save. */
export type ProfileFormValues = z.output<typeof profileFormSchema>;
export type ProfileField = keyof ProfileFormInput;
