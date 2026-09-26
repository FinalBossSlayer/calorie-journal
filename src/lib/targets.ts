/**
 * Daily targets from the profile (see CLAUDE.md "Targets").
 *
 * Pipeline: BMR (Mifflin-St Jeor) → TDEE (× activity) → ± goal adjustment
 * → safety floor → macros and limits derived from kcal → manual overrides.
 */
import type { ActivityLevel, Goal, Sex, TargetOverrides } from '@/db/schema';

import { NUTRIENTS, type Nutrient } from './nutrition';

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

export const GOAL_RATES_KG_PER_WEEK = [0.25, 0.5, 0.75, 1] as const;
export const MAX_RATE_KG_PER_WEEK = 1;
export const KCAL_PER_KG_BODY_FAT = 7700;

/** Never suggest a calorie target below this. */
export const MIN_KCAL: Record<Sex, number> = { male: 1500, female: 1200 };

export const DEFAULT_PROTEIN_G_PER_KG = 1.6;
const FAT_SHARE_OF_KCAL = 0.3;
const SUGAR_SHARE_OF_KCAL = 0.1;
const FIBER_G_PER_1000_KCAL = 14;
const SALT_LIMIT_G = 5;
const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9, sugar: 4 } as const;

/**
 * How a target should be read: reach it ('goal'), at least ('min'), at most ('max').
 * Drives UI wording like "at least 30 g fiber".
 */
export const TARGET_KIND: Record<Nutrient, 'goal' | 'min' | 'max'> = {
  kcal: 'goal',
  protein: 'goal',
  carbs: 'goal',
  fat: 'goal',
  fiber: 'min',
  sugar: 'max',
  salt: 'max',
};

/**
 * Sanity bounds for manual overrides (catches typos like 20000 kcal). The kcal
 * minimum is deliberately below the safety floor: going lower is allowed, with a warning.
 */
export const OVERRIDE_LIMITS: Record<Nutrient, { min: number; max: number }> = {
  kcal: { min: 800, max: 6000 },
  protein: { min: 0, max: 500 },
  carbs: { min: 0, max: 1000 },
  fat: { min: 0, max: 400 },
  fiber: { min: 0, max: 150 },
  sugar: { min: 0, max: 500 },
  salt: { min: 0, max: 20 },
};

export type Targets = Record<Nutrient, number>;

export type TargetInput = {
  sex: Sex;
  birthDate: string; // 'YYYY-MM-DD'
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  goalRateKgPerWeek: number;
};

export type TargetResult = {
  age: number;
  bmr: number;
  tdee: number;
  /** Signed kcal/day from the goal: negative to lose, positive to gain. */
  goalAdjustment: number;
  /** TDEE + goal adjustment, before the safety floor. */
  unclampedKcal: number;
  minKcal: number;
  /** True when the goal would go below the safety floor and was raised to it. */
  clamped: boolean;
  /** Suggested targets, without overrides. */
  calculated: Targets;
  /** What the app uses: overrides applied, derived values recomputed from them. */
  targets: Targets;
  overridden: Nutrient[];
  /** True when an overridden kcal target is below the safety floor. */
  belowFloor: boolean;
};

/** Full years between a 'YYYY-MM-DD' birth date and 'YYYY-MM-DD' today. */
export function ageOn(birthDate: string, today: string): number {
  const [by, bm, bd] = parseDate(birthDate);
  const [ty, tm, td] = parseDate(today);
  const hadBirthday = tm > bm || (tm === bm && td >= bd);
  return ty - by - (hadBirthday ? 0 : 1);
}

/** Mifflin-St Jeor basal metabolic rate, kcal/day. */
export function bmr(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

/** Rate is capped at MAX_RATE_KG_PER_WEEK and ignored for 'maintain'. */
export function goalAdjustment(goal: Goal, rateKgPerWeek: number): number {
  if (goal === 'maintain') return 0;
  const rate = Math.min(Math.max(Math.abs(rateKgPerWeek), 0), MAX_RATE_KG_PER_WEEK);
  const perDay = (rate * KCAL_PER_KG_BODY_FAT) / 7;
  return goal === 'lose' ? -perDay : perDay;
}

export function computeTargets(
  input: TargetInput,
  today: string,
  overrides: TargetOverrides | null = null,
): TargetResult {
  const age = ageOn(input.birthDate, today);
  const base = bmr(input.sex, input.weightKg, input.heightCm, age);
  const tdee = base * ACTIVITY_FACTORS[input.activityLevel];
  const adjustment = goalAdjustment(input.goal, input.goalRateKgPerWeek);
  const unclampedKcal = tdee + adjustment;
  const minKcal = MIN_KCAL[input.sex];
  const clamped = unclampedKcal < minKcal;
  const kcal = Math.round(clamped ? minKcal : unclampedKcal);

  const valid = sanitizeOverrides(overrides);
  const calculated = deriveTargets(kcal, input.weightKg, {});
  const targets = deriveTargets(valid.kcal ?? kcal, input.weightKg, valid);

  return {
    age,
    bmr: base,
    tdee,
    goalAdjustment: adjustment,
    unclampedKcal,
    minKcal,
    clamped,
    calculated,
    targets,
    overridden: NUTRIENTS.filter((n) => valid[n] !== undefined),
    belowFloor: targets.kcal < minKcal,
  };
}

/**
 * Everything except kcal is derived from kcal and body weight. An override wins
 * for its own nutrient and feeds into the ones derived from it (e.g. overriding
 * protein changes the carb remainder).
 */
function deriveTargets(kcal: number, weightKg: number, o: TargetOverrides): Targets {
  const protein = o.protein ?? weightKg * DEFAULT_PROTEIN_G_PER_KG;
  const fat = o.fat ?? (kcal * FAT_SHARE_OF_KCAL) / KCAL_PER_G.fat;
  const carbsKcal = kcal - protein * KCAL_PER_G.protein - fat * KCAL_PER_G.fat;
  const carbs = o.carbs ?? Math.max(0, carbsKcal / KCAL_PER_G.carbs);

  return {
    kcal: Math.round(kcal),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    fiber: o.fiber ?? Math.round((kcal / 1000) * FIBER_G_PER_1000_KCAL),
    sugar: o.sugar ?? Math.round((kcal * SUGAR_SHARE_OF_KCAL) / KCAL_PER_G.sugar),
    salt: o.salt ?? SALT_LIMIT_G,
  };
}

/** Overrides without `nutrient`; null when nothing is left (stored as NULL). */
export function removeOverride(overrides: TargetOverrides | null, nutrient: Nutrient): TargetOverrides | null {
  const rest = { ...overrides };
  delete rest[nutrient];
  return Object.keys(rest).length > 0 ? rest : null;
}

/** Drops overrides that aren't finite, non-negative numbers (stored JSON is untrusted). */
function sanitizeOverrides(overrides: TargetOverrides | null): TargetOverrides {
  const out: TargetOverrides = {};
  if (!overrides) return out;
  for (const n of NUTRIENTS) {
    const v = overrides[n];
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) out[n] = v;
  }
  return out;
}

function parseDate(date: string): [number, number, number] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) throw new Error(`Invalid date, expected YYYY-MM-DD: ${date}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}
