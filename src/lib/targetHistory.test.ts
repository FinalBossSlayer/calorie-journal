import { planTargetHistoryWrite, targetsForDate, type TargetHistoryRow } from './targetHistory';
import type { Targets } from './targets';

const t = (kcal: number): Targets => ({ kcal, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, salt: 0 });
const row = (id: string, effectiveDate: string, kcal: number): TargetHistoryRow => ({ id, effectiveDate, targets: t(kcal) });

/** Applies planned writes like the database does, for end-to-end checks. */
function apply(history: TargetHistoryRow[], today: string, kcal: number, firstDate = today): TargetHistoryRow[] {
  let rows = [...history];
  for (const w of planTargetHistoryWrite(rows, today, t(kcal), firstDate)) {
    if (w.kind === 'redate') {
      rows = rows.map((r) => (r.id === w.id ? { ...r, effectiveDate: w.effectiveDate } : r));
    } else {
      const existing = rows.find((r) => r.effectiveDate === w.effectiveDate);
      rows = existing
        ? rows.map((r) => (r === existing ? { ...r, targets: w.targets } : r))
        : [...rows, { id: `row${rows.length}`, effectiveDate: w.effectiveDate, targets: w.targets }];
    }
  }
  return rows;
}

describe('targetsForDate', () => {
  const history = [row('b', '2026-09-10', 2200), row('a', '2026-09-01', 2500), row('c', '2026-09-20', 2000)];

  it('uses the latest targets starting on or before the date', () => {
    expect(targetsForDate(history, '2026-09-15')?.kcal).toBe(2200);
    expect(targetsForDate(history, '2026-09-20')?.kcal).toBe(2000);
    expect(targetsForDate(history, '2026-09-26')?.kcal).toBe(2000);
  });

  it('falls back to the earliest targets for days before the history starts', () => {
    expect(targetsForDate(history, '2026-08-01')?.kcal).toBe(2500);
  });

  it('returns null without history', () => {
    expect(targetsForDate([], '2026-09-26')).toBeNull();
  });
});

describe('planTargetHistoryWrite', () => {
  const today = '2026-09-26';

  it('starts the history on the profile creation day', () => {
    expect(planTargetHistoryWrite([], today, t(2000), '2026-09-01')).toEqual([
      { kind: 'upsert', effectiveDate: '2026-09-01', targets: t(2000) },
    ]);
  });

  it('writes nothing when the targets did not change', () => {
    expect(planTargetHistoryWrite([row('a', '2026-09-01', 2000)], today, t(2000), '2026-09-01')).toEqual([]);
  });

  it('adds a row for today when targets change on a later day', () => {
    const rows = apply([row('a', '2026-09-01', 2500)], today, 2000);
    expect(targetsForDate(rows, '2026-09-25')?.kcal).toBe(2500);
    expect(targetsForDate(rows, today)?.kcal).toBe(2000);
  });

  it('keeps the old targets for earlier days when the profile was created today', () => {
    // Bug seen on the phone: onboarding and the edit on the same day lost the old targets.
    let rows = apply([], today, 2500);
    rows = apply(rows, today, 2000);
    expect(targetsForDate(rows, '2026-09-25')?.kcal).toBe(2500);
    expect(targetsForDate(rows, '2026-09-01')?.kcal).toBe(2500);
    expect(targetsForDate(rows, today)?.kcal).toBe(2000);
  });

  it('overwrites today on repeated same-day saves without touching earlier days', () => {
    let rows = apply([], today, 2500);
    rows = apply(rows, today, 2000);
    rows = apply(rows, today, 1800);
    expect(rows).toHaveLength(2);
    expect(targetsForDate(rows, '2026-09-25')?.kcal).toBe(2500);
    expect(targetsForDate(rows, today)?.kcal).toBe(1800);
  });

  it('ignores rows dated in the future (phone clock moved back)', () => {
    const rows = apply([row('a', '2026-09-01', 2500), row('f', '2026-10-01', 2200)], today, 2000);
    expect(targetsForDate(rows, today)?.kcal).toBe(2000);
    expect(targetsForDate(rows, '2026-09-25')?.kcal).toBe(2500);
  });
});
