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
    ? {remotes: await services.getRemotes().loadAvailableRemotes()}
    : await loadJson('/api/admin/remotes');
  return mergeAvailableRemotes(Array.isArray(payload?.remotes) ? payload.remotes : []);
}

export async function loadAvailableBrowsers(services = null) {
  const payload = services
    ? {browsers: await services.getRemotes().loadAvailableBrowsers()}
    : await loadJson('/api/admin/remotes/browsers');
  return Array.isArray(payload?.browsers) ? payload.browsers : [];
}
