import {localePrefixes, localeRegistry} from './locale-registry.js';

const LOCALE_STORAGE_KEY = 'remote-mouse.locale';
const I18N_CHANGED_EVENT = 'i18n:changed';

let cachedI18n = null;

function safeReadStoredLocale() {
  try {
    return window.localStorage.getItem(LOCALE_STORAGE_KEY);
  } catch (_error) {
    return '';
  }
}

function safeWriteStoredLocale(locale) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch (_error) {
    // Best effort.
  }
}

function resolveLocale(value = safeReadStoredLocale() || navigator.language) {
  const normalized = String(value || '').toLowerCase();

  if (localeRegistry[normalized]) {
    return normalized;
  }

  for (const [prefix, locale] of localePrefixes) {
    if (normalized.startsWith(prefix)) {
      return locale;
    }
  }

  return 'fr';
}

async function loadDictionary(locale) {
  return localeRegistry[locale]?.load() || localeRegistry.fr.load();
}

function interpolate(template, params = {}) {
  return String(template || '').replace(/\{(\w+)\}/g, (_match, key) => String(params[key] ?? ''));
}

async function createI18n(locale = resolveLocale()) {
  const normalizedLocale = resolveLocale(locale);
  const dict = await loadDictionary(normalizedLocale);

  function t(key, params = {}) {
    const template = dict[key] ?? key;
    return interpolate(template, params);
  }

  return {
    locale: normalizedLocale,
    t,
  };
}

export async function initClientI18n(locale = resolveLocale()) {
  const normalizedLocale = resolveLocale(locale);
  if (cachedI18n?.locale === normalizedLocale) {
    return cachedI18n;
  }

  cachedI18n = await createI18n(normalizedLocale);
  document.documentElement.lang = cachedI18n.locale;
  return cachedI18n;
}

export async function setClientLocale(locale) {
  const normalizedLocale = resolveLocale(locale);
  safeWriteStoredLocale(normalizedLocale);
  const previousLocale = cachedI18n?.locale || '';
  const i18n = await initClientI18n(normalizedLocale);

  applyPageTranslations(document);
  mountLanguageSwitcher();
  window.dispatchEvent(new CustomEvent(I18N_CHANGED_EVENT, {
    detail: {
      locale: i18n.locale,
      previousLocale,
    },
  }));

  return i18n;
}

export function getClientI18n() {
  if (!cachedI18n) {
    throw new Error('Client i18n not initialized.');
  }
  return cachedI18n;
}

export function applyPageTranslations(root = document) {
  const {t} = getClientI18n();

  root.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
    node.setAttribute('placeholder', t(node.dataset.i18nPlaceholder));
  });
  root.querySelectorAll('[data-i18n-title]').forEach((node) => {
    node.setAttribute('title', t(node.dataset.i18nTitle));
  });
  root.querySelectorAll('[data-i18n-aria-label]').forEach((node) => {
    node.setAttribute('aria-label', t(node.dataset.i18nAriaLabel));
  });
  const pageTitleKey = root.documentElement?.dataset?.i18nPageTitle || document.documentElement.dataset.i18nPageTitle;
  if (pageTitleKey) {
    document.title = t(pageTitleKey);
  }
}

export function mountLanguageSwitcher() {
  const {locale} = getClientI18n();
  const {t} = getClientI18n();

  let root = document.querySelector('[data-language-switcher]');
  if (!root) {
    root = document.createElement('div');
    root.dataset.languageSwitcher = 'true';
    root.style.position = 'fixed';
    root.style.top = '10px';
    root.style.right = '10px';
    root.style.zIndex = '9999';
    root.style.display = 'flex';
    root.style.alignItems = 'center';
    root.style.gap = '6px';
    root.style.padding = '6px 8px';
    root.style.borderRadius = '999px';
    root.style.background = 'rgba(15, 20, 25, 0.86)';
    root.style.border = '1px solid rgba(255, 255, 255, 0.14)';
    root.style.backdropFilter = 'blur(6px)';

    const label = document.createElement('span');
    label.dataset.languageLabel = 'true';
    label.style.fontSize = '12px';
    label.style.color = '#e9f1f8';

    const select = document.createElement('select');
    select.dataset.languageSelect = 'true';
    select.style.fontSize = '12px';
    select.style.borderRadius = '999px';
    select.style.padding = '2px 8px';
    select.style.border = '1px solid rgba(255, 255, 255, 0.18)';
    select.style.background = 'rgba(255, 255, 255, 0.06)';
    select.style.color = '#e9f1f8';

    for (const nextLocale of Object.keys(localeRegistry)) {
      const option = document.createElement('option');
      option.value = nextLocale;
      option.textContent = localeRegistry[nextLocale].label;
      select.appendChild(option);
    }

    select.addEventListener('change', () => {
      void setClientLocale(select.value);
    });

    root.appendChild(label);
    root.appendChild(select);
    document.body.appendChild(root);
  }

  const select = root.querySelector('[data-language-select]');
  if (select) {
    select.value = locale;
    select.setAttribute('aria-label', t('common.language'));
  }

  const label = root.querySelector('[data-language-label]');
  if (label) {
    label.textContent = t('common.languageShort');
  }
}

export function onClientI18nChange(listener) {
  if (typeof listener !== 'function') {
    return () => {};
  }

  const handler = (event) => {
    listener(event.detail || {});
  };

  window.addEventListener(I18N_CHANGED_EVENT, handler);
  return () => {
    window.removeEventListener(I18N_CHANGED_EVENT, handler);
  };
}
