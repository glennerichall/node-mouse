import {
  getClientBrowserVisibility,
  getClientRemoteVisibility,
  setClientBrowserVisibility,
  setClientRemoteVisibility,
} from './index.js';

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

export function createRemoteVisibilityRow(remote, t) {
  const serverEnabled = remote?.enabled !== false;
  const labelText = t(remote.labelKey);
  const {row, select} = createVisibilityRowBase(labelText, labelText);

  appendBooleanOptions(select, t);
  select.value = serverEnabled && getClientRemoteVisibility(remote.id, true) ? 'true' : 'false';
  select.disabled = !serverEnabled;
  select.addEventListener('change', () => {
    setClientRemoteVisibility(remote.id, select.value === 'true');
  });

  return row;
}

export function createBrowserVisibilityRow(browser, t) {
  const serverEnabled = browser?.enabled !== false;
  const labelText = String(browser.shortLabel || browser.name || browser.id);
  const {row, select} = createVisibilityRowBase(labelText, String(browser.name || browser.id));

  appendBooleanOptions(select, t);
  select.value = serverEnabled && getClientBrowserVisibility(browser.id, true) ? 'true' : 'false';
  select.disabled = !serverEnabled;
  select.addEventListener('change', () => {
    setClientBrowserVisibility(browser.id, select.value === 'true');
  });

  return row;
}
