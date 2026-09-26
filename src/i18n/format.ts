import { currentLanguage, intlLocale } from './index';

/** Locale-aware number: "2 209" / "4,5" in Macedonian, "2,209" / "4.5" in English. */
export function formatNumber(value: number, maxFractionDigits = 0): string {
  return new Intl.NumberFormat(intlLocale[currentLanguage()], {
    maximumFractionDigits: maxFractionDigits,
  }).format(value);
}
