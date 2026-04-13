const cliPipePath = '\\\\.\\pipe\\remote-mouse';

export function getCliSocketPath() {
  return cliPipePath;
}

export function prepareCliServerSocket() {}

export function cleanupCliServerSocket() {}

export function secureCliServerSocket() {}

export function cleanupCliClientConnectionError() {
  return false;
}
