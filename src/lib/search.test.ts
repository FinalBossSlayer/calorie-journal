import { buildSearch, recentCutoff } from './search';

const match = (text: string) => buildSearch(text)?.match ?? null;

describe('buildSearch', () => {
  it('makes every word a prefix term', () => {
    expect(match('tavc gra')).toBe('"tavc"* "gra"*');
  });

  it('normalises Cyrillic and diacritics like stored names', () => {
    expect(match('Тавче')).toBe('"tavce"*');
    expect(match('tavče')).toBe('"tavce"*');
    expect(match('tavche')).toBe('"tavce"*');
  });

  it('drops punctuation that would be FTS5 syntax', () => {
    expect(match('"burek" OR -(sir)*')).toBe('"burek"* "or"* "sir"*');
  });

  it('returns null when nothing is searchable', () => {
    expect(buildSearch('')).toBeNull();
    expect(buildSearch('  ,.- ')).toBeNull();
  });

  it('needs at least two characters', () => {
    expect(buildSearch('м')).toBeNull();
    expect(buildSearch('ш')).toBeNull(); // one letter, one character
    expect(buildSearch('џ')?.match).toBe('"dz"*'); // one letter, two characters
  });

  it('builds a starts-with pattern from the whole query', () => {
    expect(buildSearch('Тавче гр')?.startsWith).toBe('tavce gr%');
  });
});

describe('recentCutoff', () => {
  it('is 30 days before now', () => {
    expect(recentCutoff(Date.UTC(2026, 8, 26))).toBe(Date.UTC(2026, 7, 27));
  });
});
