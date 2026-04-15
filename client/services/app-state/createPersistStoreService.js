import {createStorageBinding} from './localStorageBinding.js';
import {getPersistStateDefinitions} from './stateDefinitions.js';

function cloneValue(value) {
  return value && typeof value === 'object' ? structuredClone(value) : value;
}

export function createPersistStoreService() {
  const definitions = new Map(getPersistStateDefinitions());
  const storageKeyIndex = new Map();
  const state = {};
  const listeners = new Set();
  let initialized = false;
  let storageBound = false;

  for (const [key, definition] of definitions.entries()) {
    storageKeyIndex.set(definition.storageKey, {key, definition});
    state[key] = cloneValue(definition.defaultValue);
  }

  function notify(key, value, previousValue) {
    const payload = {
      key,
      value: cloneValue(value),
      previousValue: cloneValue(previousValue),
      state: getSnapshot(),
    };

    for (const listener of listeners) {
      listener(payload);
    }
  }

  function applyValue(key, value) {
    const previousValue = state[key];
    if (Object.is(previousValue, value)) {
      return value;
    }

    state[key] = cloneValue(value);
    notify(key, value, previousValue);
    return value;
  }

  function readStorageValue(definition) {
    const rawValue = createStorageBinding(definition.storageKey).read();
    return definition.normalize(rawValue || definition.defaultValue);
  }

  function bindStorageSync() {
    if (storageBound || typeof window === 'undefined') {
      return;
    }

    window.addEventListener('storage', (event) => {
      const entry = storageKeyIndex.get(event.key);
      if (!entry) {
        return;
      }

      applyValue(entry.key, entry.definition.normalize(event.newValue || entry.definition.defaultValue));
    });

    storageBound = true;
  }

  function init() {
    if (initialized) {
      return;
    }

    for (const [key, definition] of definitions.entries()) {
      state[key] = readStorageValue(definition);
    }
    bindStorageSync();
    initialized = true;
  }

  function get(key) {
    init();
    return cloneValue(state[key]);
  }

  function getSnapshot() {
    init();
    return Object.fromEntries(
      Object.entries(state).map(([key, value]) => [key, cloneValue(value)]),
    );
  }

  function set(key, value) {
    init();
    const definition = definitions.get(key);
    if (!definition) {
      throw new Error(`Unknown persisted app state key: ${key}`);
    }

    const normalizedValue = definition.normalize(value);
    const storage = createStorageBinding(definition.storageKey);
    storage.write(definition.serialize(normalizedValue));
    return applyValue(key, normalizedValue);
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') {
      return () => {};
    }

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  return {
    init,
    get,
    getSnapshot,
    set,
    subscribe,
  };
}
