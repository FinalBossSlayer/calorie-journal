import { z } from 'zod';

import type { Portion } from '@/db/queries/foods';
import { resolveAmount } from '@/lib/logging';
import { parseDecimal } from '@/lib/numbers';

/** `unit` value for "typed in grams". Portion ids are UUIDs, so this can't clash. */
export const GRAMS_UNIT = 'grams';

export type LogFormInput = {
  /** GRAMS_UNIT or a portion id. */
  unit: string;
  /** Grams, or number of portions. Text as typed (decimal comma allowed). */
  amount: string;
  mealId: string;
};

export function portionFor(unit: string, portions: readonly Portion[]): Portion | null {
  return unit === GRAMS_UNIT ? null : (portions.find((p) => p.id === unit) ?? null);
}

/** Parsed amount for the current input, or null while it isn't valid (used for the live preview too). */
export function amountFromInput(input: Pick<LogFormInput, 'unit' | 'amount'>, portions: readonly Portion[]) {
  return resolveAmount(parseDecimal(input.amount), portionFor(input.unit, portions));
}

/** Validates the log form and resolves it to what gets saved. The error text lives in the form. */
export function logFormSchema(portions: readonly Portion[]) {
  return z
    .object({ unit: z.string(), amount: z.string(), mealId: z.string().min(1) })
    .transform((input, ctx) => {
      const amount = amountFromInput(input, portions);
      if (!amount) {
        ctx.addIssue({ code: 'custom', path: ['amount'], message: 'invalid' });
        return z.NEVER;
      }
      return { mealId: input.mealId, ...amount };
    });
}

export type LogFormValues = z.output<ReturnType<typeof logFormSchema>>;
