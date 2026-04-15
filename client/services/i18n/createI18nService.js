import {I18N_CHANGED_EVENT} from '../../i18n/constants.js';
import {interpolate, loadDictionary, resolveLocale} from '../../i18n/core.js';
import {applyPageTranslations} from '../../i18n/apply-page-translations.js';
import {createWindowEventListener, emitWindowEvent} from '../../core/window-events.js';

export function createI18nService(services) {
  const onChange = createWindowEventListener(I18N_CHANGED_EVENT);
  let currentLocale = '';
  let currentDictionary = null;

  function getResolvedLocale(value = typeof navigator !== 'undefined' ? navigator.language : '') {
    return resolveLocale(value);
  }

  function applyLocaleToDom(locale) {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
    return locale;
  }

  function ensureInitialized() {
    if (!currentLocale || !currentDictionary) {
      throw new Error('Client i18n not initialized.');
    }
  }

  function t(key, params = {}) {
    ensureInitialized();
    const template = currentDictionary[key] ?? key;
    return interpolate(template, params);
  }

  function getI18nView() {
    ensureInitialized();
    return {
      locale: currentLocale,
      t,
    };
  }

  return {
    async init(locale) {
      const normalizedLocale = getResolvedLocale(locale);
      if (currentLocale === normalizedLocale && currentDictionary) {
        return getI18nView();
      }

      currentDictionary = await loadDictionary(normalizedLocale);
      currentLocale = normalizedLocale;
      applyLocaleToDom(currentLocale);
      return getI18nView();
    },
    getLocale() {
      return getResolvedLocale(currentLocale);
    },
    getI18n() {
      return getI18nView();
    },
    t(key, params) {
      return t(key, params);
    },
    translateRoot(root = document) {
      applyPageTranslations(root, t);
    },
    async setLocale(locale) {
      const normalizedLocale = getResolvedLocale(locale);
      const previousLocale = currentLocale || '';
      await this.init(normalizedLocale);

      applyPageTranslations(document, t);
      emitWindowEvent(I18N_CHANGED_EVENT, {
        locale: currentLocale,
        previousLocale,
      });

      return getI18nView();
    },
    applyLocaleToDom(locale = currentLocale) {
      return applyLocaleToDom(getResolvedLocale(locale));
    },
    onChange(listener) {
      return onChange(listener);
    },
  };
}
