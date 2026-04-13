import * as darwinCliSocket from '../os/darwin/cliSocket.js';
import * as linuxCliSocket from '../os/linux/cliSocket.js';
import * as win32CliSocket from '../os/win32/cliSocket.js';

const unsupportedCliSocket = {
  getCliSocketPath() {
    return linuxCliSocket.getCliSocketPath();
  },
  prepareCliServerSocket: linuxCliSocket.prepareCliServerSocket,
  cleanupCliServerSocket: linuxCliSocket.cleanupCliServerSocket,
  secureCliServerSocket: linuxCliSocket.secureCliServerSocket,
  cleanupCliClientConnectionError: linuxCliSocket.cleanupCliClientConnectionError,
};

export function getCliSocketAdapter(platform = process.platform) {
  if (platform === 'win32') {
    return win32CliSocket;
  }

  if (platform === 'darwin') {
    return darwinCliSocket;
  }

  if (platform === 'linux') {
    return linuxCliSocket;
  }

  return unsupportedCliSocket;
}
