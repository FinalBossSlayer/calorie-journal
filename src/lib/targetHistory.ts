/**
 * Target history: which daily targets applied on which day, so past days are
 * judged against the targets of that time.
 *
 * A row means "these targets from effectiveDate on". The earliest row also
 * covers every day before it (days logged before the history existed).
 */
import { shiftDate } from './dates';
import { NUTRIENTS } from './nutrition';
import type { Targets } from './targets';

export interface TargetHistoryRow {
  id: string;
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

export type TargetHistoryWrite =
  /** Insert a row for this date, or overwrite the targets of the row already there. */
  | { kind: 'upsert'; effectiveDate: string; targets: Targets }
  /** Move an existing row to another date (it keeps its targets). */
  | { kind: 'redate'; id: string; effectiveDate: string };

function sameTargets(a: Targets, b: Targets): boolean {
  return NUTRIENTS.every((n) => a[n] === b[n]);
}

/**
 * What to write so that `targets` apply from `today` on while every earlier day
 * keeps the targets it had. Apply the writes in order.
 *
 * @param firstDate where the very first row starts (the profile's creation day).
 */
export function planTargetHistoryWrite(
  history: readonly TargetHistoryRow[],
  today: string,
  targets: Targets,
  firstDate: string,
): TargetHistoryWrite[] {
  const past = history.filter((r) => r.effectiveDate <= today);
  if (past.length === 0) {
    const effectiveDate = firstDate < today ? firstDate : today;
    return [{ kind: 'upsert', effectiveDate, targets }];
  }

  const current = past.reduce((a, b) => (b.effectiveDate > a.effectiveDate ? b : a));
  if (sameTargets(current.targets, targets)) return [];

  // Same-day re-save: overwriting today's row is right, unless that row is also
  // the one covering all earlier days — then keep it for them by moving it back a day.
  const coversEarlierDays = current.effectiveDate === today && past.length === 1;
  return coversEarlierDays
    ? [
        { kind: 'redate', id: current.id, effectiveDate: shiftDate(today, -1) },
        { kind: 'upsert', effectiveDate: today, targets },
      ]
    : [{ kind: 'upsert', effectiveDate: today, targets }];
}
