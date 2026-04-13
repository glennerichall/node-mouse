import {
  loadAvailableBrowsers,
  loadAvailableRemotes,
} from '../preferences/load.js';
import {
  renderBrowserVisibilityList as renderBrowserVisibilityListView,
  renderRemoteVisibilityList as renderRemoteVisibilityListView,
} from '../preferences/render.js';
import {createPreferencesState} from '../preferences/state.js';
import {createServicesRegistry} from '../services/createServicesRegistry.js';
import {initializeCoreServices} from '../services/createServicesContainer.js';
import {bindPreferenceSwitchers} from './preferences/bind-preference-switchers.js';

const services = createServicesRegistry();
await initializeCoreServices(services);
services.getI18n().translateRoot(document);
bindPreferenceSwitchers(services);

const remotesRoot = document.getElementById('preferences-remotes');
const browsersRoot = document.getElementById('preferences-browsers');
const state = createPreferencesState();

function t(key, params) {
  return services.getI18n().t(key, params);
}

function renderRemotes() {
  renderRemoteVisibilityListView(remotesRoot, state.availableRemotes, t);
}

function renderBrowsers() {
  renderBrowserVisibilityListView(browsersRoot, state.availableBrowsers, t);
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

services.getPreferenceView().onRemoteVisibilityChange(() => {
  renderRemotes();
});

services.getPreferenceView().onBrowserVisibilityChange(() => {
  renderBrowsers();
});

await refreshAvailableRemotes();
await refreshAvailableBrowsers();
