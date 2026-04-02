import os from 'node:os';
import path from 'node:path';

function getSocketName() {
  const uid = typeof process.getuid === 'function' ? process.getuid() : 'default';
  return `remote-mouse-${uid}.sock`;
}

export function getCliSocketPath() {
  if (process.platform === 'win32') {
    return '\\\\.\\pipe\\remote-mouse';
  }

  return path.join(os.tmpdir(), getSocketName());
}
