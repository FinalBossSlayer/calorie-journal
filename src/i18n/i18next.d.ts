import 'i18next';

import type mk from './mk.json';

// Makes t('...') keys type-checked against mk.json (the default language).
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof mk };
  }
}
