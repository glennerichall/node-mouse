import {jest} from '@jest/globals';
import {THEME_STORAGE_KEY} from '../../client/preferences/constants.js';

const storeState = {
  theme: 'dark',
  handedness: 'right',
  remoteAutoHide: true,
  remoteVisibility: {},
  browserVisibility: {},
};

const switcherCalls = {
  theme: [],
  handedness: [],
  remoteAutoHide: [],
};

jest.unstable_mockModule('../../client/preferences/store.js', () => ({
  applyClientBrowserVisibilityState: jest.fn((value) => value),
  applyClientHandedness: jest.fn((value) => String(value || '').trim().toLowerCase() || 'right'),
  applyClientRemoteAutoHide: jest.fn((value) => value !== 'false' && value !== false),
  applyClientRemoteVisibilityState: jest.fn((value) => value),
  applyClientTheme: jest.fn((value) => String(value || '').trim().toLowerCase() || 'dark'),
  getClientBrowserVisibility: jest.fn((browserId, fallback = true) => (
    Object.hasOwn(storeState.browserVisibility, browserId)
      ? Boolean(storeState.browserVisibility[browserId])
      : Boolean(fallback)
  )),
  getClientHandedness: jest.fn(() => storeState.handedness),
  getClientRemoteAutoHide: jest.fn(() => storeState.remoteAutoHide),
  getClientRemoteVisibility: jest.fn((remoteId, fallback = true) => (
    Object.hasOwn(storeState.remoteVisibility, remoteId)
      ? Boolean(storeState.remoteVisibility[remoteId])
      : Boolean(fallback)
  )),
  getClientTheme: jest.fn(() => storeState.theme),
  initClientBrowserVisibilityState: jest.fn(() => storeState.browserVisibility),
  initClientHandedness: jest.fn(() => storeState.handedness),
  initClientRemoteAutoHide: jest.fn(() => storeState.remoteAutoHide),
  initClientRemoteVisibilityState: jest.fn(() => storeState.remoteVisibility),
  initClientTheme: jest.fn(() => storeState.theme),
  resolveBrowserVisibilityState: jest.fn((value = storeState.browserVisibility) => value && typeof value === 'object' ? value : {}),
  resolveHandedness: jest.fn((value = storeState.handedness) => String(value || '').trim().toLowerCase() || 'right'),
  resolveRemoteAutoHide: jest.fn((value = storeState.remoteAutoHide) => value !== 'false' && value !== false),
  resolveRemoteVisibilityState: jest.fn((value = storeState.remoteVisibility) => value && typeof value === 'object' ? value : {}),
  resolveTheme: jest.fn((value = storeState.theme) => String(value || '').trim().toLowerCase() || 'dark'),
  setClientBrowserVisibilityState: jest.fn((browserId, value) => {
    storeState.browserVisibility[browserId] = Boolean(value);
    return Boolean(value);
  }),
  setClientBrowserVisibilityObjectState: jest.fn((value) => {
    storeState.browserVisibility = value;
    return value;
  }),
  setClientHandednessState: jest.fn((value) => {
    storeState.handedness = value;
    return value;
  }),
  setClientRemoteAutoHideState: jest.fn((value) => {
    storeState.remoteAutoHide = Boolean(value);
    return Boolean(value);
  }),
  setClientRemoteVisibilityState: jest.fn((remoteId, value) => {
    storeState.remoteVisibility[remoteId] = Boolean(value);
    return Boolean(value);
  }),
  setClientRemoteVisibilityObjectState: jest.fn((value) => {
    storeState.remoteVisibility = value;
    return value;
  }),
  setClientThemeState: jest.fn((value) => {
    storeState.theme = value;
    return value;
  }),
}));

jest.unstable_mockModule('../../client/ui/preferences/switchers.js', () => ({
  mountThemeSwitcher: jest.fn((payload) => {
    switcherCalls.theme.push(payload);
  }),
  mountHandednessSwitcher: jest.fn((payload) => {
    switcherCalls.handedness.push(payload);
  }),
  mountRemoteAutoHideSwitcher: jest.fn((payload) => {
    switcherCalls.remoteAutoHide.push(payload);
  }),
}));

describe('preferences service', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
    storeState.theme = 'dark';
    storeState.handedness = 'right';
    storeState.remoteAutoHide = true;
    storeState.remoteVisibility = {};
    storeState.browserVisibility = {};
    switcherCalls.theme.length = 0;
    switcherCalls.handedness.length = 0;
    switcherCalls.remoteAutoHide.length = 0;
  });

  it('keeps storage transport raw and lets the preference view publish business events', async () => {
    const listeners = new Map();
    const pubsub = {
      publish(eventName, payload) {
        const handlers = listeners.get(eventName) || [];
        for (const handler of handlers) {
          handler(payload);
        }
      },
      subscribe(eventName, listener) {
        const handlers = listeners.get(eventName) || [];
        handlers.push(listener);
        listeners.set(eventName, handlers);
        return () => {};
      },
    };

    const {createPreferencesService} = await import('../../client/services/preferences/createPreferencesService.js');
    const {PreferenceView} = await import('../../client/services/preferences/PreferenceView.js');
    const service = createPreferencesService({
      getPubSub: () => pubsub,
    });
    const view = new PreferenceView(service, pubsub).init();

    const onThemeChange = jest.fn();
    const onRemoteVisibilityChange = jest.fn();

    view.onThemeChange(onThemeChange);
    view.onRemoteVisibilityChange(onRemoteVisibilityChange);

    expect(view.setTheme('light')).toBe('light');
    expect(onThemeChange).toHaveBeenCalledWith({
      value: 'light',
      previousValue: 'dark',
    });

    expect(view.setRemoteVisibility('browser', false)).toBe(false);
    expect(onRemoteVisibilityChange).toHaveBeenCalledWith({
      value: expect.objectContaining({
        browser: false,
      }),
      previousValue: {},
    });
  });

  it('publishes raw storage updates without embedding preference business rules', async () => {
    const events = [];
    const pubsub = {
      publish(eventName, payload) {
        events.push({eventName, payload});
      },
      subscribe() {
        return () => {};
      },
    };

    const {createPreferencesService} = await import('../../client/services/preferences/createPreferencesService.js');
    const service = createPreferencesService({
      getPubSub: () => pubsub,
    });

    expect(service.write(THEME_STORAGE_KEY, 'light')).toBe('light');
    expect(events.at(-1)).toEqual({
      eventName: 'preferences-storage:changed',
      payload: {
        key: THEME_STORAGE_KEY,
        value: 'light',
        previousValue: '',
      },
    });
  });
});
