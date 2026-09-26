import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import mk from './mk.json';

export const languages = ['mk', 'en'] as const;
export type Language = (typeof languages)[number];
export const defaultLanguage: Language = 'mk';

/** Locale tags for Intl date/number formatting. */
export const intlLocale: Record<Language, string> = { mk: 'mk-MK', en: 'en-GB' };

export const resources = {
  mk: { translation: mk },
  en: { translation: en },
} as const;

/** English if the phone is set to English, otherwise Macedonian. */
export function deviceLanguage(): Language {
  return getLocales()[0]?.languageCode === 'en' ? 'en' : defaultLanguage;
}

export function currentLanguage(): Language {
  return i18n.language === 'en' ? 'en' : 'mk';
}

// Resources are bundled, so init completes synchronously before the first render.
// Before onboarding the phone's language is used; after it, the profile's (see app/_layout.tsx).
void i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage(),
  fallbackLng: defaultLanguage,
  interpolation: { escapeValue: false }, // React already escapes output
});

export default i18n;
