import fs from 'node:fs';
import net from 'node:net';
import {getCliSocketPath} from './getCliSocketPath.js';

function cleanupStaleSocket(socketPath, error) {
  if (process.platform === 'win32') {
    return false;
  }

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

export async function sendCliCommand(command) {
  const socketPath = getCliSocketPath();

  return new Promise((resolve, reject) => {
    const socket = net.createConnection(socketPath);
    let response = '';

    socket.setEncoding('utf8');

    socket.on('connect', () => {
      socket.end(String(command || '').trim());
    });

    socket.on('data', (chunk) => {
      response += chunk;
    });

    socket.on('end', () => {
      try {
        resolve(JSON.parse(response.trim() || '{}'));
      } catch (error) {
        reject(error);
      }
    });

    socket.on('error', (error) => {
      const staleSocketRemoved = cleanupStaleSocket(socketPath, error);

      if (staleSocketRemoved) {
        reject(new Error(`Service indisponible. Le socket stale a été supprimé: ${socketPath}`));
        return;
      }

      reject(error);
    });
  });
}
