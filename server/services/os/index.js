import os from 'node:os';
import {createLinuxOsAdapter} from './platforms/linux/index.js';
import {createDarwinOsAdapter} from './platforms/darwin/index.js';
import {createWin32OsAdapter} from './platforms/win32/index.js';
import {createFallbackAdapter} from './platforms/createFallbackAdapter.js';

export function createOsService() {
  const platform = os.platform();
  const adapter = platform === 'linux'
    ? createLinuxOsAdapter()
    : platform === 'darwin'
      ? createDarwinOsAdapter()
      : platform === 'win32'
        ? createWin32OsAdapter()
        : createFallbackAdapter();

  return {
    platform,
    app: adapter.app,
    window: adapter.window,
    url: adapter.url,
  };
}
