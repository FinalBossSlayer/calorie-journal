import { z } from 'zod';

import {
  cleanName,
  CUSTOM_FOOD_KINDS,
  type CustomFoodKind,
  MAX_NAME_LENGTH,
  NUTRIENT_MAX_PER_100G,
  nutrientProblems,
} from '@/lib/customFood';
import { MAX_ENTRY_GRAMS } from '@/lib/logging';
import { emptyNutrients, type Nutrient, NUTRIENTS } from '@/lib/nutrition';
import { parseDecimal } from '@/lib/numbers';
import type { EditedPortion } from '@/lib/portions';

export const MAX_PORTION_NAME_LENGTH = 40;

/**
 * Error messages are keys, not text: each field shows its own translated message.
 * 'required' and 'range' on any field, 'macroSum' on fat, 'sugarOverCarbs' on sugar.
 */
export type CustomFoodError = 'required' | 'range' | 'macroSum' | 'sugarOverCarbs';

export type PortionInput = {
  /** null for a portion added in this form. */
  portionId: string | null;
  name: string;
  grams: string;
  /** See EditedPortion.copiedNames. */
  copiedNames?: { nameMk: string | null; nameEn: string | null };
};

/** What the form holds while editing (numbers are still text; empty = unknown). */
export type CustomFoodInput = {
  nameMk: string;
  nameEn: string;
  kind: CustomFoodKind;
  nutrients: Record<Nutrient, string>;
  portions: PortionInput[];
};

export function emptyPortion(): PortionInput {
  return { portionId: null, name: '', grams: '' };
}

/** Both name fields → names to save. At least one is required (issue on nameMk). */
export function parseNames(input: { nameMk: string; nameEn: string }, ctx: z.RefinementCtx) {
  const nameMk = cleanName(input.nameMk);
  const nameEn = cleanName(input.nameEn);
  if (nameMk === null && nameEn === null) {
    ctx.addIssue({ code: 'custom', path: ['nameMk'], message: 'required' });
  }
  for (const [key, name] of [['nameMk', nameMk], ['nameEn', nameEn]] as const) {
    if (name && name.length > MAX_NAME_LENGTH) ctx.addIssue({ code: 'custom', path: [key], message: 'range' });
  }
  return { nameMk, nameEn };
}

/** Portion rows → portions to save. Rows left completely empty are ignored. */
export function parsePortions(portions: readonly PortionInput[], ctx: z.RefinementCtx): EditedPortion[] {
  const out: EditedPortion[] = [];
  portions.forEach((p, i) => {
    if (p.name.trim() === '' && p.grams.trim() === '') return;
    const name = cleanName(p.name);
    if (name === null || name.length > MAX_PORTION_NAME_LENGTH) {
      ctx.addIssue({ code: 'custom', path: ['portions', i, 'name'], message: 'required' });
    }
    const grams = parseDecimal(p.grams);
    if (grams === null || grams <= 0 || grams > MAX_ENTRY_GRAMS) {
      ctx.addIssue({ code: 'custom', path: ['portions', i, 'grams'], message: 'range' });
    }
    if (name !== null && grams !== null) out.push({ portionId: p.portionId, name, grams, copiedNames: p.copiedNames });
  });
  return out;
}

/** Zod schema for the portion rows (shared with recipes). */
export const portionsInput = z.array(
  z.object({
    portionId: z.string().nullable(),
    name: z.string(),
    grams: z.string(),
    copiedNames: z.object({ nameMk: z.string().nullable(), nameEn: z.string().nullable() }).optional(),
  }),
);

const nutrientsInput = z.object(
  Object.fromEntries(NUTRIENTS.map((n) => [n, z.string()])) as Record<Nutrient, z.ZodString>,
);

export const customFoodSchema = z
  .object({
    nameMk: z.string(),
    nameEn: z.string(),
    kind: z.enum(CUSTOM_FOOD_KINDS),
    nutrients: nutrientsInput,
    portions: portionsInput,
  })
  .transform((input, ctx) => {
    const { nameMk, nameEn } = parseNames(input, ctx);

    const nutrients = emptyNutrients();
    for (const n of NUTRIENTS) {
      const text = input.nutrients[n].trim();
      if (text === '') {
        if (n === 'kcal') ctx.addIssue({ code: 'custom', path: ['nutrients', n], message: 'required' });
        continue;
      }
      const value = parseDecimal(text);
      if (value === null || value < 0 || value > NUTRIENT_MAX_PER_100G[n]) {
        ctx.addIssue({ code: 'custom', path: ['nutrients', n], message: 'range' });
        continue;
      }
      nutrients[n] = value;
    }
    for (const problem of nutrientProblems(nutrients)) {
      const field = problem === 'macroSum' ? 'fat' : 'sugar';
      ctx.addIssue({ code: 'custom', path: ['nutrients', field], message: problem });
    }

    const portions = parsePortions(input.portions, ctx);
    return { nameMk, nameEn, kind: input.kind, nutrients, portions };
  });

/** Validated values, ready to save. */
export type CustomFoodValues = z.output<typeof customFoodSchema>;
