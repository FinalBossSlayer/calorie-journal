import en from './en.json';
import mk from './mk.json';

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? keys(v as object, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe('translations', () => {
  it('mk and en have the same keys', () => {
    expect(keys(en).sort()).toEqual(keys(mk).sort());
  });
});
