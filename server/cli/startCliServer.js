import fs from 'node:fs';
import net from 'node:net';
import {getCliSocketPath} from './getCliSocketPath.js';
import {executeCliCommand} from './executeCliCommand.js';

function removeSocketIfNeeded(socketPath) {
  if (process.platform === 'win32') {
    return;
  }

  try {
    fs.unlinkSync(socketPath);
  } catch (_error) {
    // Ignore missing or stale socket cleanup issues.
  }
}

function writeResponse(socket, payload) {
  socket.end(`${JSON.stringify(payload)}\n`);
}

export async function startCliServer(services) {
  const log = services.getLogger('cli');
  const socketPath = getCliSocketPath();
  let isClosed = false;

  function closeServer() {
    if (isClosed) {
      return;
    }

    isClosed = true;
    server.close();
    removeSocketIfNeeded(socketPath);
  }

  function registerShutdownHandler(eventName) {
    process.once(eventName, closeServer);
  }

  removeSocketIfNeeded(socketPath);

  const server = net.createServer({allowHalfOpen: true}, (socket) => {
    let input = '';
    let handled = false;
    socket.setEncoding('utf8');

    async function handleCommand() {
      if (handled) {
        return;
      }

      handled = true;

      try {
        const result = await executeCliCommand(services, input);
        writeResponse(socket, result);
      } catch (error) {
        log.error({err: error}, 'Erreur execution commande CLI');
        writeResponse(socket, {
          ok: false,
          message: `Erreur CLI: ${error.message}`,
        });
      }
    }

    socket.on('data', (chunk) => {
      input += chunk;
    });

    socket.on('end', () => {
      void handleCommand();
    });
  });

  server.once('close', () => {
    removeSocketIfNeeded(socketPath);
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(socketPath, () => {
      server.off('error', reject);
      resolve();
    });
  });

  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(socketPath, 0o600);
    } catch (_error) {
      // Best effort.
    }
  }

  registerShutdownHandler('SIGINT');
  registerShutdownHandler('SIGTERM');
  registerShutdownHandler('exit');

  log.info({socketPath}, 'Interface CLI locale prête');

  return {
    close() {
      closeServer();
    },
  };
}
