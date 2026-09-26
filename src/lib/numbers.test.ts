import { parseDecimal } from './numbers';

describe('parseDecimal', () => {
  it.each([
    ['72', 72],
    ['72.5', 72.5],
    ['72,5', 72.5],
    [' 180 ', 180],
    ['0,25', 0.25],
    [',5', 0.5],
    ['72.', 72],
    ['-3', -3],
  ])('parses %j', (text, expected) => {
    expect(parseDecimal(text)).toBe(expected);
  });

  it.each(['', '  ', 'abc', '1e3', '7,2,5', '1.2.3', '.', ',', '12kg'])('rejects %j', (text) => {
    expect(parseDecimal(text)).toBeNull();
  });
});
