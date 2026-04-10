import {
  BROWSER_VISIBILITY_CHANGED_EVENT,
  BROWSER_VISIBILITY_STORAGE_KEY,
  HANDEDNESS_CHANGED_EVENT,
  HANDEDNESS_STORAGE_KEY,
  PREFERENCES_STORAGE_CHANGED_EVENT,
  REMOTE_AUTO_HIDE_CHANGED_EVENT,
  REMOTE_AUTO_HIDE_STORAGE_KEY,
  REMOTE_VISIBILITY_CHANGED_EVENT,
  REMOTE_VISIBILITY_STORAGE_KEY,
  THEME_CHANGED_EVENT,
  THEME_STORAGE_KEY,
} from '../../preferences/constants.js';
import {
  applyClientBrowserVisibilityState,
  applyClientHandedness,
  applyClientRemoteAutoHide,
  applyClientRemoteVisibilityState,
  applyClientTheme,
  getClientBrowserVisibility,
  getClientHandedness,
  getClientRemoteAutoHide,
  getClientRemoteVisibility,
  getClientTheme,
  initClientBrowserVisibilityState,
  initClientHandedness,
  initClientRemoteAutoHide,
  initClientRemoteVisibilityState,
  initClientTheme,
  resolveBrowserVisibilityState,
  resolveHandedness,
  resolveRemoteAutoHide,
  resolveRemoteVisibilityState,
  resolveTheme,
  setClientBrowserVisibilityObjectState,
  setClientHandednessState,
  setClientRemoteAutoHideState,
  setClientRemoteVisibilityObjectState,
  setClientThemeState,
} from '../../preferences/store.js';

const PREFERENCE_DEFINITIONS = {
  theme: {
    storageKey: THEME_STORAGE_KEY,
    changedEventName: THEME_CHANGED_EVENT,
    init: initClientTheme,
    read: getClientTheme,
    resolve: resolveTheme,
    write: setClientThemeState,
    apply: applyClientTheme,
  },
  handedness: {
    storageKey: HANDEDNESS_STORAGE_KEY,
    changedEventName: HANDEDNESS_CHANGED_EVENT,
    init: initClientHandedness,
    read: getClientHandedness,
    resolve: resolveHandedness,
    write: setClientHandednessState,
    apply: applyClientHandedness,
  },
  remoteAutoHide: {
    storageKey: REMOTE_AUTO_HIDE_STORAGE_KEY,
    changedEventName: REMOTE_AUTO_HIDE_CHANGED_EVENT,
    init: initClientRemoteAutoHide,
    read: getClientRemoteAutoHide,
    resolve: resolveRemoteAutoHide,
    write: setClientRemoteAutoHideState,
    apply: applyClientRemoteAutoHide,
  },
  remoteVisibility: {
    storageKey: REMOTE_VISIBILITY_STORAGE_KEY,
    changedEventName: REMOTE_VISIBILITY_CHANGED_EVENT,
    init: initClientRemoteVisibilityState,
    read: () => resolveRemoteVisibilityState(),
    resolve: resolveRemoteVisibilityState,
    write: setClientRemoteVisibilityObjectState,
    apply: applyClientRemoteVisibilityState,
  },
  browserVisibility: {
    storageKey: BROWSER_VISIBILITY_STORAGE_KEY,
    changedEventName: BROWSER_VISIBILITY_CHANGED_EVENT,
    init: initClientBrowserVisibilityState,
    read: () => resolveBrowserVisibilityState(),
    resolve: resolveBrowserVisibilityState,
    write: setClientBrowserVisibilityObjectState,
    apply: applyClientBrowserVisibilityState,
  },
};

function cloneValue(value) {
  if (value && typeof value === 'object') {
    return structuredClone(value);
  }

  return value;
}

export class PreferenceView {
  #preferences;
  #pubsub;
  #storageKeyIndex;
  #initialized;

  constructor(preferences, pubsub) {
    this.#preferences = preferences;
    this.#pubsub = pubsub;
    this.#storageKeyIndex = new Map();
    this.#initialized = false;

    for (const [name, definition] of Object.entries(PREFERENCE_DEFINITIONS)) {
      this.#storageKeyIndex.set(definition.storageKey, {
        name,
        definition,
      });
    }
  }

  init() {
    if (this.#initialized) {
      return this;
    }

    for (const definition of Object.values(PREFERENCE_DEFINITIONS)) {
      definition.init();
    }

    this.#preferences.subscribe((payload) => {
      this.#handleStorageChange(payload);
    });

    this.#initialized = true;
    return this;
  }

  #publish(definition, value, previousValue) {
    this.#pubsub.publish(definition.changedEventName, {
      value: cloneValue(value),
      previousValue: cloneValue(previousValue),
    });
  }

  #handleStorageChange({key, value, previousValue}) {
    const entry = this.#storageKeyIndex.get(key);
    if (!entry) {
      return;
    }

    const nextValue = entry.definition.apply(value);
    const previousResolvedValue = entry.definition.resolve(previousValue);
    this.#publish(entry.definition, nextValue, previousResolvedValue);
  }

  #read(name) {
    return PREFERENCE_DEFINITIONS[name].read();
  }

  #write(name, value) {
    const definition = PREFERENCE_DEFINITIONS[name];
    const previousValue = definition.read();
    const nextValue = definition.write(value);
    this.#publish(definition, nextValue, previousValue);
    return nextValue;
  }

  getTheme() {
    return this.#read('theme');
  }

  setTheme(theme) {
    return this.#write('theme', theme);
  }

  onThemeChange(listener) {
    return this.#pubsub.subscribe(THEME_CHANGED_EVENT, listener);
  }

  getHandedness() {
    return this.#read('handedness');
  }

  setHandedness(handedness) {
    return this.#write('handedness', handedness);
  }

  onHandednessChange(listener) {
    return this.#pubsub.subscribe(HANDEDNESS_CHANGED_EVENT, listener);
  }

  getRemoteAutoHide() {
    return this.#read('remoteAutoHide');
  }

  setRemoteAutoHide(value) {
    return this.#write('remoteAutoHide', value);
  }

  onRemoteAutoHideChange(listener) {
    return this.#pubsub.subscribe(REMOTE_AUTO_HIDE_CHANGED_EVENT, listener);
  }

  getRemoteVisibility(remoteId, fallback = true) {
    return getClientRemoteVisibility(remoteId, fallback);
  }

  setRemoteVisibility(remoteId, value) {
    const state = this.#read('remoteVisibility');
    const nextState = {
      ...state,
      [remoteId]: Boolean(value),
    };
    this.#write('remoteVisibility', nextState);
    return Boolean(value);
  }

  onRemoteVisibilityChange(listener) {
    return this.#pubsub.subscribe(REMOTE_VISIBILITY_CHANGED_EVENT, listener);
  }

  getBrowserVisibility(browserId, fallback = true) {
    return getClientBrowserVisibility(browserId, fallback);
  }

  setBrowserVisibility(browserId, value) {
    const state = this.#read('browserVisibility');
    const nextState = {
      ...state,
      [browserId]: Boolean(value),
    };
    this.#write('browserVisibility', nextState);
    return Boolean(value);
  }

  onBrowserVisibilityChange(listener) {
    return this.#pubsub.subscribe(BROWSER_VISIBILITY_CHANGED_EVENT, listener);
  }
}

export {PREFERENCES_STORAGE_CHANGED_EVENT};
