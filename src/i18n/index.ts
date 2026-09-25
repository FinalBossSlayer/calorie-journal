import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import mk from './mk.json';

export const languages = ['mk', 'en'] as const;
export type Language = (typeof languages)[number];
export const defaultLanguage: Language = 'mk';

export const resources = {
  mk: { translation: mk },
  en: { translation: en },
} as const;

// Resources are bundled, so init completes synchronously before the first render.
// The language will come from the profile once it exists; until then it's always Macedonian.
void i18n.use(initReactI18next).init({
  resources,
  lng: defaultLanguage,
  fallbackLng: defaultLanguage,
  interpolation: { escapeValue: false }, // React already escapes output
});

export default i18n;
