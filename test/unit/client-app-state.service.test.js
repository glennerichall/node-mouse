import {
  APP_STATE_EFFECTIVE_BROWSER_REMOTE_VISIBLE,
  APP_STATE_EFFECTIVE_SAMSUNG_REMOTE_VISIBLE,
  APP_STATE_KEYBOARD_PREVIEW_ACTIVE,
  APP_STATE_PREVIEW_ACTIVITY_AT,
  APP_STATE_REMOTE_ACCORDION_EXPANDED_PANEL,
  APP_STATE_REMOTE_VISIBILITY,
  createAppStateService,
  getAppStatePropertyChangedEventName,
} from '../../client/services/app-state/createAppStateService.js';
import {createStateStoreService} from '../../client/services/app-state/createStateStoreService.js';
import {createQueuedRecompute} from '../../utils/functional.js';

function createFakePersistStore(initialState = {}) {
  const state = {
    'preferences.theme': 'dark',
    'preferences.handedness': 'right',
    'preferences.remoteAutoHide': true,
    'preferences.remoteVisibility': {},
    'preferences.browserVisibility': {},
    ...initialState,
  };
  const listeners = new Set();
  return {
    init() {},
    get: (key) => state[key],
    getSnapshot: () => ({...state}),
    set(key, value) {
      const previousValue = state[key];
      state[key] = value;
      for (const listener of listeners) {
        listener({key, value, previousValue, state: {...state}});
      }
      return value;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

function createFakeClientConfig(config = {}) {
  const listeners = new Set();
  let state = config;
  return {
    getConfig: () => state,
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setConfig(nextConfig) {
      state = nextConfig;
      for (const listener of listeners) {
        listener(state);
      }
    },
  };
}

function createAppStateTestHarness({persistState = {}, config = {}} = {}) {
  const pubsubEvents = [];
  const stateStore = createStateStoreService();
  const persistStore = createFakePersistStore(persistState);
  const clientConfig = createFakeClientConfig(config);
  const pubsub = {
    publish(eventName, payload) {
      pubsubEvents.push({eventName, payload});
    },
  };
  const appState = createAppStateService({
    getStateStore: () => stateStore,
    getPersistStore: () => persistStore,
    getClientConfig: () => clientConfig,
    getPubSub: () => pubsub,
  }).init();

  return {appState, clientConfig, pubsubEvents};
}

describe('client app state service', () => {
  it('routes volatile state through the state store and publishes changes', () => {
    const {appState} = createAppStateTestHarness();
    const allChanges = [];
    const keyboardChanges = [];

    appState.subscribe((payload) => {
      allChanges.push(payload);
    });
    appState.subscribeProperty(APP_STATE_KEYBOARD_PREVIEW_ACTIVE, (payload) => {
      keyboardChanges.push(payload);
    });

    expect(appState.getSnapshot()).toEqual(expect.objectContaining({
      [APP_STATE_PREVIEW_ACTIVITY_AT]: 0,
      [APP_STATE_KEYBOARD_PREVIEW_ACTIVE]: false,
      [APP_STATE_REMOTE_ACCORDION_EXPANDED_PANEL]: '',
    }));

    expect(appState.set(APP_STATE_KEYBOARD_PREVIEW_ACTIVE, true)).toBe(true);
    expect(appState.set(APP_STATE_KEYBOARD_PREVIEW_ACTIVE, true)).toBe(true);

    expect(allChanges).toHaveLength(1);
    expect(keyboardChanges).toHaveLength(1);
    expect(keyboardChanges[0]).toEqual(expect.objectContaining({
      key: APP_STATE_KEYBOARD_PREVIEW_ACTIVE,
      property: APP_STATE_KEYBOARD_PREVIEW_ACTIVE,
      value: true,
      previousValue: false,
    }));
  });

  it('computes effective values from persisted state and server config changes', () => {
    const {appState, clientConfig} = createAppStateTestHarness({
      persistState: {
        [APP_STATE_REMOTE_VISIBILITY]: {browser: true},
      },
      config: {
        browser: {enabled: true},
      },
    });
    const effectiveChanges = [];

    appState.subscribeProperty(APP_STATE_EFFECTIVE_BROWSER_REMOTE_VISIBLE, (payload) => {
      effectiveChanges.push(payload);
    });

    expect(appState.get(APP_STATE_EFFECTIVE_BROWSER_REMOTE_VISIBLE)).toBe(true);

    clientConfig.setConfig({browser: {enabled: false}});

    expect(appState.get(APP_STATE_EFFECTIVE_BROWSER_REMOTE_VISIBLE)).toBe(false);
    expect(effectiveChanges.at(-1)).toEqual(expect.objectContaining({
      key: APP_STATE_EFFECTIVE_BROWSER_REMOTE_VISIBLE,
      value: false,
      previousValue: true,
    }));
  });

  it('keeps the samsung remote hidden when the server config disables it', () => {
    const {appState, clientConfig} = createAppStateTestHarness({
      persistState: {
        [APP_STATE_REMOTE_VISIBILITY]: {samsung: true},
      },
      config: {
        samsungTv: {enabled: false},
      },
    });

    expect(appState.get(APP_STATE_EFFECTIVE_SAMSUNG_REMOTE_VISIBLE)).toBe(false);

    clientConfig.setConfig({samsungTv: {enabled: true}});

    expect(appState.get(APP_STATE_EFFECTIVE_SAMSUNG_REMOTE_VISIBLE)).toBe(true);
  });

  it('builds stable pubsub event names for state properties', () => {
    expect(getAppStatePropertyChangedEventName(APP_STATE_PREVIEW_ACTIVITY_AT))
      .toBe('app-state.ui.previewActivityAt.changed');
  });
});

describe('createQueuedRecompute', () => {
  it('runs one pending recompute after a reentrant request', () => {
    let recompute;
    const calls = [];

    recompute = createQueuedRecompute(() => {
      calls.push(calls.length);
      if (calls.length === 1) {
        recompute();
      }
    });

    recompute();

    expect(calls).toEqual([0, 1]);
  });
});
