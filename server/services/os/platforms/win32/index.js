import {closeAppWindow, openOrFocusApp, resolveApp, toggleAppWindow} from './app.js';
import {closeActiveWindow, toggleActiveWindow} from './window.js';
import {openUrl} from './url.js';

export function createWin32OsAdapter() {
  return {
    app: {
      resolve: resolveApp,
      openOrFocus: openOrFocusApp,
      toggleWindow: toggleAppWindow,
      closeWindow: closeAppWindow,
    },
    window: {
      toggleActive: toggleActiveWindow,
      closeActive: closeActiveWindow,
    },
    url: {
      open: openUrl,
    },
  };
}
