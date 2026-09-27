import {
  chartMax,
  type DayTotal,
  dayStatus,
  gridRange,
  monthGrid,
  shiftMonth,
  startOfWeek,
  toDayTotal,
  weekDates,
  weekSummary,
} from './history';

const row = { date: '2026-09-21', kcalSum: 1800, entryCount: 3, knownKcalCount: 3, incompleteKcalCount: 0 };

describe('toDayTotal', () => {
  it('uses the sum when every entry is known', () => {
    expect(toDayTotal(row)).toEqual({ date: '2026-09-21', kcal: 1800, incomplete: false });
  });

  it('marks a lower bound when some entries are unknown', () => {
    expect(toDayTotal({ ...row, knownKcalCount: 2 }).incomplete).toBe(true);
  });

  it('marks a lower bound when an entry was already incomplete', () => {
    expect(toDayTotal({ ...row, incompleteKcalCount: 1 }).incomplete).toBe(true);
  });

  it('is unknown, not 0, when no entry has kcal', () => {
    expect(toDayTotal({ ...row, kcalSum: null, knownKcalCount: 0 })).toEqual({
      date: '2026-09-21',
      kcal: null,
      incomplete: false,
    });
  });
});

describe('dayStatus', () => {
  const total = (kcal: number | null): DayTotal => ({ date: '2026-09-21', kcal, incomplete: false });

  it('tells empty, unknown, ok and over days apart', () => {
    expect(dayStatus(undefined, 2000)).toBe('none');
    expect(dayStatus(total(null), 2000)).toBe('unknown');
    expect(dayStatus(total(2000), 2000)).toBe('ok');
    expect(dayStatus(total(2001), 2000)).toBe('over');
  });
});

describe('shiftMonth', () => {
  it('crosses year ends both ways', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-09', 0)).toBe('2026-09');
  });
});

describe('startOfWeek', () => {
  it('goes back to Monday', () => {
    expect(startOfWeek('2026-09-27')).toBe('2026-09-21'); // Sunday
    expect(startOfWeek('2026-09-21')).toBe('2026-09-21'); // Monday
    expect(startOfWeek('2026-10-01')).toBe('2026-09-28'); // Thursday, across a month end
  });
});

describe('monthGrid', () => {
  it('pads September 2026 to full Monday–Sunday weeks', () => {
    const weeks = monthGrid('2026-09');
    expect(weeks).toHaveLength(5);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(gridRange(weeks)).toEqual({ from: '2026-08-31', to: '2026-10-04' });
  });

  it('needs no padding before a month that starts on Monday', () => {
    expect(monthGrid('2026-06')[0][0]).toBe('2026-06-01');
  });

  it('fits February 2027 (starts Monday, 28 days) in four weeks', () => {
    expect(gridRange(monthGrid('2027-02'))).toEqual({ from: '2027-02-01', to: '2027-02-28' });
  });

  it('uses six weeks when the month needs them', () => {
    // August 2026 starts on Saturday and has 31 days.
    const weeks = monthGrid('2026-08');
    expect(weeks).toHaveLength(6);
    expect(gridRange(weeks)).toEqual({ from: '2026-07-27', to: '2026-09-06' });
  });
});

describe('weekSummary', () => {
  const monday = '2026-09-21';
  const totals = new Map<string, DayTotal>([
    ['2026-09-21', { date: '2026-09-21', kcal: 1800, incomplete: false }],
    ['2026-09-22', { date: '2026-09-22', kcal: 2400, incomplete: true }],
    ['2026-09-23', { date: '2026-09-23', kcal: null, incomplete: false }],
  ]);

  it('builds a bar per day with its status', () => {
    const { bars } = weekSummary(monday, totals, () => 2000);
    expect(bars.map((b) => b.date)).toEqual(weekDates(monday));
    expect(bars.map((b) => b.status)).toEqual(['ok', 'over', 'unknown', 'none', 'none', 'none', 'none']);
  });

  it('judges each day against its own target', () => {
    const { bars } = weekSummary(monday, totals, (d) => (d === '2026-09-22' ? 2500 : 2000));
    expect(bars[1].status).toBe('ok');
  });

  it('averages only days with a known total', () => {
    const summary = weekSummary(monday, totals, () => 2000);
    expect(summary.average).toBe(2100);
    expect(summary.averageIncomplete).toBe(true);
  });

  it('has no average for an empty week', () => {
    expect(weekSummary(monday, new Map(), () => 2000)).toMatchObject({ average: null, averageIncomplete: false });
  });
});

describe('chartMax', () => {
  const bar = (kcal: number | null) => ({ date: '2026-09-21', kcal, status: 'ok' as const });

  it('leaves room above the target and splits into 250 kcal steps', () => {
    expect(chartMax([bar(1500)], 2000)).toBe(3000); // 2200 → 4 × 750
  });

  it('follows a bar above the target', () => {
    expect(chartMax([bar(3400), bar(null)], 2000)).toBe(4000); // 3740 → 4 × 1000
  });

  it('never collapses to zero', () => {
    expect(chartMax([], 0)).toBe(1000);
  });
});
