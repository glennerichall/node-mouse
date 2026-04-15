export const APP_STATE_PROPERTY_CHANGED_EVENT = 'app-state.property.changed';

export const APP_STATE_PREVIEW_ACTIVITY_AT = 'ui.previewActivityAt';
export const APP_STATE_KEYBOARD_PREVIEW_ACTIVE = 'ui.keyboardPreviewActive';
export const APP_STATE_REMOTE_ACCORDION_EXPANDED_PANEL = 'ui.remoteAccordionExpandedPanel';

export const APP_STATE_THEME = 'preferences.theme';
export const APP_STATE_LOCALE = 'preferences.locale';
export const APP_STATE_HANDEDNESS = 'preferences.handedness';
export const APP_STATE_REMOTE_AUTO_HIDE = 'preferences.remoteAutoHide';
export const APP_STATE_REMOTE_VISIBILITY = 'preferences.remoteVisibility';
export const APP_STATE_BROWSER_VISIBILITY = 'preferences.browserVisibility';

export const APP_STATE_EFFECTIVE_BROWSER_REMOTE_VISIBLE = 'effective.remote.browser.visible';
export const APP_STATE_EFFECTIVE_KEYBOARD_REMOTE_VISIBLE = 'effective.remote.keyboard.visible';
export const APP_STATE_EFFECTIVE_VLC_REMOTE_VISIBLE = 'effective.remote.vlc.visible';
export const APP_STATE_EFFECTIVE_SAMSUNG_REMOTE_VISIBLE = 'effective.remote.samsung.visible';
export const APP_STATE_EFFECTIVE_PREVIEW_REMOTE_VISIBLE = 'effective.remote.preview.visible';

export const EFFECTIVE_APP_STATE_KEYS = [
  APP_STATE_EFFECTIVE_BROWSER_REMOTE_VISIBLE,
  APP_STATE_EFFECTIVE_KEYBOARD_REMOTE_VISIBLE,
  APP_STATE_EFFECTIVE_VLC_REMOTE_VISIBLE,
  APP_STATE_EFFECTIVE_SAMSUNG_REMOTE_VISIBLE,
  APP_STATE_EFFECTIVE_PREVIEW_REMOTE_VISIBLE,
];

export function getAppStatePropertyChangedEventName(property) {
  return `app-state.${String(property || '').trim()}.changed`;
}
