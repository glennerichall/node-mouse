import {closeAppWindow, openOrFocusApp, resolveApp, toggleAppWindow} from './app.js';
import {getActiveWindowId, toggleWindow, closeWindow} from './windows.js';
import {openUrl} from './url.js';

export function createLinuxOsAdapter() {
  return {
    app: {
      resolve: resolveApp,
      openOrFocus: openOrFocusApp,
      toggleWindow: toggleAppWindow,
      closeWindow: closeAppWindow,
    },
    window: {
      async toggleActive() {
        const activeWindowId = await getActiveWindowId();
        if (!activeWindowId) {
          return false;
        }
        return toggleWindow(activeWindowId);
      },
      async closeActive() {
        const activeWindowId = await getActiveWindowId();
        if (!activeWindowId) {
          return false;
        }
        return closeWindow(activeWindowId);
      },
    },
    url: {
      open: openUrl,
    },
  };
}
