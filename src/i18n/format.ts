import { useMemo } from 'react';

import { intlLocale, type Language, useLanguage } from './index';

export interface Format {
  /** Locale-aware number: "2 209" / "4,5" in Macedonian, "2,209" / "4.5" in English. */
  formatNumber: (value: number, maxFractionDigits?: number) => string;
  /**
   * A nutrient amount for display: "—" when unknown (never 0), "≥ 12" when the
   * value is a lower bound because some logged foods have unknown values.
   */
  formatNutrient: (value: number | null, incomplete?: boolean, maxFractionDigits?: number) => string;
  /** A name stored in both languages, in the UI language, falling back to the other one. */
  localizedName: (nameMk: string | null, nameEn: string | null) => string;
}

export function makeFormat(language: Language): Format {
  const formatNumber = (value: number, maxFractionDigits = 0) =>
    new Intl.NumberFormat(intlLocale[language], { maximumFractionDigits: maxFractionDigits }).format(value);

  return {
    formatNumber,
    formatNutrient: (value, incomplete = false, maxFractionDigits = 0) =>
      value === null ? '—' : `${incomplete ? '≥ ' : ''}${formatNumber(value, maxFractionDigits)}`,
    localizedName: (nameMk, nameEn) => {
      const [first, second] = language === 'mk' ? [nameMk, nameEn] : [nameEn, nameMk];
      return first ?? second ?? '';
    },
  };
}

/**
 * Formatters for the current UI language. A hook, not plain functions reading a
 * global: the React Compiler memoizes render values by their inputs, so text
 * built from a global would keep the old language after a switch (see useLanguage).
 */
export function useFormat(): Format {
  const language = useLanguage();
  return useMemo(() => makeFormat(language), [language]);
}
