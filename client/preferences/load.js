import {mergeAvailableRemotes} from './state.js';

function getBackend(services) {
  if (!services || typeof services.getBackend !== 'function') {
    throw new Error('Preferences loaders require a services container.');
  }

  return services.getBackend();
}

export async function loadAvailableRemotes(services) {
  const payload = await getBackend(services).getAvailableRemotes();
  return mergeAvailableRemotes(Array.isArray(payload?.remotes) ? payload.remotes : []);
}

export async function loadAvailableBrowsers(services) {
  const payload = await getBackend(services).getAvailableBrowsers();
  return Array.isArray(payload?.browsers) ? payload.browsers : [];
}
