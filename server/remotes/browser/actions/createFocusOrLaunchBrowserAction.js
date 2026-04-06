import os from 'node:os';
import { focusOrLaunchBrowserLinux } from '../platforms/linux.js';
import { focusOrLaunchBrowserDarwin } from '../platforms/darwin.js';
import { focusOrLaunchBrowserWin32 } from '../platforms/win32.js';

export function createFocusOrLaunchBrowserAction(state) {
  return async function focusOrLaunchBrowser(browserId) {
    if (state.inFlight) {
      return;
    }
    state.inFlight = true;

    try {
      const platform = os.platform();
      if (platform === 'linux') {
        return focusOrLaunchBrowserLinux(browserId);
      }
      if (platform === 'darwin') {
        return focusOrLaunchBrowserDarwin(browserId);
      }
      if (platform === 'win32') {
        return focusOrLaunchBrowserWin32(browserId);
      }
      return false;
    } finally {
      state.inFlight = false;
    }
  };
}
