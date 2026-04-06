import {localePrefixes, localeRegistry} from './locale-registry.js';

const LOCALE_STORAGE_KEY = 'remote-mouse.locale';
const THEME_STORAGE_KEY = 'remote-mouse.theme';
const HANDEDNESS_STORAGE_KEY = 'remote-mouse.handedness';
const REMOTE_AUTO_HIDE_STORAGE_KEY = 'remote-mouse.remote-auto-hide';
const REMOTE_VISIBILITY_STORAGE_KEY = 'remote-mouse.remote-visibility';
const I18N_CHANGED_EVENT = 'i18n:changed';
const THEME_CHANGED_EVENT = 'theme:changed';
const HANDEDNESS_CHANGED_EVENT = 'handedness:changed';
const REMOTE_AUTO_HIDE_CHANGED_EVENT = 'remote-auto-hide:changed';
const REMOTE_VISIBILITY_CHANGED_EVENT = 'remote-visibility:changed';
const SUPPORTED_THEMES = new Set(['dark', 'light']);
const SUPPORTED_HANDEDNESS = new Set(['right', 'left']);

let cachedI18n = null;
let cachedTheme = '';
let cachedHandedness = '';
let cachedRemoteAutoHide = true;
let cachedRemoteVisibility = {};
let remoteVisibilityStorageBound = false;

function applySwitcherLabelStyle(label) {
  label.style.fontSize = '12px';
  label.style.color = 'var(--muted)';
}

function applySwitcherSelectStyle(select) {
  select.style.fontSize = '12px';
  select.style.borderRadius = '8px';
  select.style.padding = '3px 8px';
  select.style.border = '1px solid var(--border, rgba(255, 255, 255, 0.16))';
  select.style.background = 'var(--panel-strong, rgba(255, 255, 255, 0.08))';
  select.style.color = 'var(--text)';
}

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

function safeReadStoredTheme() {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch (_error) {
    return '';
  }
}

function safeWriteStoredTheme(theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (_error) {
    // Best effort.
  }
}

function safeReadStoredHandedness() {
  try {
    return window.localStorage.getItem(HANDEDNESS_STORAGE_KEY);
  } catch (_error) {
    return '';
  }
}

function safeWriteStoredHandedness(handedness) {
  try {
    window.localStorage.setItem(HANDEDNESS_STORAGE_KEY, handedness);
  } catch (_error) {
    // Best effort.
  }
}

function safeReadStoredRemoteAutoHide() {
  try {
    return window.localStorage.getItem(REMOTE_AUTO_HIDE_STORAGE_KEY);
  } catch (_error) {
    return '';
  }
}

function safeWriteStoredRemoteAutoHide(value) {
  try {
    window.localStorage.setItem(REMOTE_AUTO_HIDE_STORAGE_KEY, value);
  } catch (_error) {
    // Best effort.
  }
}

function safeReadStoredRemoteVisibility() {
  try {
    return window.localStorage.getItem(REMOTE_VISIBILITY_STORAGE_KEY);
  } catch (_error) {
    return '';
  }
}

function safeWriteStoredRemoteVisibility(value) {
  try {
    window.localStorage.setItem(REMOTE_VISIBILITY_STORAGE_KEY, value);
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

function resolveTheme(value = safeReadStoredTheme()) {
  const normalized = String(value || '').trim().toLowerCase();
  if (SUPPORTED_THEMES.has(normalized)) {
    return normalized;
  }
  return 'dark';
}

function resolveHandedness(value = safeReadStoredHandedness()) {
  const normalized = String(value || '').trim().toLowerCase();
  if (SUPPORTED_HANDEDNESS.has(normalized)) {
    return normalized;
  }
  return 'right';
}

function resolveRemoteAutoHide(value = safeReadStoredRemoteAutoHide()) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'off' || normalized === 'no') {
    return false;
  }
  return true;
}

function resolveRemoteVisibilityState(value = safeReadStoredRemoteVisibility()) {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).map(([key, entryValue]) => [key, Boolean(entryValue)]),
    );
  } catch (_error) {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'false' || normalized === '0' || normalized === 'off') {
      return {
        browser: false,
        samsung: false,
        preview: false,
      };
    }
    return {};
  }
}

