import {applyPageTranslations, getClientI18n, initClientI18n, mountLanguageSwitcher, onClientI18nChange} from '../i18n/index.js';

await initClientI18n();
mountLanguageSwitcher();

const form = document.getElementById('config-form');
const statusNode = document.getElementById('config-status');
const reloadButton = document.getElementById('reload-config');
const restartButton = document.getElementById('restart-service');
const sectionTemplate = document.getElementById('section-template');
const fieldTemplate = document.getElementById('field-template');
applyPageTranslations(document);

function t(key, params) {
  return getClientI18n().t(key, params);
}

function translateOr(key, fallback = '') {
  const value = t(key);
  return value === key ? fallback : value;
}

let currentSchema = {};
let currentDefaults = {};
let currentConfig = {};
const syncTimers = new Map();
let configStream = null;
let configSubscriptionId = '';
let configReloadInFlight = false;
let configReloadPending = false;
let configMutationDepth = 0;
let pendingConfigEventPayload = null;
const collapsedSections = new Set();
const fieldContexts = new Map();

function getValueAtPath(source, dottedPath) {
  return String(dottedPath || '')
    .split('.')
    .filter(Boolean)
    .reduce((cursor, segment) => (cursor == null ? undefined : cursor[segment]), source);
}

function setStatus(message, tone = '') {
  statusNode.textContent = message;
  statusNode.className = tone ? `status-${tone}` : '';
}

function updateBooleanLabel(input) {
  const copy = input?.closest('.toggle-row')?.querySelector('.toggle-copy');
  if (copy) {
    copy.textContent = input.checked ? t('adminConfig.toggleActive') : t('adminConfig.toggleInactive');
  }
}

function valuesMatch(left, right) {
  return left === right;
}

function normalizeFieldValue(field, rawValue) {
  if (field.type === 'boolean') {
    return Boolean(rawValue);
  }

  if (field.type === 'integer') {
    const parsed = Number.parseInt(String(rawValue), 10);
    return Number.isFinite(parsed) ? parsed : rawValue;
  }

  if (field.type === 'number') {
    const parsed = Number.parseFloat(String(rawValue));
    return Number.isFinite(parsed) ? parsed : rawValue;
  }

  return String(rawValue ?? '').trim();
}

function getInputControl(fieldControlNode, field) {
  if (field.type === 'boolean') {
    return fieldControlNode.querySelector('input');
  }

  return fieldControlNode.querySelector('input, select');
}

function getCurrentInputValue(input, field) {
  if (!input) {
    return undefined;
  }

  return normalizeFieldValue(field, field.type === 'boolean' ? input.checked : input.value);
}

function setInputValue(input, field, value) {
  if (!input) {
    return;
  }

  if (field.type === 'boolean') {
    input.checked = Boolean(value);
    updateBooleanLabel(input);
    return;
  }

  input.value = value ?? '';
}

function syncResetButtonVisibility({input, field, defaultValue, resetButton}) {
  resetButton.hidden = valuesMatch(getCurrentInputValue(input, field), defaultValue);
}

function setActionsDisabled(disabled) {
  reloadButton.disabled = disabled;
  restartButton.disabled = disabled;
}

function isSamsungAutoResolveEnabled() {
  return Boolean(getValueAtPath(currentConfig, 'samsungTv.alwaysAutoResolve'));
}

function syncSamsungFieldAvailability(pathKey, input, resetButton) {
  const shouldDisable = isSamsungAutoResolveEnabled()
    && (pathKey === 'samsungTv.host' || pathKey === 'samsungTv.mac');
  if (!input) {
    return;
  }
  input.disabled = shouldDisable;
  resetButton.disabled = shouldDisable;
}

function syncSamsungFieldsAvailability() {
  for (const [pathKey, context] of fieldContexts.entries()) {
    syncSamsungFieldAvailability(pathKey, context.input, context.resetButton);
  }
}

function syncSectionCollapseState(sectionNode, sectionKey, toggleButton) {
  const collapsed = collapsedSections.has(sectionKey);
  sectionNode.classList.toggle('is-collapsed', collapsed);
  toggleButton.setAttribute('aria-expanded', String(!collapsed));
  const label = collapsed ? t('adminConfig.showSectionLabel') : t('adminConfig.hideSectionLabel');
  toggleButton.setAttribute('aria-label', label);
  toggleButton.setAttribute('title', label);
  toggleButton.textContent = collapsed ? t('adminConfig.showSection') : t('adminConfig.hideSection');
}

