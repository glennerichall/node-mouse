const form = document.getElementById('config-form');
const statusNode = document.getElementById('config-status');
const saveButton = document.getElementById('save-config');
const reloadButton = document.getElementById('reload-config');
const sectionTemplate = document.getElementById('section-template');
const fieldTemplate = document.getElementById('field-template');

let currentSchema = {};

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

function createInput(pathKey, field, value) {
  if (field.type === 'boolean') {
    const wrapper = document.createElement('span');
    wrapper.className = 'toggle-row';

    const copy = document.createElement('span');
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
  form.replaceChildren();

  for (const [sectionKey, section] of Object.entries(schema)) {
    const sectionNode = sectionTemplate.content.firstElementChild.cloneNode(true);
    sectionNode.querySelector('.section-key').textContent = sectionKey;
    sectionNode.querySelector('h2').textContent = section.title;
    sectionNode.querySelector('.section-description').textContent = section.description || '';

    const fieldsNode = sectionNode.querySelector('.section-fields');

    for (const [fieldKey, field] of Object.entries(section.fields)) {
      const pathKey = `${sectionKey}.${fieldKey}`;
      const fieldNode = fieldTemplate.content.firstElementChild.cloneNode(true);
      fieldNode.querySelector('.field-label').textContent = field.label;
      fieldNode.querySelector('.field-path').textContent = pathKey;
      fieldNode.querySelector('.field-control').append(createInput(pathKey, field, getValueAtPath(config, pathKey)));
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

      values[pathKey] = field.type === 'boolean' ? input.checked : input.value;
    }
  }

  return values;
}

async function loadConfig() {
  setStatus('Chargement de la configuration...', 'pending');

  const response = await fetch('/admin/config/data', {cache: 'no-store'});
  if (!response.ok) {
    throw new Error('Impossible de charger la configuration.');
  }

  const payload = await response.json();
  currentSchema = payload.schema || {};
  renderConfigForm(payload.config || {}, currentSchema);
  setStatus('Configuration chargee.');
}

async function saveConfig() {
  saveButton.disabled = true;
  reloadButton.disabled = true;
  setStatus('Enregistrement en cours...', 'pending');

  try {
    const response = await fetch('/admin/config/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: collectFormValues(currentSchema),
      }),
    });

    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.message || 'Erreur de sauvegarde.');
    }

    renderConfigForm(payload.config || {}, currentSchema);
    setStatus(payload.message || 'Configuration enregistree.', 'success');
  } catch (error) {
    setStatus(error.message || 'Erreur de sauvegarde.', 'error');
  } finally {
    saveButton.disabled = false;
    reloadButton.disabled = false;
  }
}

saveButton.addEventListener('click', () => {
  saveConfig();
});

reloadButton.addEventListener('click', () => {
  loadConfig().catch((error) => {
    setStatus(error.message || 'Erreur de chargement.', 'error');
  });
});

loadConfig().catch((error) => {
  setStatus(error.message || 'Erreur de chargement.', 'error');
});
