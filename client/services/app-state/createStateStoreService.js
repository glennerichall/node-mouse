import {getStateStoreDefinitions} from './stateDefinitions.js';

function cloneValue(value) {
  return value && typeof value === 'object' ? structuredClone(value) : value;
}

export function createStateStoreService() {
  const state = Object.fromEntries(
    getStateStoreDefinitions().map(([key, definition]) => [key, cloneValue(definition.defaultValue)]),
  );
  const listeners = new Set();

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

  function get(key) {
    return cloneValue(state[key]);
  }

  function getSnapshot() {
    return Object.fromEntries(
      Object.entries(state).map(([key, value]) => [key, cloneValue(value)]),
    );
  }

  function set(key, value) {
    const previousValue = state[key];
    if (Object.is(previousValue, value)) {
      return value;
    }

    state[key] = cloneValue(value);
    notify(key, value, previousValue);
    return value;
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
    get,
    getSnapshot,
    set,
    subscribe,
  };
}
