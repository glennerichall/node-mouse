import {LOCALE_STORAGE_KEY, I18N_CHANGED_EVENT} from '../../i18n/constants.js';
import {interpolate, loadDictionary, resolveLocale} from '../../i18n/core.js';
import {createStorageBinding} from '../../i18n/storage.js';
import {applyPageTranslations} from '../../ui/i18n/apply-page-translations.js';
import {createWindowEventListener, emitWindowEvent} from '../../core/window-events.js';
import {mountLanguageSwitcher as mountLanguageSwitcherView} from '../../ui/preferences/switchers.js';

export function createI18nService(services) {
  const localeStorage = createStorageBinding(LOCALE_STORAGE_KEY);
  const onChange = createWindowEventListener(I18N_CHANGED_EVENT);
  let currentLocale = '';
  let currentDictionary = null;

  function getResolvedLocale(value = localeStorage.read() || navigator.language) {
    return resolveLocale(value);
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
      document.documentElement.lang = currentLocale;
      return getI18nView();
    },
    getLocale() {
      return getResolvedLocale(currentLocale || localeStorage.read() || navigator.language);
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
      localeStorage.write(normalizedLocale);
      const previousLocale = currentLocale || '';
      await this.init(normalizedLocale);

      applyPageTranslations(document, t);
      emitWindowEvent(I18N_CHANGED_EVENT, {
        locale: currentLocale,
        previousLocale,
      });

      return getI18nView();
    },
    mountLanguageSwitcher() {
      mountLanguageSwitcherView({
        locale: this.getLocale(),
        t,
        onChange: this.setLocale.bind(this),
      });
    },
    onChange(listener) {
      return onChange(listener);
    },
  };
}
