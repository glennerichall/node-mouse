export const REMOTE_EVENT_MOUSE_MOVE = 'mouse/movements';
export const REMOTE_EVENT_MOUSE_CLICK = 'mouse/clicks';
export const REMOTE_EVENT_MOUSE_BUTTON = 'mouse/buttons';
export const REMOTE_EVENT_MOUSE_SCROLL = 'mouse/scrolls';

export const REMOTE_EVENT_KEYBOARD_TEXT = 'keyboard/texts';
export const REMOTE_EVENT_KEYBOARD_KEY = 'keyboard/keys';

export const REMOTE_EVENT_PREVIEW_START = 'preview/sessions';
export const REMOTE_EVENT_PREVIEW_STOP = 'preview/sessions';
export const REMOTE_EVENT_SYSTEM_RELOAD = 'system/reload';

export const REMOTE_EVENT_BROWSER_OPEN = 'browser/sessions';
export const REMOTE_EVENT_VLC_OPEN = 'vlc/window';
export const REMOTE_EVENT_VLC_COMMAND = 'vlc/commands';
export const REMOTE_EVENT_VLC_WINDOW_TOGGLE = 'vlc/window';
export const REMOTE_EVENT_VLC_WINDOW_CLOSE = 'vlc/window';
export const REMOTE_EVENT_WINDOW_TOGGLE_MAXIMIZE = 'window';
export const REMOTE_EVENT_WINDOW_CLOSE = 'window';

export const REMOTE_EVENT_SAMSUNG_ON = 'samsung/power';
export const REMOTE_EVENT_SAMSUNG_OFF = 'samsung/power';
export const REMOTE_EVENT_SAMSUNG_VOL_UP = 'samsung/volume';
export const REMOTE_EVENT_SAMSUNG_VOL_DOWN = 'samsung/volume';
export const REMOTE_EVENT_SAMSUNG_MUTE = 'samsung/audio';
export const REMOTE_EVENT_SAMSUNG_INPUT = 'samsung/input';
export const REMOTE_EVENT_SAMSUNG_ENTER = 'samsung/keys';
export const REMOTE_EVENT_SAMSUNG_PC_INPUT = 'samsung/input';

export const REMOTE_EVENT_ADMIN_PREFIX = 'admin/';
export const REMOTE_EVENT_ADMIN_RESULT = 'admin/result';
export const REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_SERVER = 'admin/server-info/browser';
export const REMOTE_EVENT_ADMIN_UPDATE_CHECK = 'admin/update';
export const REMOTE_EVENT_ADMIN_UPDATE_INSTALL = 'admin/update';
export const REMOTE_EVENT_ADMIN_SERVICE_RESTART = 'admin/service';
export const REMOTE_EVENT_QR_OPEN_BROWSER_SERVER = 'qr/browser';
export const REMOTE_EVENT_QR_OPEN_BROWSER_CLIENT = 'qr/browser';
export const REMOTE_EVENT_QR_ROTATE_ENTRY_TOKEN = 'qr/entry-token';
export const REMOTE_EVENT_QR_TOGGLE_OVERLAY = 'qr/overlay';
// Legacy event names remain server-side aliases for clients loaded before 6.18.3.
export const REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_SERVER = 'admin/open-qr-browser-server';
export const REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_CLIENT = 'admin/open-qr-browser-client';
export const REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_CLIENT = 'admin/open-server-info-browser-client';
export const REMOTE_EVENT_ADMIN_ROTATE_ENTRY_TOKEN = 'admin/rotate-entry-token';
export const REMOTE_EVENT_ADMIN_TOGGLE_QR_OVERLAY = 'admin/toggle-qr-overlay';
