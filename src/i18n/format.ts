import { currentLanguage, intlLocale } from './index';

/** Locale-aware number: "2 209" / "4,5" in Macedonian, "2,209" / "4.5" in English. */
export function formatNumber(value: number, maxFractionDigits = 0): string {
  return new Intl.NumberFormat(intlLocale[currentLanguage()], {
    maximumFractionDigits: maxFractionDigits,
  }).format(value);
}

/**
 * A nutrient amount for display: "—" when unknown (never 0), "≥ 12" when the
 * value is a lower bound because some logged foods have unknown values.
 */
export function formatNutrient(value: number | null, incomplete = false, maxFractionDigits = 0): string {
  if (value === null) return '—';
  return `${incomplete ? '≥ ' : ''}${formatNumber(value, maxFractionDigits)}`;
}

/** A name stored in both languages, in the UI language, falling back to the other one. */
export function localizedName(nameMk: string | null, nameEn: string | null): string {
  const [first, second] = currentLanguage() === 'mk' ? [nameMk, nameEn] : [nameEn, nameMk];
  return first ?? second ?? '';
}
