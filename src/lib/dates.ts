/** 'YYYY-MM-DD' in the phone's local time zone (log dates and birth dates use this format). */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Local midnight of a 'YYYY-MM-DD' string. */
export function fromDateString(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayString(): string {
  return toDateString(new Date());
}

/** Same day and month, `years` earlier (29 Feb falls back to 28 Feb). */
export function yearsBefore(date: string, years: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const target = new Date(y - years, m - 1, d);
  if (target.getMonth() !== m - 1) target.setDate(0); // rolled into March
  return toDateString(target);
}

/** The day `days` after `date` (negative goes back). Safe across DST and month ends. */
export function shiftDate(date: string, days: number): string {
  const d = fromDateString(date);
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

/** 'today' / 'yesterday' relative to `today`, otherwise null (show the full date). */
export function relativeDay(date: string, today: string): 'today' | 'yesterday' | null {
  if (date === today) return 'today';
  if (date === shiftDate(today, -1)) return 'yesterday';
  return null;
}
