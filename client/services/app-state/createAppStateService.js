import {createQueuedRecompute} from '../../../utils/functional.js';
import {
  APP_STATE_HANDEDNESS,
  APP_STATE_PROPERTY_CHANGED_EVENT,
  APP_STATE_REMOTE_AUTO_HIDE,
  APP_STATE_THEME,
  EFFECTIVE_APP_STATE_KEYS,
  getAppStatePropertyChangedEventName,
} from './appStateKeys.js';
import {
  APP_STATE_STORE_PERSIST,
  APP_STATE_STORE_STATE,
  getAppStateDefinition,
} from './stateDefinitions.js';
import {resolveEffectiveStateValue} from './resolveEffectiveStateValue.js';
import {
  applyHandednessToDocument,
  applyRemoteAutoHideToDocument,
  applyThemeToDocument,
} from '../../preferences/effects.js';

export {
  APP_STATE_BROWSER_VISIBILITY,
  APP_STATE_EFFECTIVE_BROWSER_REMOTE_VISIBLE,
  APP_STATE_EFFECTIVE_KEYBOARD_REMOTE_VISIBLE,
  APP_STATE_EFFECTIVE_PREVIEW_REMOTE_VISIBLE,
  APP_STATE_EFFECTIVE_SAMSUNG_REMOTE_VISIBLE,
  APP_STATE_EFFECTIVE_VLC_REMOTE_VISIBLE,
  APP_STATE_HANDEDNESS,
  APP_STATE_KEYBOARD_PREVIEW_ACTIVE,
  APP_STATE_LOCALE,
  APP_STATE_PREVIEW_ACTIVITY_AT,
  APP_STATE_PROPERTY_CHANGED_EVENT,
  APP_STATE_REMOTE_ACCORDION_EXPANDED_PANEL,
  APP_STATE_REMOTE_AUTO_HIDE,
  APP_STATE_REMOTE_VISIBILITY,
  APP_STATE_THEME,
  getAppStatePropertyChangedEventName,
} from './appStateKeys.js';

function cloneValue(value) {
  return value && typeof value === 'object' ? structuredClone(value) : value;
}

function applyPreferenceEffect(key, value) {
  if (key === APP_STATE_THEME) {
    applyThemeToDocument(value);
    return;
  }
  if (key === APP_STATE_HANDEDNESS) {
    applyHandednessToDocument(value);
    return;
  }
  if (key === APP_STATE_REMOTE_AUTO_HIDE) {
    applyRemoteAutoHideToDocument(value);
  }
}

export function createAppStateService(services) {
  const stateStore = services.getStateStore();
  const persistStore = services.getPersistStore();
  const clientConfig = services.getClientConfig();
  const pubsub = services.getPubSub();
  const effectiveCache = new Map();
  const listeners = new Set();
  const propertyListeners = new Map();
  let initialized = false;

  function publishChange(key, value, previousValue) {
    const payload = {
      key,
      property: key,
      value: cloneValue(value),
      previousValue: cloneValue(previousValue),
      state: getSnapshot(),
    };

    for (const listener of listeners) {
      listener(payload);
    }

    for (const listener of propertyListeners.get(key) || []) {
      listener(payload);
    }

    pubsub.publish(APP_STATE_PROPERTY_CHANGED_EVENT, payload);
    pubsub.publish(getAppStatePropertyChangedEventName(key), payload);
  }

  function getRaw(key) {
    const definition = getAppStateDefinition(key);
    if (!definition) {
      return undefined;
    }

    if (definition.store === APP_STATE_STORE_STATE) {
      return stateStore.get(key);
    }
    if (definition.store === APP_STATE_STORE_PERSIST) {
      return persistStore.get(key);
    }

    return undefined;
  }

  function get(key) {
    if (String(key).startsWith('effective.')) {
      return resolveEffectiveStateValue(key, {stateStore, persistStore, clientConfig});
    }

    return getRaw(key);
  }

  function set(key, value) {
    const definition = getAppStateDefinition(key);
    if (!definition) {
      throw new Error(`Unknown app state key: ${key}`);
    }

    const normalizedValue = definition.normalize(value);
    if (definition.store === APP_STATE_STORE_STATE) {
      return stateStore.set(key, normalizedValue);
    }
    if (definition.store === APP_STATE_STORE_PERSIST) {
      return persistStore.set(key, normalizedValue);
    }

    throw new Error(`Read-only app state key: ${key}`);
  }

  function getSnapshot() {
    const snapshot = {
      ...stateStore.getSnapshot(),
      ...persistStore.getSnapshot(),
    };

    for (const key of EFFECTIVE_APP_STATE_KEYS) {
      snapshot[key] = get(key);
    }

    return snapshot;
  }

  const recomputeEffectiveState = createQueuedRecompute(() => {
    for (const key of EFFECTIVE_APP_STATE_KEYS) {
      const nextValue = get(key);
      const previousValue = effectiveCache.get(key);
      if (!Object.is(previousValue, nextValue)) {
        effectiveCache.set(key, cloneValue(nextValue));
        publishChange(key, nextValue, previousValue);
      }
    }
  });

  function handleStoreChange({key, value, previousValue}) {
    applyPreferenceEffect(key, value);
    publishChange(key, value, previousValue);
    recomputeEffectiveState();
  }

  function init() {
    if (initialized) {
      return this;
    }

    persistStore.init();
    stateStore.subscribe(handleStoreChange);
    persistStore.subscribe(handleStoreChange);
    clientConfig.onChange(recomputeEffectiveState);

    for (const key of [APP_STATE_THEME, APP_STATE_HANDEDNESS, APP_STATE_REMOTE_AUTO_HIDE]) {
      applyPreferenceEffect(key, persistStore.get(key));
    }

    recomputeEffectiveState();
    initialized = true;
    return this;
  }

  function subscribe(keyOrListener, maybeListener) {
    if (typeof keyOrListener === 'function') {
      listeners.add(keyOrListener);
      return () => {
        listeners.delete(keyOrListener);
      };
    }

    return subscribeProperty(keyOrListener, maybeListener);
  }

  function subscribeProperty(key, listener) {
    if (typeof listener !== 'function') {
      return () => {};
    }

    const listenersForProperty = propertyListeners.get(key) || new Set();
    listenersForProperty.add(listener);
    propertyListeners.set(key, listenersForProperty);

    return () => {
      listenersForProperty.delete(listener);
      if (!listenersForProperty.size) {
        propertyListeners.delete(key);
      }
    };
  }

  return {
    get,
    getSnapshot,
    init,
    set,
    subscribe,
    subscribeProperty,
  };
}
