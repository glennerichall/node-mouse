import {
  loadAvailableBrowsers,
  loadAvailableRemotes,
} from '../../preferences/load.js';
import {
  renderBrowserVisibilityList as renderBrowserVisibilityListView,
  renderRemoteVisibilityList as renderRemoteVisibilityListView,
} from '../../preferences/render.js';
import {createPreferencesState} from '../../preferences/state.js';
import {createServicesRegistry} from '../../services/createServicesRegistry.js';
import {initializeCoreServices} from '../../services/createServicesContainer.js';
import {bindPreferenceSwitchers} from './bindPreferenceSwitchers.js';
import {
  APP_STATE_POINTER_SLOW_SPEED, APP_STATE_POINTER_FAST_SPEED, APP_STATE_POINTER_ACCELERATION,
} from '../../services/app-state/createAppStateService.js';

const services = createServicesRegistry();
await initializeCoreServices(services);
services.getI18n().translateRoot(document);
bindPreferenceSwitchers(services);

const pointerState = services.getAppState();
const pointerSlowSpeed = document.getElementById('pointer-slow-speed');
const pointerFastSpeed = document.getElementById('pointer-fast-speed');
const pointerAcceleration = document.getElementById('pointer-acceleration');
const pointerSlowSpeedValue = document.getElementById('pointer-slow-speed-value');
const pointerFastSpeedValue = document.getElementById('pointer-fast-speed-value');

function formatSpeed(value) {
  return `${Number(value).toFixed(1)}×`;
}

function syncPointerPreferences() {
  const slowSpeed = pointerState.get(APP_STATE_POINTER_SLOW_SPEED);
  const fastSpeed = Math.max(slowSpeed, pointerState.get(APP_STATE_POINTER_FAST_SPEED));
  if (fastSpeed !== pointerState.get(APP_STATE_POINTER_FAST_SPEED)) {
    pointerState.set(APP_STATE_POINTER_FAST_SPEED, fastSpeed);
  }
  pointerSlowSpeed.value = String(slowSpeed);
  pointerFastSpeed.value = String(fastSpeed);
  pointerAcceleration.checked = pointerState.get(APP_STATE_POINTER_ACCELERATION);
  pointerFastSpeed.disabled = !pointerAcceleration.checked;
  pointerSlowSpeed.max = pointerFastSpeed.value;
  pointerFastSpeed.min = pointerSlowSpeed.value;
  pointerSlowSpeedValue.value = formatSpeed(pointerSlowSpeed.value);
  pointerFastSpeedValue.value = formatSpeed(pointerFastSpeed.value);
}
pointerSlowSpeed.addEventListener('input', () => {
  pointerState.set(APP_STATE_POINTER_SLOW_SPEED, pointerSlowSpeed.value);
  if (Number(pointerSlowSpeed.value) > Number(pointerFastSpeed.value)) {
    pointerState.set(APP_STATE_POINTER_FAST_SPEED, pointerSlowSpeed.value);
  }
  syncPointerPreferences();
});
pointerFastSpeed.addEventListener('input', () => {
  pointerState.set(APP_STATE_POINTER_FAST_SPEED, pointerFastSpeed.value);
  if (Number(pointerFastSpeed.value) < Number(pointerSlowSpeed.value)) {
    pointerState.set(APP_STATE_POINTER_SLOW_SPEED, pointerFastSpeed.value);
  }
  syncPointerPreferences();
});
pointerAcceleration.addEventListener('change', () => {
  pointerState.set(APP_STATE_POINTER_ACCELERATION, pointerAcceleration.checked);
  syncPointerPreferences();
});
document.getElementById('pointer-preferences-reset').addEventListener('click', () => {
  pointerState.set(APP_STATE_POINTER_SLOW_SPEED, 1.3);
  pointerState.set(APP_STATE_POINTER_FAST_SPEED, 3);
  pointerState.set(APP_STATE_POINTER_ACCELERATION, true);
  syncPointerPreferences();
});
syncPointerPreferences();

const remotesRoot = document.getElementById('preferences-remotes');
const browsersRoot = document.getElementById('preferences-browsers');
const state = createPreferencesState();

function t(key, params) {
  return services.getI18n().t(key, params);
}

function renderRemotes() {
  renderRemoteVisibilityListView(remotesRoot, state.availableRemotes, t, services);
}

function renderBrowsers() {
  renderBrowserVisibilityListView(browsersRoot, state.availableBrowsers, t, services);
}

async function refreshAvailableRemotes() {
  state.availableRemotes = await loadAvailableRemotes(services);
  renderRemotes();
}

async function refreshAvailableBrowsers() {
  state.availableBrowsers = await loadAvailableBrowsers(services);
  renderBrowsers();
}

services.getI18n().onChange(() => {
  services.getI18n().translateRoot(document);
  bindPreferenceSwitchers(services);
  renderRemotes();
  renderBrowsers();
});

services.getAppState().subscribeProperty('preferences.remoteVisibility', () => {
  renderRemotes();
});

services.getAppState().subscribeProperty('preferences.browserVisibility', () => {
  renderBrowsers();
});

await refreshAvailableRemotes();
await refreshAvailableBrowsers();
