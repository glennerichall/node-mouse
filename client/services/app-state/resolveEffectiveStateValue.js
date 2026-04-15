import {
  APP_STATE_BROWSER_VISIBILITY,
  APP_STATE_EFFECTIVE_BROWSER_REMOTE_VISIBLE,
  APP_STATE_EFFECTIVE_KEYBOARD_REMOTE_VISIBLE,
  APP_STATE_EFFECTIVE_PREVIEW_REMOTE_VISIBLE,
  APP_STATE_EFFECTIVE_SAMSUNG_REMOTE_VISIBLE,
  APP_STATE_EFFECTIVE_VLC_REMOTE_VISIBLE,
  APP_STATE_REMOTE_VISIBILITY,
} from './appStateKeys.js';

function getConfigSection(config, section) {
  return config?.[section] || {};
}

function getRecordFlag(record, key, fallback = true) {
  if (record && typeof record === 'object' && Object.hasOwn(record, key)) {
    return Boolean(record[key]);
  }

  return Boolean(fallback);
}

export function resolveEffectiveStateValue(key, {stateStore, persistStore, clientConfig}) {
  const config = clientConfig.getConfig();
  const remoteVisibility = persistStore.get(APP_STATE_REMOTE_VISIBILITY);
  const browserVisibility = persistStore.get(APP_STATE_BROWSER_VISIBILITY);

  switch (key) {
    case APP_STATE_EFFECTIVE_BROWSER_REMOTE_VISIBLE:
      return getConfigSection(config, 'browser').enabled !== false
        && getRecordFlag(remoteVisibility, 'browser', true);

    case APP_STATE_EFFECTIVE_KEYBOARD_REMOTE_VISIBLE:
      return getConfigSection(config, 'keyboard').enabled !== false
        && getRecordFlag(remoteVisibility, 'keyboard', true);

    case APP_STATE_EFFECTIVE_VLC_REMOTE_VISIBLE:
      return getConfigSection(config, 'vlc').enabled !== false
        && getRecordFlag(remoteVisibility, 'vlc', true);

    case APP_STATE_EFFECTIVE_SAMSUNG_REMOTE_VISIBLE:
      return getRecordFlag(remoteVisibility, 'samsung', true);

    case APP_STATE_EFFECTIVE_PREVIEW_REMOTE_VISIBLE:
      return getConfigSection(config, 'preview').enabled !== false
        && getRecordFlag(remoteVisibility, 'preview', true);

    default:
      if (key.startsWith('effective.browser.') && key.endsWith('.visible')) {
        const browserId = key.slice('effective.browser.'.length, -'.visible'.length);
        const browserConfig = getConfigSection(config, 'browser');
        return browserConfig.enabled !== false
          && browserConfig?.[browserId] !== false
          && getRecordFlag(browserVisibility, browserId, true);
      }
      return undefined;
  }
}
