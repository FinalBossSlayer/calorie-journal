/**
 * Math for one day in the journal: totals, per-meal grouping and progress
 * against targets. UI-free so it can be unit tested.
 */
import type { RingMode } from '@/db/schema';

import { NUTRIENTS, type Nutrient, type NutrientValues } from './nutrition';
import { TARGET_KIND, type Targets } from './targets';

/** A logged amount: its nutrient snapshot plus which values are lower bounds. */
export type NutrientSnapshot = NutrientValues & {
  incompleteNutrients?: readonly Nutrient[] | null;
};

export interface NutrientTotals {
  values: NutrientValues;
  /**
   * Nutrients whose total is a lower bound: some entries are unknown (or were
   * already incomplete). If every entry is unknown the value is null instead.
   */
  incomplete: Nutrient[];
}

/**
 * Sums snapshots. An empty list is a known 0 (nothing eaten); null entries are
 * skipped but mark the total incomplete, so unknown is never shown as 0.
 */
export function sumNutrients(entries: readonly NutrientSnapshot[]): NutrientTotals {
  const values = {} as NutrientValues;
  const incomplete: Nutrient[] = [];

  for (const n of NUTRIENTS) {
    let sum = 0;
    let known = 0;
    let partial = false;
    for (const e of entries) {
      const v = e[n];
      if (v === null) {
        partial = true;
      } else {
        sum += v;
        known += 1;
        if (e.incompleteNutrients?.includes(n)) partial = true;
      }
    }
    if (entries.length > 0 && known === 0) {
      values[n] = null;
    } else {
      values[n] = sum;
      if (partial) incomplete.push(n);
    }
  }
  return { values, incomplete };
}

export interface MealInfo {
  id: string;
  sortOrder: number;
  isHidden: boolean;
}

export interface MealGroup<M extends MealInfo, E> {
  meal: M;
  entries: E[];
  totals: NutrientTotals;
}

/**
 * Entries grouped under their meals, in meal sort order. Hidden meals are shown
 * only when they have entries that day, so nothing logged ever disappears.
 */
export function groupByMeal<M extends MealInfo, E extends NutrientSnapshot & { mealId: string }>(
  meals: readonly M[],
  entries: readonly E[],
): MealGroup<M, E>[] {
  const byMeal = new Map<string, E[]>();
  for (const e of entries) {
    const list = byMeal.get(e.mealId);
    if (list) list.push(e);
    else byMeal.set(e.mealId, [e]);
  }

  return [...meals]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((m) => !m.isHidden || byMeal.has(m.id))
    .map((meal) => {
      const list = byMeal.get(meal.id) ?? [];
      return { meal, entries: list, totals: sumNutrients(list) };
    });
}

export interface NutrientProgress {
  /** Share of the target reached, clamped to 0..1 for bars and rings. */
  fraction: number;
  /** True when past a limit that shouldn't be exceeded (kcal and max-type targets). */
  over: boolean;
}

/** Nutrients where going past the target is a problem, not just "done". */
function hasLimit(nutrient: Nutrient): boolean {
  return nutrient === 'kcal' || TARGET_KIND[nutrient] === 'max';
}

export function nutrientProgress(nutrient: Nutrient, value: number | null, target: number): NutrientProgress {
  if (value === null || target <= 0) {
    return { fraction: 0, over: value !== null && value > 0 && target <= 0 && hasLimit(nutrient) };
  }
  return {
    fraction: Math.min(Math.max(value / target, 0), 1),
    over: hasLimit(nutrient) && value > target,
  };
}

export interface RingValues extends NutrientProgress {
  /** Big number in the middle: kcal eaten, kcal left, or kcal over. null → "—". */
  value: number | null;
  /** Which label goes under the number. 'over' replaces 'left' once past the target. */
  label: 'eaten' | 'left' | 'over';
}

export function ringValues(eatenKcal: number | null, targetKcal: number, mode: RingMode): RingValues {
  const progress = nutrientProgress('kcal', eatenKcal, targetKcal);
  if (mode === 'eaten' || eatenKcal === null) {
    return { ...progress, value: mode === 'eaten' ? eatenKcal : null, label: mode };
  }
  const left = targetKcal - eatenKcal;
  return left < 0
    ? { ...progress, value: -left, label: 'over' }
    : { ...progress, value: left, label: 'left' };
}

export interface TargetHistoryRow {
  /** 'YYYY-MM-DD': the first day these targets applied. */
  effectiveDate: string;
  targets: Targets;
}

/**
 * Targets in effect on `date`: the latest row starting on or before it. Days
 * before the first row use the first row (the earliest targets we know).
 * Returns null when there is no history at all.
 */
export function targetsForDate(history: readonly TargetHistoryRow[], date: string): Targets | null {
  let best: TargetHistoryRow | null = null;
  let earliest: TargetHistoryRow | null = null;
  for (const row of history) {
    // 'YYYY-MM-DD' strings compare correctly as plain strings.
    if (row.effectiveDate <= date && (!best || row.effectiveDate > best.effectiveDate)) best = row;
    if (!earliest || row.effectiveDate < earliest.effectiveDate) earliest = row;
  }
  return (best ?? earliest)?.targets ?? null;
}
