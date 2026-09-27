/**
 * Math for the History tab: month grids, weeks, and how each day went against
 * its calorie target. UI-free so it can be unit tested.
 *
 * Weeks start on Monday (the norm in both North Macedonia and en-GB).
 */
import { fromDateString, shiftDate, toDateString } from './dates';
import { nutrientProgress } from './day';

/** One day's calorie total, as read from the log. */
export interface DayTotal {
  date: string;
  /** Sum of known kcal; null when every entry that day has unknown kcal. */
  kcal: number | null;
  /** True when some entries have unknown kcal, so the total is a lower bound. */
  incomplete: boolean;
}

/** A row from the per-day SQL aggregate (see src/db/queries/history.ts). */
export interface DayTotalRow {
  date: string;
  kcalSum: number | null;
  entryCount: number;
  knownKcalCount: number;
  /** Entries whose own kcal snapshot is already a lower bound (e.g. an incomplete recipe). */
  incompleteKcalCount: number;
}

export function toDayTotal(row: DayTotalRow): DayTotal {
  const known = row.knownKcalCount > 0;
  return {
    date: row.date,
    kcal: known ? (row.kcalSum ?? 0) : null,
    incomplete: known && (row.knownKcalCount < row.entryCount || row.incompleteKcalCount > 0),
  };
}

/**
 * - none: nothing logged
 * - unknown: food logged, but no kcal known
 * - ok: at or under the target
 * - over: past the target
 */
export type DayStatus = 'none' | 'unknown' | 'ok' | 'over';

export function dayStatus(total: DayTotal | undefined, targetKcal: number): DayStatus {
  if (!total) return 'none';
  if (total.kcal === null) return 'unknown';
  return nutrientProgress('kcal', total.kcal, targetKcal).over ? 'over' : 'ok';
}

/** 'YYYY-MM' of a 'YYYY-MM-DD' date. */
export function monthOf(date: string): string {
  return date.slice(0, 7);
}

/** The month `months` after `month` ('YYYY-MM'; negative goes back). */
export function shiftMonth(month: string, months: number): string {
  const [y, m] = month.split('-').map(Number);
  return toDateString(new Date(y, m - 1 + months, 1)).slice(0, 7);
}

/** The Monday on or before `date`. */
export function startOfWeek(date: string): string {
  const weekday = fromDateString(date).getDay(); // 0 = Sunday
  return shiftDate(date, -((weekday + 6) % 7));
}

/** The 7 days of the week starting on `monday`. */
export function weekDates(monday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => shiftDate(monday, i));
}

/**
 * The calendar grid for a month: full Monday–Sunday weeks, padded with days
 * from the months either side (check `monthOf(date) === month` to dim them).
 */
export function monthGrid(month: string): string[][] {
  const weeks: string[][] = [];
  // The first week may start in the previous month; every later one starts inside this month.
  let monday = startOfWeek(`${month}-01`);
  do {
    weeks.push(weekDates(monday));
    monday = shiftDate(monday, 7);
  } while (monthOf(monday) === month);
  return weeks;
}

/** First and last day of the grid, for the database query. */
export function gridRange(weeks: readonly string[][]): { from: string; to: string } {
  return { from: weeks[0][0], to: weeks[weeks.length - 1][6] };
}

export interface WeekBar {
  date: string;
  kcal: number | null;
  status: DayStatus;
}

export interface WeekSummary {
  bars: WeekBar[];
  /** Average kcal over the days with a known total; null if there are none. */
  average: number | null;
  /** True when any of the averaged days is a lower bound. */
  averageIncomplete: boolean;
}

export function weekSummary(
  monday: string,
  totals: ReadonlyMap<string, DayTotal>,
  targetKcalFor: (date: string) => number,
): WeekSummary {
  const bars = weekDates(monday).map((date) => {
    const total = totals.get(date);
    return { date, kcal: total?.kcal ?? null, status: dayStatus(total, targetKcalFor(date)) };
  });

  const counted = bars.map((b) => totals.get(b.date)).filter((t): t is DayTotal => t?.kcal != null);
  const sum = counted.reduce((acc, t) => acc + (t.kcal ?? 0), 0);
  return {
    bars,
    average: counted.length > 0 ? sum / counted.length : null,
    averageIncomplete: counted.some((t) => t.incomplete),
  };
}

/**
 * Top of the weekly chart's y-axis: room above the tallest bar and the target
 * line, rounded so that each of the 4 sections is a multiple of 250 kcal.
 */
export function chartMax(bars: readonly WeekBar[], targetKcal: number): number {
  const highest = Math.max(targetKcal, ...bars.map((b) => b.kcal ?? 0));
  const section = Math.max(Math.ceil((highest * 1.1) / 4 / 250) * 250, 250);
  return section * 4;
}
