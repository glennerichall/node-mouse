import {localeRegistry} from '../../i18n/locale-registry.js';

function applySwitcherLabelStyle(label) {
  label.style.fontSize = '12px';
  label.style.color = 'var(--muted)';
}

function applySwitcherSelectStyle(select) {
  select.style.fontSize = '12px';
  select.style.borderRadius = '8px';
  select.style.padding = '3px 8px';
  select.style.border = '1px solid var(--border, rgba(255, 255, 255, 0.16))';
  select.style.background = 'var(--panel-strong, rgba(255, 255, 255, 0.08))';
  select.style.color = 'var(--text)';
}

function ensureSwitcherRoot({
  rootSelector,
  rootDatasetKey,
  labelDatasetKey,
  selectDatasetKey,
  hostSelectors,
}) {
  const host = hostSelectors
    .map((selector) => document.querySelector(selector))
    .find(Boolean);

  let root = document.querySelector(rootSelector);
  if (!root) {
    root = document.createElement('div');
    root.dataset[rootDatasetKey] = 'true';
    root.style.display = 'flex';
    root.style.alignItems = 'center';
    root.style.gap = '6px';

    const label = document.createElement('span');
    label.dataset[labelDatasetKey] = 'true';
    applySwitcherLabelStyle(label);

    const select = document.createElement('select');
    select.dataset[selectDatasetKey] = 'true';
    applySwitcherSelectStyle(select);

    root.append(label, select);
    (host || document.body).appendChild(root);
  }

  return root;
}

export function mountLanguageSwitcher({locale, t, onChange}) {
  const root = ensureSwitcherRoot({
    rootSelector: '[data-language-switcher]',
    rootDatasetKey: 'languageSwitcher',
    labelDatasetKey: 'languageLabel',
    selectDatasetKey: 'languageSelect',
    hostSelectors: ['[data-client-prefs-host]', '[data-language-switcher-host]'],
  });

  const select = root.querySelector('[data-language-select]');
  if (select && select.options.length === 0) {
    for (const nextLocale of Object.keys(localeRegistry)) {
      const option = document.createElement('option');
      option.value = nextLocale;
      option.textContent = localeRegistry[nextLocale].label;
      select.appendChild(option);
    }

    if (typeof onChange === 'function') {
      select.addEventListener('change', () => {
        void onChange(select.value);
      });
    }
  }

  if (select) {
    select.value = locale;
    select.setAttribute('aria-label', t('common.language'));
  }

  const label = root.querySelector('[data-language-label]');
  if (label) {
    label.textContent = t('common.languageShort');
  }
}

export function mountThemeSwitcher({theme, t, onChange}) {
  const root = ensureSwitcherRoot({
    rootSelector: '[data-theme-switcher]',
    rootDatasetKey: 'themeSwitcher',
    labelDatasetKey: 'themeLabel',
    selectDatasetKey: 'themeSelect',
    hostSelectors: ['[data-client-prefs-host]', '[data-language-switcher-host]'],
  });

  const select = root.querySelector('[data-theme-select]');
  if (select && select.options.length === 0) {
    for (const nextTheme of ['dark', 'light']) {
      const option = document.createElement('option');
      option.value = nextTheme;
      select.appendChild(option);
    }

    if (typeof onChange === 'function') {
      select.addEventListener('change', () => {
        onChange(select.value);
      });
    }
  }

  if (select) {
    select.value = theme;
    select.setAttribute('aria-label', t('common.theme'));
    for (const option of select.options) {
      option.textContent = t(`common.theme.${option.value}`);
    }
  }

  const label = root.querySelector('[data-theme-label]');
  if (label) {
    label.textContent = t('common.themeShort');
  }
}

export function mountHandednessSwitcher({handedness, t, onChange}) {
  const root = ensureSwitcherRoot({
    rootSelector: '[data-handedness-switcher]',
    rootDatasetKey: 'handednessSwitcher',
    labelDatasetKey: 'handednessLabel',
    selectDatasetKey: 'handednessSelect',
    hostSelectors: ['[data-client-prefs-host]', '[data-language-switcher-host]'],
  });

  const select = root.querySelector('[data-handedness-select]');
  if (select && select.options.length === 0) {
    for (const nextHandedness of ['right', 'left']) {
      const option = document.createElement('option');
      option.value = nextHandedness;
      select.appendChild(option);
    }

    if (typeof onChange === 'function') {
      select.addEventListener('change', () => {
        onChange(select.value);
      });
    }
  }

  if (select) {
    select.value = handedness;
    select.setAttribute('aria-label', t('common.handedness'));
    for (const option of select.options) {
      option.textContent = t(`common.handedness.${option.value}`);
    }
  }

  const label = root.querySelector('[data-handedness-label]');
  if (label) {
    label.textContent = t('common.handednessShort');
  }
}

export function mountRemoteAutoHideSwitcher({enabled, t, onChange}) {
  const root = ensureSwitcherRoot({
    rootSelector: '[data-remote-auto-hide-switcher]',
    rootDatasetKey: 'remoteAutoHideSwitcher',
    labelDatasetKey: 'remoteAutoHideLabel',
    selectDatasetKey: 'remoteAutoHideSelect',
    hostSelectors: ['[data-remote-auto-hide-host]', '[data-client-prefs-host]', '[data-language-switcher-host]'],
  });

  const select = root.querySelector('[data-remote-auto-hide-select]');
  if (select && select.options.length === 0) {
    for (const [value, key] of [['true', 'common.enabled'], ['false', 'common.disabled']]) {
      const option = document.createElement('option');
      option.value = value;
      option.dataset.i18nKey = key;
      select.appendChild(option);
    }

    if (typeof onChange === 'function') {
      select.addEventListener('change', () => {
        onChange(select.value === 'true');
      });
    }
  }

  if (select) {
    select.value = enabled ? 'true' : 'false';
    select.setAttribute('aria-label', t('common.remoteAutoHide'));
    for (const option of select.options) {
      option.textContent = t(option.dataset.i18nKey);
    }
  }

  const label = root.querySelector('[data-remote-auto-hide-label]');
  if (label) {
    label.textContent = t('common.remoteAutoHideShort');
  }
}
