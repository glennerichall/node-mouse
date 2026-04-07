import {
  applyPageTranslations,
  getClientI18n,
  getClientRemoteVisibility,
  initClientHandedness,
  initClientI18n,
  initClientRemoteAutoHide,
  initClientRemoteVisibilityState,
  initClientTheme,
  mountClientPreferences,
  mountRemoteAutoHideSwitcher,
  onClientI18nChange,
  onClientRemoteVisibilityChange,
  setClientRemoteVisibility,
} from '../i18n/index.js';

await initClientI18n();
initClientTheme();
initClientHandedness();
initClientRemoteAutoHide();
initClientRemoteVisibilityState();
applyPageTranslations(document);
mountClientPreferences();
mountRemoteAutoHideSwitcher();

const remotesRoot = document.getElementById('preferences-remotes');
let availableRemotes = [];
const LOCAL_REMOTE_DEFINITIONS = [
  { id: 'keyboard', labelKey: 'preferences.remote.keyboard' },
];

function mergeAvailableRemotes(remotes = []) {
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

function t(key, params) {
  return getClientI18n().t(key, params);
}

function createRemoteVisibilityRow(remote) {
  const serverEnabled = remote?.enabled !== false;
  const row = document.createElement('div');
  row.className = 'preferences-remote-row';

  const label = document.createElement('span');
  label.className = 'preferences-remote-label';
  label.textContent = t(remote.labelKey);

  const select = document.createElement('select');
  select.className = 'preferences-remote-select';
  select.setAttribute('aria-label', t(remote.labelKey));

  for (const [value, key] of [
    ['true', 'common.enabled'],
    ['false', 'common.disabled'],
  ]) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = t(key);
    select.appendChild(option);
  }

  select.value = serverEnabled && getClientRemoteVisibility(remote.id, true) ? 'true' : 'false';
  select.disabled = !serverEnabled;
  select.addEventListener('change', () => {
    setClientRemoteVisibility(remote.id, select.value === 'true');
  });

  row.appendChild(label);
  row.appendChild(select);
  return row;
}

function renderRemoteVisibilityList() {
  if (!remotesRoot) {
    return;
  }

  remotesRoot.innerHTML = '';
  for (const remote of availableRemotes) {
    remotesRoot.appendChild(createRemoteVisibilityRow(remote));
  }
}

async function loadAvailableRemotes() {
  const response = await fetch('/api/admin/remotes', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = await response.json();
  availableRemotes = mergeAvailableRemotes(Array.isArray(payload?.remotes) ? payload.remotes : []);
  renderRemoteVisibilityList();
}

onClientI18nChange(() => {
  applyPageTranslations(document);
  mountClientPreferences();
  mountRemoteAutoHideSwitcher();
  renderRemoteVisibilityList();
});

onClientRemoteVisibilityChange(() => {
  renderRemoteVisibilityList();
});

await loadAvailableRemotes();
