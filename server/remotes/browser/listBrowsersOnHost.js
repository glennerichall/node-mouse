import os from 'node:os';
import { listBrowsersDarwin } from './platforms/darwin.js';
import { listBrowsersLinux } from './platforms/linux.js';
import { listBrowsersWin32 } from './platforms/win32.js';

export async function listBrowsersOnHost() {
  const platform = os.platform();

  if (platform === 'linux') {
    return listBrowsersLinux();
  }

  if (platform === 'darwin') {
    return listBrowsersDarwin();
  }

  if (platform === 'win32') {
    return listBrowsersWin32();
  }

  return [];
}

