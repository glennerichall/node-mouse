const form = document.getElementById('config-form');
const statusNode = document.getElementById('config-status');
const reloadButton = document.getElementById('reload-config');
const restartButton = document.getElementById('restart-service');
const sectionTemplate = document.getElementById('section-template');
const fieldTemplate = document.getElementById('field-template');

let currentSchema = {};
let currentDefaults = {};
let currentConfig = {};
const syncTimers = new Map();

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
    copy.textContent = input.checked ? 'Active' : 'Inactif';
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

  setConfigValue(pathKey, payload.config?.value);
  return payload;
}

async function syncField({pathKey, field, input, defaultValue, resetButton}) {
  const nextValue = getCurrentInputValue(input, field);
  const currentValue = getValueAtPath(currentConfig, pathKey);

  syncResetButtonVisibility({input, field, defaultValue, resetButton});
  if (valuesMatch(nextValue, currentValue)) {
    return;
  }

  setActionsDisabled(true);
  setStatus(`Synchronisation de ${pathKey}...`, 'pending');

  try {
    const payload = await patchField(pathKey, valuesMatch(nextValue, defaultValue) ? null : nextValue);
    syncResetButtonVisibility({input, field, defaultValue, resetButton});
    setStatus(payload.message || `${pathKey} synchronized.`, 'success');
  } catch (error) {
    setStatus(error.message || 'Erreur de synchronisation.', 'error');
  } finally {
    setActionsDisabled(false);
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
    copy.textContent = value ? 'Active' : 'Inactif';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = pathKey;
    input.checked = Boolean(value);
    input.addEventListener('change', () => {
      copy.textContent = input.checked ? 'Active' : 'Inactif';
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
  form.replaceChildren();

  for (const [sectionKey, section] of Object.entries(schema)) {
    const sectionNode = sectionTemplate.content.firstElementChild.cloneNode(true);
    sectionNode.querySelector('.section-key').textContent = sectionKey;
    sectionNode.querySelector('h2').textContent = section.title;
    sectionNode.querySelector('.section-description').textContent = section.description || '';

    const fieldsNode = sectionNode.querySelector('.section-fields');

    for (const [fieldKey, field] of Object.entries(section.fields)) {
      const pathKey = `${sectionKey}.${fieldKey}`;
      const currentValue = getValueAtPath(currentConfig, pathKey);
      const defaultValue = getValueAtPath(currentDefaults, pathKey);
      const fieldNode = fieldTemplate.content.firstElementChild.cloneNode(true);
      fieldNode.querySelector('.field-label').textContent = field.label;
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

    form.append(sectionNode);
  }
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

async function loadConfig() {
  setStatus('Chargement de la configuration...', 'pending');

  const response = await fetch('/api/admin/configs', {cache: 'no-store'});
  if (!response.ok) {
    throw new Error('Impossible de charger la configuration.');
  }

  const payload = await response.json();
  currentSchema = payload.schema || {};
  currentDefaults = payload.defaults || {};
  renderConfigForm(getConfigObjectFromEntries(payload.configs || []), currentSchema);
  setStatus('Configuration chargee.');
}

async function resetField({pathKey, field, input, defaultValue, resetButton}) {
  const existingTimer = syncTimers.get(pathKey);
  if (existingTimer) {
    clearTimeout(existingTimer);
    syncTimers.delete(pathKey);
  }

  setActionsDisabled(true);
  setStatus(`Reset de ${pathKey} en cours...`, 'pending');

  try {
    const response = await fetch(`/api/admin/configs/${encodeURIComponent(pathKey)}`, {
      method: 'DELETE',
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.message || 'Reset failed.');
    }

    setConfigValue(pathKey, payload.config?.value);
    setInputValue(input, field, payload.config?.value);
    syncResetButtonVisibility({input, field, defaultValue, resetButton});
    setStatus(payload.message || `${pathKey} reset.`, 'success');
  } catch (error) {
    setStatus(error.message || 'Reset failed.', 'error');
  } finally {
    setActionsDisabled(false);
  }
}

async function restartService() {
  setActionsDisabled(true);
  setStatus('Redemarrage du service en cours...', 'pending');

  try {
    const response = await fetch('/api/admin/restart-service', {
      method: 'POST',
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.message || 'Restart failed.');
    }

    setStatus(payload.message || 'Restart requested.', 'success');
  } catch (error) {
    setStatus(error.message || 'Restart failed.', 'error');
  } finally {
    setActionsDisabled(false);
  }
}

reloadButton.addEventListener('click', () => {
  loadConfig().catch((error) => {
    setStatus(error.message || 'Erreur de chargement.', 'error');
  });
});

restartButton.addEventListener('click', () => {
  restartService();
});

loadConfig().catch((error) => {
  setStatus(error.message || 'Erreur de chargement.', 'error');
});
