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
  APP_STATE_POINTER_SPEED, APP_STATE_POINTER_ACCELERATION,
  APP_STATE_POINTER_ACCELERATION_STRENGTH,
} from '../../services/app-state/createAppStateService.js';

const services = createServicesRegistry();
await initializeCoreServices(services);
services.getI18n().translateRoot(document);
bindPreferenceSwitchers(services);

const pointerState = services.getAppState();
const pointerSpeed = document.getElementById('pointer-speed');
const pointerAcceleration = document.getElementById('pointer-acceleration');
const pointerStrength = document.getElementById('pointer-acceleration-strength');
function syncPointerPreferences() {
  pointerSpeed.value = String(pointerState.get(APP_STATE_POINTER_SPEED));
  pointerAcceleration.checked = pointerState.get(APP_STATE_POINTER_ACCELERATION);
  pointerStrength.value = String(pointerState.get(APP_STATE_POINTER_ACCELERATION_STRENGTH));
  pointerStrength.disabled = !pointerAcceleration.checked;
}
pointerSpeed.addEventListener('input', () => pointerState.set(APP_STATE_POINTER_SPEED, pointerSpeed.value));
pointerAcceleration.addEventListener('change', () => {
  pointerState.set(APP_STATE_POINTER_ACCELERATION, pointerAcceleration.checked);
  syncPointerPreferences();
});
pointerStrength.addEventListener('input', () => pointerState.set(APP_STATE_POINTER_ACCELERATION_STRENGTH, pointerStrength.value));
document.getElementById('pointer-preferences-reset').addEventListener('click', () => {
  pointerState.set(APP_STATE_POINTER_SPEED, 1.3);
  pointerState.set(APP_STATE_POINTER_ACCELERATION, true);
  pointerState.set(APP_STATE_POINTER_ACCELERATION_STRENGTH, 1);
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