function resolveRemoteVisibility(remoteId, fallback = true) {
  const state = cachedRemoteVisibility && typeof cachedRemoteVisibility === 'object'
    ? cachedRemoteVisibility
    : resolveRemoteVisibilityState();
  if (Object.hasOwn(state, remoteId)) {
    return Boolean(state[remoteId]);
  }
  return Boolean(fallback);
}

function applyClientTheme(theme) {
  const normalizedTheme = resolveTheme(theme);
  cachedTheme = normalizedTheme;
  document.documentElement.dataset.theme = normalizedTheme;
  document.documentElement.style.colorScheme = normalizedTheme;
  return normalizedTheme;
}

function applyClientHandedness(handedness) {
  const normalizedHandedness = resolveHandedness(handedness);
  cachedHandedness = normalizedHandedness;
  document.documentElement.dataset.handedness = normalizedHandedness;
  return normalizedHandedness;
}

function applyClientRemoteAutoHide(value) {
  const normalizedValue = typeof value === 'boolean' ? value : resolveRemoteAutoHide(value);
  cachedRemoteAutoHide = normalizedValue;
  document.documentElement.dataset.remoteAutoHide = normalizedValue ? 'true' : 'false';
  return normalizedValue;
}

function applyClientRemoteVisibilityState(value) {
  const nextState = typeof value === 'object' && value !== null && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).map(([key, entryValue]) => [key, Boolean(entryValue)]))
    : resolveRemoteVisibilityState(value);
  cachedRemoteVisibility = nextState;
  return nextState;
}

