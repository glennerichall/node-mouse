export const APP_STATE_PROPERTY_CHANGED_EVENT = 'app-state.property.changed';
export const APP_STATE_PREVIEW_ACTIVITY_AT = 'previewActivityAt';
export const APP_STATE_KEYBOARD_PREVIEW_ACTIVE = 'keyboardPreviewActive';
export const APP_STATE_REMOTE_ACCORDION_EXPANDED_PANEL = 'remoteAccordionExpandedPanel';

export function getAppStatePropertyChangedEventName(property) {
  return `app-state.${String(property || '').trim()}.changed`;
}

const DEFAULT_APP_STATE = {
  [APP_STATE_PREVIEW_ACTIVITY_AT]: 0,
  [APP_STATE_KEYBOARD_PREVIEW_ACTIVE]: false,
  [APP_STATE_REMOTE_ACCORDION_EXPANDED_PANEL]: '',
};

export function createAppStateService() {
  const state = {...DEFAULT_APP_STATE};
  const listeners = new Set();
  const propertyListeners = new Map();

  function get(property) {
    return state[property];
  }

  function getSnapshot() {
    return {...state};
  }

  function notify(property, value, previousValue) {
    const payload = {
      property,
      value,
      previousValue,
      state: getSnapshot(),
    };

    for (const listener of listeners) {
      listener(payload);
    }

    for (const listener of propertyListeners.get(property) || []) {
      listener(payload);
    }
  }

  function set(property, value) {
    const previousValue = state[property];
    if (Object.is(previousValue, value)) {
      return value;
    }

    state[property] = value;
    notify(property, value, previousValue);
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

  function subscribeProperty(property, listener) {
    if (typeof listener !== 'function') {
      return () => {};
    }

    const listenersForProperty = propertyListeners.get(property) || new Set();
    listenersForProperty.add(listener);
    propertyListeners.set(property, listenersForProperty);

    return () => {
      listenersForProperty.delete(listener);
      if (!listenersForProperty.size) {
        propertyListeners.delete(property);
      }
    };
  }

  return {
    get,
    getSnapshot,
    set,
    subscribe,
    subscribeProperty,
  };
}
