import net from 'node:net';
import {getCliSocketAdapter} from '../cliSocket.js';

function parseResponseLine(line, state, onLog) {
  const payload = JSON.parse(line);
  if (payload?.type === 'log') {
    if (typeof onLog === 'function') {
      onLog(payload.entry);
    }
    return;
  }

  if (payload?.type === 'result') {
    state.result = payload.result;
    return;
  }

  state.result = payload;
}

export async function sendCliCommand(command, options = {}, {onLog = null} = {}) {
  const cliSocket = getCliSocketAdapter();
  const socketPath = cliSocket.getCliSocketPath();

  return new Promise((resolve, reject) => {
    const socket = net.createConnection(socketPath);
    const state = {
      buffer: '',
      result: undefined,
    };

    socket.setEncoding('utf8');

    socket.on('connect', () => {
      socket.end(JSON.stringify({
        command,
        options,
      }));
    });

    socket.on('data', (chunk) => {
      state.buffer += chunk;
      const lines = state.buffer.split('\n');
      state.buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          parseResponseLine(trimmed, state, onLog);
        }
      }
    });

    socket.on('end', () => {
      try {
        const remaining = state.buffer.trim();
        if (remaining) {
          parseResponseLine(remaining, state, onLog);
        }
        resolve(state.result || {});
      } catch (error) {
        reject(error);
      }
    });

    socket.on('error', (error) => {
      const staleSocketRemoved = cliSocket.cleanupCliClientConnectionError(socketPath, error);

      if (staleSocketRemoved) {
        reject(new Error(`Service indisponible. Le socket stale a été supprimé: ${socketPath}`));
        return;
      }

      reject(error);
    });
  });
}
