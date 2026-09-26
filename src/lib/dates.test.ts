import { fromDateString, toDateString, yearsBefore } from './dates';

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
