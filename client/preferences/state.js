export const LOCAL_REMOTE_DEFINITIONS = [
  {id: 'keyboard', labelKey: 'preferences.remote.keyboard'},
];

export function createPreferencesState() {
  return {
    availableRemotes: [],
    availableBrowsers: [],
  };
}

export function mergeAvailableRemotes(remotes = []) {
  const byId = new Map();

  for (const remote of remotes) {
    if (!remote?.id) {
      continue;
    }
    byId.set(remote.id, remote);
  }

  for (const remote of LOCAL_REMOTE_DEFINITIONS) {
    if (!byId.has(remote.id)) {
      byId.set(remote.id, remote);
    }
  }

  return Array.from(byId.values());
}