function bindRemoteVisibilityStorageSync() {
  if (remoteVisibilityStorageBound || typeof window === 'undefined') {
    return;
  }

  window.addEventListener('storage', (event) => {
    if (event.key !== REMOTE_VISIBILITY_STORAGE_KEY) {
      return;
    }

    const previousState = cachedRemoteVisibility;
    const nextState = applyClientRemoteVisibilityState(event.newValue || '');
    window.dispatchEvent(new CustomEvent(REMOTE_VISIBILITY_CHANGED_EVENT, {
      detail: {
        previousState,
        nextState,
      },
    }));
  });

  remoteVisibilityStorageBound = true;
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

export function initClientTheme(theme = resolveTheme()) {
  return applyClientTheme(theme);
}

export function initClientHandedness(handedness = resolveHandedness()) {
  return applyClientHandedness(handedness);
}

export function initClientRemoteAutoHide(value = resolveRemoteAutoHide()) {
  return applyClientRemoteAutoHide(value);
}

export function initClientRemoteVisibilityState(value = resolveRemoteVisibilityState()) {
  bindRemoteVisibilityStorageSync();
  return applyClientRemoteVisibilityState(value);
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

export function getClientTheme() {
  return cachedTheme || resolveTheme();
}

export function getClientHandedness() {
  return cachedHandedness || resolveHandedness();
}

export function getClientRemoteAutoHide() {
  return typeof cachedRemoteAutoHide === 'boolean' ? cachedRemoteAutoHide : resolveRemoteAutoHide();
}

export function getClientRemoteVisibility(remoteId, fallback = true) {
  return resolveRemoteVisibility(remoteId, fallback);
}

export function setClientTheme(theme) {
  const normalizedTheme = resolveTheme(theme);
  const previousTheme = getClientTheme();
  safeWriteStoredTheme(normalizedTheme);
  applyClientTheme(normalizedTheme);
  mountClientPreferences();
  window.dispatchEvent(new CustomEvent(THEME_CHANGED_EVENT, {
    detail: {
      theme: normalizedTheme,
      previousTheme,
    },
  }));
  return normalizedTheme;
}

export function setClientHandedness(handedness) {
  const normalizedHandedness = resolveHandedness(handedness);
  const previousHandedness = getClientHandedness();
  safeWriteStoredHandedness(normalizedHandedness);
  applyClientHandedness(normalizedHandedness);
  mountClientPreferences();
  window.dispatchEvent(new CustomEvent(HANDEDNESS_CHANGED_EVENT, {
    detail: {
      handedness: normalizedHandedness,
      previousHandedness,
    },
  }));
  return normalizedHandedness;
}

export function setClientRemoteAutoHide(value) {
  const normalizedValue = Boolean(value);
  const previousValue = getClientRemoteAutoHide();
  safeWriteStoredRemoteAutoHide(normalizedValue ? 'true' : 'false');
  applyClientRemoteAutoHide(normalizedValue);
  mountClientPreferences();
  window.dispatchEvent(new CustomEvent(REMOTE_AUTO_HIDE_CHANGED_EVENT, {
    detail: {
      enabled: normalizedValue,
      previousEnabled: previousValue,
    },
  }));
  return normalizedValue;
}

export function setClientRemoteVisibility(remoteId, value) {
  const previousVisible = getClientRemoteVisibility(remoteId, true);
  const nextState = {
    ...cachedRemoteVisibility,
    [remoteId]: Boolean(value),
  };
  safeWriteStoredRemoteVisibility(JSON.stringify(nextState));
  applyClientRemoteVisibilityState(nextState);
  window.dispatchEvent(new CustomEvent(REMOTE_VISIBILITY_CHANGED_EVENT, {
    detail: {
      remoteId,
      visible: Boolean(value),
      previousVisible,
    },
  }));
  return Boolean(value);
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
  const host = document.querySelector('[data-client-prefs-host]') || document.querySelector('[data-language-switcher-host]');

  let root = document.querySelector('[data-language-switcher]');
  if (!root) {
    root = document.createElement('div');
    root.dataset.languageSwitcher = 'true';
    root.style.display = 'flex';
    root.style.alignItems = 'center';
    root.style.gap = '6px';

    const label = document.createElement('span');
    label.dataset.languageLabel = 'true';
    applySwitcherLabelStyle(label);

    const select = document.createElement('select');
    select.dataset.languageSelect = 'true';
    applySwitcherSelectStyle(select);

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
    (host || document.body).appendChild(root);
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

export function mountThemeSwitcher() {
  const theme = getClientTheme();
  const {t} = getClientI18n();
  const host = document.querySelector('[data-client-prefs-host]') || document.querySelector('[data-language-switcher-host]');

  let root = document.querySelector('[data-theme-switcher]');
  if (!root) {
    root = document.createElement('div');
    root.dataset.themeSwitcher = 'true';
    root.style.display = 'flex';
    root.style.alignItems = 'center';
    root.style.gap = '6px';

    const label = document.createElement('span');
    label.dataset.themeLabel = 'true';
    applySwitcherLabelStyle(label);

    const select = document.createElement('select');
    select.dataset.themeSelect = 'true';
    applySwitcherSelectStyle(select);

    for (const nextTheme of SUPPORTED_THEMES) {
      const option = document.createElement('option');
      option.value = nextTheme;
      option.textContent = t(`common.theme.${nextTheme}`);
      select.appendChild(option);
    }

    select.addEventListener('change', () => {
      setClientTheme(select.value);
    });

    root.appendChild(label);
    root.appendChild(select);
    (host || document.body).appendChild(root);
  }

  const select = root.querySelector('[data-theme-select]');
  if (select) {
    select.value = theme;
    select.setAttribute('aria-label', t('common.theme'));
    Array.from(select.options).forEach((option) => {
      option.textContent = t(`common.theme.${option.value}`);
    });
  }

  const label = root.querySelector('[data-theme-label]');
  if (label) {
    label.textContent = t('common.themeShort');
  }
}

export function mountHandednessSwitcher() {
  const handedness = getClientHandedness();
  const {t} = getClientI18n();
  const host = document.querySelector('[data-client-prefs-host]') || document.querySelector('[data-language-switcher-host]');

  let root = document.querySelector('[data-handedness-switcher]');
  if (!root) {
    root = document.createElement('div');
    root.dataset.handednessSwitcher = 'true';
    root.style.display = 'flex';
    root.style.alignItems = 'center';
    root.style.gap = '6px';

    const label = document.createElement('span');
    label.dataset.handednessLabel = 'true';
    applySwitcherLabelStyle(label);

    const select = document.createElement('select');
    select.dataset.handednessSelect = 'true';
    applySwitcherSelectStyle(select);

    for (const nextHandedness of SUPPORTED_HANDEDNESS) {
      const option = document.createElement('option');
      option.value = nextHandedness;
      option.textContent = t(`common.handedness.${nextHandedness}`);
      select.appendChild(option);
    }

    select.addEventListener('change', () => {
      setClientHandedness(select.value);
    });

    root.appendChild(label);
    root.appendChild(select);
    (host || document.body).appendChild(root);
  }

  const select = root.querySelector('[data-handedness-select]');
  if (select) {
    select.value = handedness;
    select.setAttribute('aria-label', t('common.handedness'));
    Array.from(select.options).forEach((option) => {
      option.textContent = t(`common.handedness.${option.value}`);
    });
  }

  const label = root.querySelector('[data-handedness-label]');
  if (label) {
    label.textContent = t('common.handednessShort');
  }
}

export function mountRemoteAutoHideSwitcher() {
  const enabled = getClientRemoteAutoHide();
  const {t} = getClientI18n();
  const host = document.querySelector('[data-remote-auto-hide-host]')
    || document.querySelector('[data-client-prefs-host]')
    || document.querySelector('[data-language-switcher-host]');

  let root = document.querySelector('[data-remote-auto-hide-switcher]');
  if (!root) {
    root = document.createElement('div');
    root.dataset.remoteAutoHideSwitcher = 'true';
    root.style.display = 'flex';
    root.style.alignItems = 'center';
    root.style.gap = '6px';

    const label = document.createElement('span');
    label.dataset.remoteAutoHideLabel = 'true';
    applySwitcherLabelStyle(label);

    const select = document.createElement('select');
    select.dataset.remoteAutoHideSelect = 'true';
    applySwitcherSelectStyle(select);

    for (const [value, key] of [['true', 'common.enabled'], ['false', 'common.disabled']]) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = t(key);
      select.appendChild(option);
    }

    select.addEventListener('change', () => {
      setClientRemoteAutoHide(select.value === 'true');
    });

    root.appendChild(label);
    root.appendChild(select);
    (host || document.body).appendChild(root);
  }

  const select = root.querySelector('[data-remote-auto-hide-select]');
  if (select) {
    select.value = enabled ? 'true' : 'false';
    select.setAttribute('aria-label', t('common.remoteAutoHide'));
    Array.from(select.options).forEach((option) => {
      option.textContent = t(option.value === 'true' ? 'common.enabled' : 'common.disabled');
    });
  }

  const label = root.querySelector('[data-remote-auto-hide-label]');
  if (label) {
    label.textContent = t('common.remoteAutoHideShort');
  }
}

export function mountClientPreferences() {
  mountLanguageSwitcher();
  mountThemeSwitcher();
  mountHandednessSwitcher();
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

export function onClientThemeChange(listener) {
  if (typeof listener !== 'function') {
    return () => {};
  }

  const handler = (event) => {
    listener(event.detail || {});
  };

  window.addEventListener(THEME_CHANGED_EVENT, handler);
  return () => {
    window.removeEventListener(THEME_CHANGED_EVENT, handler);
  };
}

export function onClientHandednessChange(listener) {
  if (typeof listener !== 'function') {
    return () => {};
  }

  const handler = (event) => {
    listener(event.detail || {});
  };

  window.addEventListener(HANDEDNESS_CHANGED_EVENT, handler);
  return () => {
    window.removeEventListener(HANDEDNESS_CHANGED_EVENT, handler);
  };
}

export function onClientRemoteAutoHideChange(listener) {
  if (typeof listener !== 'function') {
    return () => {};
  }

  const handler = (event) => {
    listener(event.detail || {});
  };

  window.addEventListener(REMOTE_AUTO_HIDE_CHANGED_EVENT, handler);
  return () => {
    window.removeEventListener(REMOTE_AUTO_HIDE_CHANGED_EVENT, handler);
  };
}

export function onClientRemoteVisibilityChange(listener) {
  if (typeof listener !== 'function') {
    return () => {};
  }

  const handler = (event) => {
    listener(event.detail || {});
  };

  window.addEventListener(REMOTE_VISIBILITY_CHANGED_EVENT, handler);
  return () => {
    window.removeEventListener(REMOTE_VISIBILITY_CHANGED_EVENT, handler);
  };
}
