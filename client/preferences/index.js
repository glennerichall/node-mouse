import {
  BROWSER_VISIBILITY_CHANGED_EVENT,
  HANDEDNESS_CHANGED_EVENT,
  REMOTE_AUTO_HIDE_CHANGED_EVENT,
  REMOTE_VISIBILITY_CHANGED_EVENT,
  THEME_CHANGED_EVENT,
} from './constants.js';
import {createWindowEventListener} from '../core/window-events.js';
import {
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
  setClientBrowserVisibilityState,
  setClientHandednessState,
  setClientRemoteAutoHideState,
  setClientRemoteVisibilityState,
  setClientThemeState,
} from './store.js';
import {
  mountHandednessSwitcher as mountHandednessSwitcherView,
  mountRemoteAutoHideSwitcher as mountRemoteAutoHideSwitcherView,
  mountThemeSwitcher as mountThemeSwitcherView,
} from '../ui/preferences/switchers.js';

export {
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
};

export function setClientTheme(theme, i18n) {
  const normalizedTheme = setClientThemeState(theme);
  mountClientPreferences(i18n);
  return normalizedTheme;
}

export function setClientHandedness(handedness, i18n) {
  const normalizedHandedness = setClientHandednessState(handedness);
  mountClientPreferences(i18n);
  return normalizedHandedness;
}

export function setClientRemoteAutoHide(value, i18n) {
  const normalizedValue = setClientRemoteAutoHideState(value);
  mountRemoteAutoHideSwitcher(i18n);
  return normalizedValue;
}

export function setClientRemoteVisibility(remoteId, value) {
  return setClientRemoteVisibilityState(remoteId, value);
}

export function setClientBrowserVisibility(browserId, value) {
  return setClientBrowserVisibilityState(browserId, value);
}

export function mountRemoteAutoHideSwitcher(i18n) {
  mountRemoteAutoHideSwitcherView({
    enabled: getClientRemoteAutoHide(),
    t: i18n.t,
    onChange(value) {
    setClientRemoteAutoHide(value, i18n);
    },
  });
}

export function mountThemeSwitcher(i18n) {
  mountThemeSwitcherView({
    theme: getClientTheme(),
    t: i18n.t,
    onChange(theme) {
    setClientTheme(theme, i18n);
    },
  });
}

export function mountHandednessSwitcher(i18n) {
  mountHandednessSwitcherView({
    handedness: getClientHandedness(),
    t: i18n.t,
    onChange(handedness) {
    setClientHandedness(handedness, i18n);
    },
  });
}

export function mountClientPreferences(i18n) {
  mountThemeSwitcher(i18n);
  mountHandednessSwitcher(i18n);
}

export const onClientThemeChange = createWindowEventListener(THEME_CHANGED_EVENT);
export const onClientHandednessChange = createWindowEventListener(HANDEDNESS_CHANGED_EVENT);
export const onClientRemoteAutoHideChange = createWindowEventListener(REMOTE_AUTO_HIDE_CHANGED_EVENT);
export const onClientRemoteVisibilityChange = createWindowEventListener(REMOTE_VISIBILITY_CHANGED_EVENT);
export const onClientBrowserVisibilityChange = createWindowEventListener(BROWSER_VISIBILITY_CHANGED_EVENT);
