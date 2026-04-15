import {
  APP_STATE_BROWSER_VISIBILITY,
  APP_STATE_REMOTE_VISIBILITY,
} from '../services/app-state/createAppStateService.js';

function appendBooleanOptions(select, t) {
  for (const [value, key] of [
    ['true', 'common.enabled'],
    ['false', 'common.disabled'],
  ]) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = t(key);
    select.appendChild(option);
  }
}

function createVisibilityRowBase(labelText, ariaLabel) {
  const row = document.createElement('div');
  row.className = 'preferences-remote-row';

  const label = document.createElement('span');
  label.className = 'preferences-remote-label';
  label.textContent = labelText;

  const select = document.createElement('select');
  select.className = 'preferences-remote-select';
  select.setAttribute('aria-label', ariaLabel);

  row.append(label, select);
  return {row, select};
}

function getRecordFlag(record, key, fallback = true) {
  if (record && typeof record === 'object' && Object.hasOwn(record, key)) {
    return Boolean(record[key]);
  }

  return Boolean(fallback);
}

export function createRemoteVisibilityRow(remote, t, services) {
  const appState = services.getAppState();
  const serverEnabled = remote?.enabled !== false;
  const labelText = t(remote.labelKey);
  const {row, select} = createVisibilityRowBase(labelText, labelText);

  appendBooleanOptions(select, t);
  select.value = serverEnabled && getRecordFlag(appState.get(APP_STATE_REMOTE_VISIBILITY), remote.id, true) ? 'true' : 'false';
  select.disabled = !serverEnabled;
  select.addEventListener('change', () => {
    appState.set(APP_STATE_REMOTE_VISIBILITY, {
      ...appState.get(APP_STATE_REMOTE_VISIBILITY),
      [remote.id]: select.value === 'true',
    });
  });

  return row;
}

export function createBrowserVisibilityRow(browser, t, services) {
  const appState = services.getAppState();
  const serverEnabled = browser?.enabled !== false;
  const labelText = String(browser.shortLabel || browser.name || browser.id);
  const {row, select} = createVisibilityRowBase(labelText, String(browser.name || browser.id));

  appendBooleanOptions(select, t);
  select.value = serverEnabled && getRecordFlag(appState.get(APP_STATE_BROWSER_VISIBILITY), browser.id, true) ? 'true' : 'false';
  select.disabled = !serverEnabled;
  select.addEventListener('change', () => {
    appState.set(APP_STATE_BROWSER_VISIBILITY, {
      ...appState.get(APP_STATE_BROWSER_VISIBILITY),
      [browser.id]: select.value === 'true',
    });
  });

  return row;
}
