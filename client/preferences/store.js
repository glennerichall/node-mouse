import {
  BROWSER_VISIBILITY_STORAGE_KEY,
  HANDEDNESS_STORAGE_KEY,
  REMOTE_AUTO_HIDE_STORAGE_KEY,
  REMOTE_VISIBILITY_STORAGE_KEY,
  SUPPORTED_HANDEDNESS,
  SUPPORTED_THEMES,
  THEME_STORAGE_KEY,
} from './constants.js';
import {createStorageBinding} from '../i18n/storage.js';
import {
  getCachedBrowserVisibility,
  getCachedHandedness,
  getCachedRemoteAutoHide,
  getCachedRemoteVisibility,
  getCachedTheme,
  setCachedBrowserVisibility,
  setCachedHandedness,
  setCachedRemoteAutoHide,
  setCachedRemoteVisibility,
  setCachedTheme,
} from './runtime-state.js';
import {
  applyHandednessToDocument,
  applyRemoteAutoHideToDocument,
  applyThemeToDocument,
} from './effects.js';

const themeStorage = createStorageBinding(THEME_STORAGE_KEY);
const handednessStorage = createStorageBinding(HANDEDNESS_STORAGE_KEY);
const remoteAutoHideStorage = createStorageBinding(REMOTE_AUTO_HIDE_STORAGE_KEY);
const remoteVisibilityStorage = createStorageBinding(REMOTE_VISIBILITY_STORAGE_KEY);
const browserVisibilityStorage = createStorageBinding(BROWSER_VISIBILITY_STORAGE_KEY);

function normalizeBooleanRecord(value, fallback = {}) {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, entryValue]) => [key, Boolean(entryValue)]));
  }

  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return fallback;
    }

    return Object.fromEntries(
      Object.entries(parsed).map(([key, entryValue]) => [key, Boolean(entryValue)]),
    );
  } catch (_error) {
    return fallback;
  }
}

export function resolveTheme(value = themeStorage.read()) {
  const normalized = String(value || '').trim().toLowerCase();
  if (SUPPORTED_THEMES.has(normalized)) {
    return normalized;
  }

  return 'dark';
}

export function resolveHandedness(value = handednessStorage.read()) {
  const normalized = String(value || '').trim().toLowerCase();
  if (SUPPORTED_HANDEDNESS.has(normalized)) {
    return normalized;
  }

  return 'right';
}

export function resolveRemoteAutoHide(value = remoteAutoHideStorage.read()) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'off' || normalized === 'no') {
    return false;
  }

  return true;
}

export function resolveRemoteVisibilityState(value = remoteVisibilityStorage.read()) {
  const nextState = normalizeBooleanRecord(value);

  if (Object.keys(nextState).length > 0) {
    return nextState;
  }

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

export function resolveBrowserVisibilityState(value = browserVisibilityStorage.read()) {
  return normalizeBooleanRecord(value);
}

export function applyClientTheme(theme) {
  const normalizedTheme = resolveTheme(theme);
  setCachedTheme(normalizedTheme);
  return applyThemeToDocument(normalizedTheme);
}

export function applyClientHandedness(handedness) {
  const normalizedHandedness = resolveHandedness(handedness);
  setCachedHandedness(normalizedHandedness);
  return applyHandednessToDocument(normalizedHandedness);
}

export function applyClientRemoteAutoHide(value) {
  const normalizedValue = typeof value === 'boolean' ? value : resolveRemoteAutoHide(value);
  setCachedRemoteAutoHide(normalizedValue);
  return applyRemoteAutoHideToDocument(normalizedValue);
}

export function applyClientRemoteVisibilityState(value) {
  const nextState = normalizeBooleanRecord(value, resolveRemoteVisibilityState(value));
  setCachedRemoteVisibility(nextState);
  return nextState;
}

export function applyClientBrowserVisibilityState(value) {
  const nextState = normalizeBooleanRecord(value, resolveBrowserVisibilityState(value));
  setCachedBrowserVisibility(nextState);
  return nextState;
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
  return applyClientRemoteVisibilityState(value);
}

export function initClientBrowserVisibilityState(value = resolveBrowserVisibilityState()) {
  return applyClientBrowserVisibilityState(value);
}

export function getClientTheme() {
  return getCachedTheme() || resolveTheme();
}

export function getClientHandedness() {
  return getCachedHandedness() || resolveHandedness();
}

export function getClientRemoteAutoHide() {
  return typeof getCachedRemoteAutoHide() === 'boolean' ? getCachedRemoteAutoHide() : resolveRemoteAutoHide();
}

export function getClientRemoteVisibility(remoteId, fallback = true) {
  const state = getCachedRemoteVisibility() && typeof getCachedRemoteVisibility() === 'object'
    ? getCachedRemoteVisibility()
    : resolveRemoteVisibilityState();

  if (Object.hasOwn(state, remoteId)) {
    return Boolean(state[remoteId]);
  }

  return Boolean(fallback);
}

export function getClientBrowserVisibility(browserId, fallback = true) {
  const state = getCachedBrowserVisibility() && typeof getCachedBrowserVisibility() === 'object'
    ? getCachedBrowserVisibility()
    : resolveBrowserVisibilityState();

  if (Object.hasOwn(state, browserId)) {
    return Boolean(state[browserId]);
  }

  return Boolean(fallback);
}

export function setClientThemeState(theme) {
  const normalizedTheme = resolveTheme(theme);
  themeStorage.write(normalizedTheme);
  applyClientTheme(normalizedTheme);
  return normalizedTheme;
}

export function setClientHandednessState(handedness) {
  const normalizedHandedness = resolveHandedness(handedness);
  handednessStorage.write(normalizedHandedness);
  applyClientHandedness(normalizedHandedness);
  return normalizedHandedness;
}

export function setClientRemoteAutoHideState(value) {
  const normalizedValue = Boolean(value);
  remoteAutoHideStorage.write(normalizedValue ? 'true' : 'false');
  applyClientRemoteAutoHide(normalizedValue);
  return normalizedValue;
}

export function setClientRemoteVisibilityState(remoteId, value) {
  const nextState = {
    ...getCachedRemoteVisibility(),
    [remoteId]: Boolean(value),
  };
  remoteVisibilityStorage.write(JSON.stringify(nextState));
  applyClientRemoteVisibilityState(nextState);
  return Boolean(value);
}

export function setClientRemoteVisibilityObjectState(value) {
  const nextState = value && typeof value === 'object' ? value : {};
  remoteVisibilityStorage.write(JSON.stringify(nextState));
  return applyClientRemoteVisibilityState(nextState);
}

export function setClientBrowserVisibilityState(browserId, value) {
  const nextState = {
    ...getCachedBrowserVisibility(),
    [browserId]: Boolean(value),
  };
  browserVisibilityStorage.write(JSON.stringify(nextState));
  applyClientBrowserVisibilityState(nextState);
  return Boolean(value);
}

export function setClientBrowserVisibilityObjectState(value) {
  const nextState = value && typeof value === 'object' ? value : {};
  browserVisibilityStorage.write(JSON.stringify(nextState));
  return applyClientBrowserVisibilityState(nextState);
}
