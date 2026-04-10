import {mergeAvailableRemotes} from './state.js';

async function loadJson(url) {
  const response = await fetch(url, {cache: 'no-store'});
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

export async function loadAvailableRemotes(services = null) {
  const payload = services
    ? await services.getRemotes().loadAvailableRemotes().then((remotes) => ({remotes}))
    : await loadJson('/api/admin/remotes');
  return mergeAvailableRemotes(Array.isArray(payload?.remotes) ? payload.remotes : []);
}

export async function loadAvailableBrowsers(services = null) {
  const payload = services
    ? await services.getRemotes().loadAvailableBrowsers().then((browsers) => ({browsers}))
    : await loadJson('/api/admin/remotes/browsers');
  return Array.isArray(payload?.browsers) ? payload.browsers : [];
}
