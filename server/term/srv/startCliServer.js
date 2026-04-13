import net from 'node:net';
import {getCliSocketAdapter} from '../cliSocket.js';
import {executeCliRequest} from './executeCliRequest.js';
import {createLogger} from '../../application/logger.js';

function writeResponse(socket, payload) {
  socket.end(`${JSON.stringify(payload)}\n`);
}

function normalizeVerbosity(options = {}) {
  return Math.max(0, Number.parseInt(options.verbosity || 0, 10) || 0);
}

function writeFrame(socket, payload) {
  socket.write(`${JSON.stringify(payload)}\n`);
}

function writeResult(socket, result, options = {}) {
  if (normalizeVerbosity(options) <= 0) {
    writeResponse(socket, result);
    return;
  }

  writeFrame(socket, {
    type: 'result',
    result,
  });
  socket.end();
}

function parseRequest(input) {
  try {
    const payload = JSON.parse(String(input || '').trim() || '{}');
    const command = payload.command && typeof payload.command === 'object' ? payload.command : {name: String(payload.command || '').trim(), args: {}};
    const options = payload.options && typeof payload.options === 'object' ? payload.options : {};
    return {
      command,
      options,
    };
  } catch (_error) {
    return {
      command: {name: String(input || '').trim(), args: {}},
      options: {},
    };
  }
}

const log = createLogger('cli');

export async function startCliServer(services) {

  const cliSocket = getCliSocketAdapter();
  const socketPath = cliSocket.getCliSocketPath();
  let isClosed = false;

  function closeServer() {
    if (isClosed) {
      return;
    }

    isClosed = true;
    server.close();
    cliSocket.cleanupCliServerSocket(socketPath);
  }

  cliSocket.prepareCliServerSocket(socketPath);

  const server = net.createServer({allowHalfOpen: true}, (socket) => {
    let input = '';
    let handled = false;
    socket.setEncoding('utf8');
    log.trace('Connexion CLI ouverte');

    async function handleCommand() {
      if (handled) {
        return;
      }

      handled = true;

      try {
        const request = parseRequest(input);
        log.debug({
          command: request.command?.name || '',
          verbosity: normalizeVerbosity(request.options),
        }, 'Commande CLI recue');
        const result = await executeCliRequest(services, request.command, request.options, (entry) => {
          writeFrame(socket, {
            type: 'log',
            entry,
          });
        });
        log.debug({
          command: request.command?.name || '',
          ok: Boolean(result?.ok),
        }, 'Commande CLI terminee');
        writeResult(socket, result, request.options);
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
    socket.on('close', () => {
      log.trace('Connexion CLI fermee');
    });
  });

  server.once('close', () => {
    cliSocket.cleanupCliServerSocket(socketPath);
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(socketPath, () => {
      server.off('error', reject);
      resolve();
    });
  });

  cliSocket.secureCliServerSocket(socketPath);

  log.info({socketPath}, 'Interface CLI locale prête');

  return {
    close() {
      closeServer();
    },
  };
}
