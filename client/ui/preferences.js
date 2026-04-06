import {
  applyPageTranslations,
  initClientHandedness,
  initClientI18n,
  initClientTheme,
  mountClientPreferences,
} from '../i18n/index.js';

await initClientI18n();
initClientTheme();
initClientHandedness();
applyPageTranslations(document);
mountClientPreferences();