function beginConfigMutation() {
  configMutationDepth += 1;
}

function endConfigMutation() {
  configMutationDepth = Math.max(0, configMutationDepth - 1);
  if (configMutationDepth === 0 && pendingConfigEventPayload) {
    queueMicrotask(() => {
      applyConfigEventPayload(pendingConfigEventPayload);
    });
  } else if (configMutationDepth === 0 && configReloadPending) {
    queueMicrotask(() => {
      refreshConfigFromServer({silent: true});
    });
  }
}

function setConfigValue(pathKey, value) {
  const segments = String(pathKey || '').split('.').filter(Boolean);
  if (!segments.length) {
    return;
  }

  let cursor = currentConfig;
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    if (!cursor[segment] || typeof cursor[segment] !== 'object' || Array.isArray(cursor[segment])) {
      cursor[segment] = {};
    }
    cursor = cursor[segment];
  }

  cursor[segments[segments.length - 1]] = value;
}

async function patchField(pathKey, value) {
  const response = await fetch(`/api/admin/configs/${encodeURIComponent(pathKey)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({value}),
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload.message || `Erreur de synchronisation pour ${pathKey}.`);
  }

  applyConfigEntry(pathKey, payload.config?.value);
  return payload;
}

async function saveConfigEntries(entries) {
  beginConfigMutation();
  setActionsDisabled(true);

  try {
    for (const [pathKey, value] of entries) {
      await patchField(pathKey, value);
    }
  } finally {
    setActionsDisabled(false);
    endConfigMutation();
  }
}

function applyConfigEntry(pathKey, value) {
  setConfigValue(pathKey, value);
  const context = fieldContexts.get(pathKey);
  if (!context) {
    return;
  }

  const existingTimer = syncTimers.get(pathKey);
  if (existingTimer) {
    clearTimeout(existingTimer);
    syncTimers.delete(pathKey);
  }

  setInputValue(context.input, context.field, value);
  syncResetButtonVisibility(context);
  syncSamsungFieldAvailability(pathKey, context.input, context.resetButton);
}

function applyConfigEventPayload(payload) {
  if (configMutationDepth > 0) {
    pendingConfigEventPayload = payload;
    return;
  }

  pendingConfigEventPayload = null;
  const entries = Array.isArray(payload?.entries) ? payload.entries : [];
  if (!entries.length) {
    refreshConfigFromServer({silent: true});
    return;
  }

  for (const entry of entries) {
    if (!entry?.path) {
      continue;
    }
    applyConfigEntry(entry.path, entry.value);
  }

  syncSamsungFieldsAvailability();
}

function formatSamsungDeviceLabel(device, index) {
  const parts = [
    `${index + 1}.`,
    device.name || t('adminConfig.unnamedSamsung'),
    device.model ? `(${device.model})` : '',
    device.host ? `IP ${device.host}` : '',
    device.mac ? `MAC ${device.mac}` : '',
  ].filter(Boolean);
  return parts.join(' ');
}

async function discoverSamsungDevice() {
  setStatus(t('adminConfig.statusSamsungDiscovering'), 'pending');

  const response = await fetch('/api/admin/configs/samsung/discover', {
    method: 'POST',
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload.message || t('adminConfig.statusSamsungDiscoverError'));
  }

  const devices = Array.isArray(payload.devices) ? payload.devices : [];
  if (!devices.length) {
    throw new Error(t('adminConfig.statusSamsungNone'));
  }

  let selectedIndex = devices.findIndex((device) => device.isSelected);
  if (devices.length === 1) {
    const accepted = window.confirm(
      t('adminConfig.samsungSinglePrompt', {
        label: formatSamsungDeviceLabel(devices[0], 0),
      }),
    );
    if (!accepted) {
      setStatus(t('adminConfig.statusSamsungCancelled'));
      return;
    }
    selectedIndex = 0;
  } else {
    const suggestedIndex = selectedIndex >= 0 ? selectedIndex + 1 : 1;
    const choice = window.prompt(
      t('adminConfig.samsungMultiPrompt', {
        choices: devices.map(formatSamsungDeviceLabel).join('\n'),
      }),
      String(suggestedIndex),
    );
    if (choice == null) {
      setStatus(t('adminConfig.statusSamsungCancelled'));
      return;
    }

    selectedIndex = Number.parseInt(String(choice).trim(), 10) - 1;
    if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= devices.length) {
      throw new Error(t('adminConfig.statusSamsungInvalidSelection'));
    }
  }

  const selectedDevice = devices[selectedIndex];
  await saveConfigEntries([
    ['samsungTv.host', selectedDevice.host || ''],
    ['samsungTv.mac', selectedDevice.mac || ''],
  ]);
  setStatus(t('adminConfig.statusSamsungApplied', {
    name: selectedDevice.name || selectedDevice.host || t('common.unknown'),
  }), 'success');
}

async function syncField({pathKey, field, input, defaultValue, resetButton}) {
  const nextValue = getCurrentInputValue(input, field);
  const currentValue = getValueAtPath(currentConfig, pathKey);

  syncResetButtonVisibility({input, field, defaultValue, resetButton});
  if (valuesMatch(nextValue, currentValue)) {
    return;
  }

  beginConfigMutation();
  setActionsDisabled(true);
  setStatus(t('adminConfig.statusSyncing', {path: pathKey}), 'pending');

  try {
    const payload = await patchField(pathKey, valuesMatch(nextValue, defaultValue) ? null : nextValue);
    syncResetButtonVisibility({input, field, defaultValue, resetButton});
    setStatus(payload.message || `${pathKey} synchronized.`, 'success');
  } catch (error) {
    setStatus(error.message || t('adminConfig.statusSyncError'), 'error');
  } finally {
    setActionsDisabled(false);
    endConfigMutation();
  }
}

function scheduleFieldSync(context, {immediate = false} = {}) {
  const existingTimer = syncTimers.get(context.pathKey);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  if (immediate) {
    syncTimers.delete(context.pathKey);
    syncField(context);
    return;
  }

  const timer = window.setTimeout(() => {
    syncTimers.delete(context.pathKey);
    syncField(context);
  }, 350);

  syncTimers.set(context.pathKey, timer);
}

function createInput(pathKey, field, value) {
  if (field.type === 'boolean') {
    const wrapper = document.createElement('span');
    wrapper.className = 'toggle-row';

    const copy = document.createElement('span');
    copy.className = 'toggle-copy';
    copy.textContent = value ? t('adminConfig.toggleActive') : t('adminConfig.toggleInactive');

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = pathKey;
    input.checked = Boolean(value);
    input.addEventListener('change', () => {
      copy.textContent = input.checked ? t('adminConfig.toggleActive') : t('adminConfig.toggleInactive');
    });

    wrapper.append(copy, input);
    return wrapper;
  }

  if (Array.isArray(field.options) && field.options.length > 0) {
    const select = document.createElement('select');
    select.name = pathKey;

    for (const optionValue of field.options) {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = optionValue;
      option.selected = String(value ?? '') === optionValue;
      select.append(option);
    }

    return select;
  }

  const input = document.createElement('input');
  input.name = pathKey;
  input.placeholder = field.placeholder || '';
  input.value = value ?? '';

  if (field.type === 'number' || field.type === 'integer') {
    input.type = 'number';
    if (field.min !== undefined) {
      input.min = String(field.min);
    }
    if (field.max !== undefined) {
      input.max = String(field.max);
    }
    if (field.step !== undefined) {
      input.step = String(field.step);
    }
  } else {
    input.type = 'text';
  }

  return input;
}

function renderConfigForm(config, schema) {
  currentConfig = config || {};
  fieldContexts.clear();
  form.replaceChildren();

  for (const [sectionKey, section] of Object.entries(schema)) {
    if (!collapsedSections.has(sectionKey)) {
      collapsedSections.add(sectionKey);
    }

    const sectionNode = sectionTemplate.content.firstElementChild.cloneNode(true);
    sectionNode.querySelector('.section-key').textContent = sectionKey;
    sectionNode.querySelector('h2').textContent = translateOr(`adminConfig.section.${sectionKey}.title`, section.title);
    sectionNode.querySelector('.section-description').textContent = translateOr(`adminConfig.section.${sectionKey}.description`, section.description || '');
    const sectionToggleButton = sectionNode.querySelector('.section-toggle');

    const fieldsNode = sectionNode.querySelector('.section-fields');

    if (sectionKey === 'samsungTv') {
      const sectionActionsNode = document.createElement('div');
      sectionActionsNode.className = 'section-actions';
      const discoverButton = document.createElement('button');
      discoverButton.type = 'button';
      discoverButton.className = 'section-action-button';
      discoverButton.textContent = t('adminConfig.detectSamsung');
      discoverButton.addEventListener('click', () => {
        discoverSamsungDevice().catch((error) => {
          setStatus(error.message || t('adminConfig.statusSamsungDiscoverError'), 'error');
        });
      });
      sectionActionsNode.append(discoverButton);
      fieldsNode.append(sectionActionsNode);
    }

    for (const [fieldKey, field] of Object.entries(section.fields)) {
      const pathKey = `${sectionKey}.${fieldKey}`;
      const currentValue = getValueAtPath(currentConfig, pathKey);
      const defaultValue = getValueAtPath(currentDefaults, pathKey);
      const fieldNode = fieldTemplate.content.firstElementChild.cloneNode(true);
      fieldNode.querySelector('.field-label').textContent = translateOr(`adminConfig.field.${pathKey}`, field.label);
      fieldNode.querySelector('.field-path').textContent = pathKey;
      const fieldControlNode = fieldNode.querySelector('.field-control');
      fieldControlNode.append(createInput(pathKey, field, currentValue));

      const resetButton = fieldNode.querySelector('.field-reset');
      const input = getInputControl(fieldControlNode, field);
      const syncVisibility = () => syncResetButtonVisibility({
        input,
        field,
        defaultValue,
        resetButton,
      });
      const fieldContext = {
        pathKey,
        field,
        input,
        defaultValue,
        resetButton,
      };
      fieldContexts.set(pathKey, fieldContext);

      input?.addEventListener('input', () => {
        syncVisibility();
        if (field.type !== 'boolean') {
          scheduleFieldSync(fieldContext);
        }
      });
      input?.addEventListener('change', () => {
        syncVisibility();
        scheduleFieldSync(fieldContext, {immediate: true});
      });
      syncVisibility();
      syncSamsungFieldAvailability(pathKey, input, resetButton);

      resetButton.addEventListener('click', () => {
        resetField({
          pathKey,
          field,
          input,
          defaultValue,
          resetButton,
        });
      });

      fieldsNode.append(fieldNode);
    }

    sectionToggleButton.addEventListener('click', () => {
      if (collapsedSections.has(sectionKey)) {
        collapsedSections.delete(sectionKey);
      } else {
        collapsedSections.add(sectionKey);
      }
      syncSectionCollapseState(sectionNode, sectionKey, sectionToggleButton);
    });
    syncSectionCollapseState(sectionNode, sectionKey, sectionToggleButton);

    form.append(sectionNode);
  }
}

function refreshLocalizedTexts() {
  applyPageTranslations(document);
  renderConfigForm(currentConfig, currentSchema);
}

function collectFormValues(schema) {
  const values = {};

  for (const [sectionKey, section] of Object.entries(schema)) {
    for (const [fieldKey, field] of Object.entries(section.fields)) {
      const pathKey = `${sectionKey}.${fieldKey}`;
      const input = form.elements.namedItem(pathKey);
      if (!input) {
        continue;
      }

      values[pathKey] = normalizeFieldValue(field, field.type === 'boolean' ? input.checked : input.value);
    }
  }

  return values;
}

function getConfigObjectFromEntries(entries) {
  const config = {};

  for (const entry of entries || []) {
    if (!entry || !entry.id) {
      continue;
    }

    const segments = String(entry.id).split('.').filter(Boolean);
    let cursor = config;
    for (let index = 0; index < segments.length - 1; index += 1) {
      const segment = segments[index];
      if (!cursor[segment] || typeof cursor[segment] !== 'object' || Array.isArray(cursor[segment])) {
        cursor[segment] = {};
      }
      cursor = cursor[segment];
    }
    cursor[segments[segments.length - 1]] = entry.value;
  }

  return config;
}

async function loadConfig({silent = false} = {}) {
  if (!silent) {
    setStatus(t('adminConfig.statusLoading'), 'pending');
  }

  const response = await fetch('/api/admin/configs', {cache: 'no-store'});
  if (!response.ok) {
    throw new Error(t('adminConfig.statusLoadError'));
  }

  const payload = await response.json();
  currentSchema = payload.schema || {};
  currentDefaults = payload.defaults || {};
  renderConfigForm(getConfigObjectFromEntries(payload.configs || []), currentSchema);
  if (!silent) {
    setStatus(t('adminConfig.statusLoaded'));
  }
}

async function refreshConfigFromServer({silent = false} = {}) {
  if (configReloadInFlight || configMutationDepth > 0) {
    configReloadPending = true;
    return;
  }

  configReloadInFlight = true;
  configReloadPending = false;

  try {
    await loadConfig({silent});
  } catch (error) {
    setStatus(error.message || t('adminConfig.statusLoadError'), 'error');
  } finally {
    configReloadInFlight = false;
    if (configReloadPending && configMutationDepth === 0) {
      queueMicrotask(() => {
        refreshConfigFromServer({silent: true});
      });
    }
  }
}

async function subscribeToConfigEvents() {
  if (typeof window.EventSource !== 'function') {
    return;
  }

  const response = await fetch('/api/admin/subs/configs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({scope: 'config'}),
  });
  if (!response.ok) {
    throw new Error(t('adminConfig.statusSseCreateError'));
  }

  const payload = await response.json();
  configSubscriptionId = String(payload.id || '');
  if (!configSubscriptionId || !payload.eventsUrl) {
    throw new Error(t('adminConfig.statusSseInvalid'));
  }

  configStream?.close();
  configStream = new EventSource(payload.eventsUrl);
  configStream.addEventListener('config.changed', (event) => {
    try {
      applyConfigEventPayload(JSON.parse(event.data || '{}'));
    } catch (_error) {
      refreshConfigFromServer({silent: true});
    }
  });
}

function unsubscribeFromConfigEvents() {
  if (!configSubscriptionId) {
    return;
  }

  fetch(`/api/admin/subs/${encodeURIComponent(configSubscriptionId)}`, {
    method: 'DELETE',
    keepalive: true,
  }).catch(() => {});
  configSubscriptionId = '';
}

async function resetField({pathKey, field, input, defaultValue, resetButton}) {
  const existingTimer = syncTimers.get(pathKey);
  if (existingTimer) {
    clearTimeout(existingTimer);
    syncTimers.delete(pathKey);
  }

  beginConfigMutation();
  setActionsDisabled(true);
  setStatus(t('adminConfig.statusResetting', {path: pathKey}), 'pending');

  try {
    const response = await fetch(`/api/admin/configs/${encodeURIComponent(pathKey)}`, {
      method: 'DELETE',
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.message || t('adminConfig.statusResetError'));
    }

    setConfigValue(pathKey, payload.config?.value);
    setInputValue(input, field, payload.config?.value);
    syncResetButtonVisibility({input, field, defaultValue, resetButton});
    setStatus(payload.message || `${pathKey} reset.`, 'success');
  } catch (error) {
    setStatus(error.message || t('adminConfig.statusResetError'), 'error');
  } finally {
    setActionsDisabled(false);
    endConfigMutation();
  }
}

async function restartService() {
  setActionsDisabled(true);
  setStatus(t('adminConfig.statusRestarting'), 'pending');

  try {
    const response = await fetch('/api/admin/restart-service', {
      method: 'POST',
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.message || t('adminConfig.statusRestartError'));
    }

    setStatus(payload.message || t('adminConfig.statusRestartRequested'), 'success');
  } catch (error) {
    setStatus(error.message || t('adminConfig.statusRestartError'), 'error');
  } finally {
    setActionsDisabled(false);
  }
}

reloadButton.addEventListener('click', () => {
  refreshConfigFromServer().catch((error) => {
    setStatus(error.message || t('adminConfig.statusLoadError'), 'error');
  });
});

restartButton.addEventListener('click', () => {
  restartService();
});

refreshConfigFromServer().catch((error) => {
  setStatus(error.message || t('adminConfig.statusLoadError'), 'error');
});
subscribeToConfigEvents().catch(() => {});
window.addEventListener('beforeunload', () => {
  configStream?.close();
  unsubscribeFromConfigEvents();
});

onClientI18nChange(() => {
  refreshLocalizedTexts();
});
