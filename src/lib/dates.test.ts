import { fromDateString, relativeDay, shiftDate, toDateString, yearsBefore } from './dates';

describe('toDateString', () => {
  it('uses local date parts, zero-padded', () => {
    expect(toDateString(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('fromDateString', () => {
  it('round-trips through toDateString', () => {
    expect(toDateString(fromDateString('1996-02-29'))).toBe('1996-02-29');
  });
});

describe('yearsBefore', () => {
  it('keeps day and month', () => {
    expect(yearsBefore('2026-09-25', 30)).toBe('1996-09-25');
  });

  it('maps 29 Feb to 28 Feb in a non-leap year', () => {
    expect(yearsBefore('2024-02-29', 1)).toBe('2023-02-28');
  });
});

describe('shiftDate', () => {
  it('crosses month and year ends', () => {
    expect(shiftDate('2026-03-31', 1)).toBe('2026-04-01');
    expect(shiftDate('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('handles leap days', () => {
    expect(shiftDate('2024-02-28', 1)).toBe('2024-02-29');
    expect(shiftDate('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('relativeDay', () => {
  it('names today and yesterday, nothing else', () => {
    expect(relativeDay('2026-09-26', '2026-09-26')).toBe('today');
    expect(relativeDay('2026-09-25', '2026-09-26')).toBe('yesterday');
    expect(relativeDay('2026-09-24', '2026-09-26')).toBeNull();
    expect(relativeDay('2026-09-27', '2026-09-26')).toBeNull();
  });
});
