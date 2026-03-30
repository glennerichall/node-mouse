import os from 'os';
import { focusOrLaunchBraveLinux } from '../platforms/linux.js';
import { focusOrLaunchBraveDarwin } from '../platforms/darwin.js';
import { focusOrLaunchBraveWin32 } from '../platforms/win32.js';

export function createFocusOrLaunchBraveAction(state) {
  return async function focusOrLaunchBrave() {
    if (state.inFlight) {
      return;
    }
    state.inFlight = true;

    try {
      const platform = os.platform();
      if (platform === 'linux') {
        await focusOrLaunchBraveLinux();
        return;
      }
      if (platform === 'darwin') {
        await focusOrLaunchBraveDarwin();
        return;
      }
      if (platform === 'win32') {
        await focusOrLaunchBraveWin32();
      }
    } finally {
      state.inFlight = false;
    }
  };
}
