import {
  BROWSER_VISIBILITY_STORAGE_KEY,
  HANDEDNESS_STORAGE_KEY,
  REMOTE_AUTO_HIDE_STORAGE_KEY,
  REMOTE_VISIBILITY_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from '../../preferences/constants.js';
import {LOCALE_STORAGE_KEY} from '../../i18n/constants.js';
import {resolveLocale} from '../../i18n/core.js';
import {
  APP_STATE_BROWSER_VISIBILITY,
  APP_STATE_HANDEDNESS,
  APP_STATE_KEYBOARD_PREVIEW_ACTIVE,
  APP_STATE_LOCALE,
  APP_STATE_PREVIEW_ACTIVITY_AT,
  APP_STATE_REMOTE_ACCORDION_EXPANDED_PANEL,
  APP_STATE_REMOTE_AUTO_HIDE,
  APP_STATE_REMOTE_VISIBILITY,
  APP_STATE_THEME,
} from './appStateKeys.js';
import {
  normalizeBooleanRecord,
  normalizeHandedness,
  normalizeRemoteAutoHide,
  normalizeRemoteVisibilityState,
  normalizeString,
  normalizeTheme,
} from './normalizers.js';

export const APP_STATE_STORE_STATE = 'state';
export const APP_STATE_STORE_PERSIST = 'persist';

export const APP_STATE_DEFINITIONS = {
  [APP_STATE_PREVIEW_ACTIVITY_AT]: {
    store: APP_STATE_STORE_STATE,
    defaultValue: 0,
    normalize: (value) => Number(value) || 0,
  },
  [APP_STATE_KEYBOARD_PREVIEW_ACTIVE]: {
    store: APP_STATE_STORE_STATE,
    defaultValue: false,
    normalize: Boolean,
  },
  [APP_STATE_REMOTE_ACCORDION_EXPANDED_PANEL]: {
    store: APP_STATE_STORE_STATE,
    defaultValue: '',
    normalize: (value) => normalizeString(value),
  },
  [APP_STATE_THEME]: {
    store: APP_STATE_STORE_PERSIST,
    storageKey: THEME_STORAGE_KEY,
    defaultValue: 'dark',
    normalize: normalizeTheme,
    serialize: String,
  },
  [APP_STATE_LOCALE]: {
    store: APP_STATE_STORE_PERSIST,
    storageKey: LOCALE_STORAGE_KEY,
    defaultValue: '',
    normalize: (value) => resolveLocale(
      value || (typeof navigator !== 'undefined' ? navigator.language : ''),
    ),
    serialize: String,
  },
  [APP_STATE_HANDEDNESS]: {
    store: APP_STATE_STORE_PERSIST,
    storageKey: HANDEDNESS_STORAGE_KEY,
    defaultValue: 'right',
    normalize: normalizeHandedness,
    serialize: String,
  },
  [APP_STATE_REMOTE_AUTO_HIDE]: {
    store: APP_STATE_STORE_PERSIST,
    storageKey: REMOTE_AUTO_HIDE_STORAGE_KEY,
    defaultValue: true,
    normalize: normalizeRemoteAutoHide,
    serialize: (value) => value ? 'true' : 'false',
  },
  [APP_STATE_REMOTE_VISIBILITY]: {
    store: APP_STATE_STORE_PERSIST,
    storageKey: REMOTE_VISIBILITY_STORAGE_KEY,
    defaultValue: {},
    normalize: normalizeRemoteVisibilityState,
    serialize: JSON.stringify,
  },
  [APP_STATE_BROWSER_VISIBILITY]: {
    store: APP_STATE_STORE_PERSIST,
    storageKey: BROWSER_VISIBILITY_STORAGE_KEY,
    defaultValue: {},
    normalize: (value) => normalizeBooleanRecord(value),
    serialize: JSON.stringify,
  },
};

export function getAppStateDefinition(key) {
  return APP_STATE_DEFINITIONS[key] || null;
}

export function getPersistStateDefinitions() {
  return Object.entries(APP_STATE_DEFINITIONS)
    .filter(([, definition]) => definition.store === APP_STATE_STORE_PERSIST);
}

export function getStateStoreDefinitions() {
  return Object.entries(APP_STATE_DEFINITIONS)
    .filter(([, definition]) => definition.store === APP_STATE_STORE_STATE);
}
