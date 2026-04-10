import {localePrefixes, localeRegistry} from './locale-registry.js';

export function resolveLocale(value, fallbackLocale = 'fr') {
  const normalized = String(value || '').toLowerCase();

  if (localeRegistry[normalized]) {
    return normalized;
  }

  for (const [prefix, locale] of localePrefixes) {
    if (normalized.startsWith(prefix)) {
      return locale;
    }
  }

  return fallbackLocale;
}

export async function loadDictionary(locale) {
  return localeRegistry[locale]?.load() || localeRegistry.fr.load();
}

export function interpolate(template, params = {}) {
  return String(template || '').replace(/\{(\w+)\}/g, (_match, key) => String(params[key] ?? ''));
}

export async function createI18n(locale) {
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
