import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function getSocketName() {
  const uid = typeof process.getuid === 'function' ? process.getuid() : 'default';
  return `remote-mouse-${uid}.sock`;
}

function removeStaleSocket(socketPath) {
  try {
    fs.unlinkSync(socketPath);
  } catch (_error) {
    // Ignore missing or stale socket cleanup issues.
  }
}

export function getCliSocketPath() {
  return path.join(os.tmpdir(), getSocketName());
}

export function prepareCliServerSocket(socketPath) {
  removeStaleSocket(socketPath);
}

export function cleanupCliServerSocket(socketPath) {
  removeStaleSocket(socketPath);
}

export function secureCliServerSocket(socketPath) {
  try {
    fs.chmodSync(socketPath, 0o600);
  } catch (_error) {
    // Best effort.
  }
}

export function cleanupCliClientConnectionError(socketPath, error) {
  if (error?.code !== 'ECONNREFUSED') {
    return false;
  }

  try {
    if (!fs.existsSync(socketPath)) {
      return false;
    }

    fs.unlinkSync(socketPath);
    return true;
  } catch (_cleanupError) {
    return false;
  }
}
