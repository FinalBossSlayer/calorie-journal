import { toSearchKey } from './translit';

describe('toSearchKey', () => {
  describe('Cyrillic', () => {
    it('transliterates the full Macedonian alphabet', () => {
      expect(toSearchKey('абвгдѓежзѕијклљмнњопрстќуфхцчџш')).toBe(
        'abvgdgezzdzijklljmnnjoprstkufhccdzs',
      );
    });

    it('handles uppercase Cyrillic', () => {
      expect(toSearchKey('ТАВЧЕ ГРАВЧЕ')).toBe('tavce gravce');
      expect(toSearchKey('Ѓеврек')).toBe('gevrek');
    });

    it('transliterates common dish names', () => {
      expect(toSearchKey('сарма')).toBe('sarma');
      expect(toSearchKey('бурек')).toBe('burek');
      expect(toSearchKey('ќофте')).toBe('kofte');
      expect(toSearchKey('џезва')).toBe('dzezva');
      expect(toSearchKey('ѕвезда')).toBe('dzvezda');
      expect(toSearchKey('сирење')).toBe('sirenje');
      expect(toSearchKey('пастрмајлија')).toBe('pastrmajlija');
    });
  });

  describe('diacritics', () => {
    it('strips carons and acutes', () => {
      expect(toSearchKey('tavče gravče')).toBe('tavce gravce');
      expect(toSearchKey('šopska')).toBe('sopska');
      expect(toSearchKey('žito')).toBe('zito');
      expect(toSearchKey('ǵevrek')).toBe('gevrek');
      expect(toSearchKey('ḱofte')).toBe('kofte');
    });

    it('maps ć to k and đ to dj', () => {
      expect(toSearchKey('ćofte')).toBe('kofte');
      expect(toSearchKey('đuveč')).toBe('djuvec');
    });

    it('handles uppercase diacritics', () => {
      expect(toSearchKey('TAVČE')).toBe('tavce');
      expect(toSearchKey('Đuveč')).toBe('djuvec');
    });

    it('handles precomposed and decomposed forms identically', () => {
      const precomposed = 'tavče';
      const decomposed = 'tavče';
      expect(toSearchKey(precomposed)).toBe(toSearchKey(decomposed));
    });
  });

  describe('digraphs', () => {
    it('collapses ch, sh, zh, kj, gj', () => {
      expect(toSearchKey('tavche')).toBe('tavce');
      expect(toSearchKey('shopska')).toBe('sopska');
      expect(toSearchKey('zhito')).toBe('zito');
      expect(toSearchKey('kjofte')).toBe('kofte');
      expect(toSearchKey('gjevrek')).toBe('gevrek');
    });

    it('collapses dzh to dz before zh', () => {
      expect(toSearchKey('dzhezva')).toBe('dzezva');
    });

    it('keeps lj and nj', () => {
      expect(toSearchKey('sirenje')).toBe('sirenje');
      expect(toSearchKey('ljutenica')).toBe('ljutenica');
    });
  });

  describe('equivalence', () => {
    it.each(['Тавче гравче', 'tavče gravče', 'tavche gravche', 'tavce gravce', 'TAVCHE Gravče'])(
      '%s → tavce gravce',
      (input) => {
        expect(toSearchKey(input)).toBe('tavce gravce');
      },
    );

    it.each(['ќофте', 'ḱofte', 'kjofte', 'kofte', 'ćofte'])('%s → kofte', (input) => {
      expect(toSearchKey(input)).toBe('kofte');
    });
  });

  describe('whitespace and punctuation', () => {
    it('trims and collapses whitespace', () => {
      expect(toSearchKey('  сарма \t  со   ориз \n')).toBe('sarma so oriz');
    });

    it('turns punctuation into separators', () => {
      expect(toSearchKey('Бурек (со сирење)')).toBe('burek so sirenje');
      expect(toSearchKey('пиле-гради, печени')).toBe('pile gradi peceni');
    });

    it('keeps digits', () => {
      expect(toSearchKey('Млеко 3.2%')).toBe('mleko 3 2');
    });

    it('returns an empty string for empty or symbol-only input', () => {
      expect(toSearchKey('')).toBe('');
      expect(toSearchKey('   ')).toBe('');
      expect(toSearchKey('—!?')).toBe('');
    });
  });
});
