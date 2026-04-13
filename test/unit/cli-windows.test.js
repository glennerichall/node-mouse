import {jest} from '@jest/globals';

const originalPlatform = process.platform;

function setPlatform(platform) {
  Object.defineProperty(process, 'platform', {
    configurable: true,
    value: platform,
  });
}

describe('Windows CLI transport', () => {
  afterEach(() => {
    setPlatform(originalPlatform);
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('uses a Windows named pipe path', async () => {
    setPlatform('win32');

    const {getCliSocketPath} = await import('../../server/term/cli/getCliSocketPath.js');

    expect(getCliSocketPath()).toBe('\\\\.\\pipe\\remote-mouse');
  });

  it('starts on the named pipe without Unix socket cleanup', async () => {
    setPlatform('win32');

    const unlinkSync = jest.fn();
    const chmodSync = jest.fn();
    const log = {
      trace: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    };
    const server = {
      close: jest.fn(),
      listen: jest.fn((_socketPath, callback) => {
        callback();
      }),
      off: jest.fn(),
      once: jest.fn(),
    };
    const createServer = jest.fn(() => server);

    jest.unstable_mockModule('node:fs', () => ({
      default: {
        unlinkSync,
        chmodSync,
      },
    }));
    jest.unstable_mockModule('node:net', () => ({
      default: {
        createServer,
      },
    }));
    jest.unstable_mockModule('../../server/application/logger.js', () => ({
      createLogger: jest.fn(() => log),
    }));
    jest.unstable_mockModule('../../server/term/srv/executeCliRequest.js', () => ({
      executeCliRequest: jest.fn(),
    }));

    const {startCliServer} = await import('../../server/term/srv/startCliServer.js');

    const cliServer = await startCliServer({});

    expect(createServer).toHaveBeenCalledWith({allowHalfOpen: true}, expect.any(Function));
    expect(server.listen).toHaveBeenCalledWith('\\\\.\\pipe\\remote-mouse', expect.any(Function));
    expect(unlinkSync).not.toHaveBeenCalled();
    expect(chmodSync).not.toHaveBeenCalled();

    cliServer.close();

    expect(server.close).toHaveBeenCalledTimes(1);
  });

  it('connects CLI commands to the Windows named pipe', async () => {
    setPlatform('win32');

    const handlers = {};
    const socket = {
      end: jest.fn(),
      on: jest.fn((event, handler) => {
        handlers[event] = handler;
      }),
      setEncoding: jest.fn(),
    };
    const createConnection = jest.fn(() => socket);
    const unlinkSync = jest.fn();

    jest.unstable_mockModule('node:fs', () => ({
      default: {
        existsSync: jest.fn(),
        unlinkSync,
      },
    }));
    jest.unstable_mockModule('node:net', () => ({
      default: {
        createConnection,
      },
    }));

    const {sendCliCommand} = await import('../../server/term/cli/sendCliCommand.js');

    const resultPromise = sendCliCommand({name: 'info'}, {verbosity: 1});

    handlers.connect();
    handlers.data('{"type":"result","result":{"ok":true,"message":"ok"}}\n');
    handlers.end();

    const result = await resultPromise;

    expect(createConnection).toHaveBeenCalledWith('\\\\.\\pipe\\remote-mouse');
    expect(socket.setEncoding).toHaveBeenCalledWith('utf8');
    expect(socket.end).toHaveBeenCalledWith(JSON.stringify({
      command: {name: 'info'},
      options: {verbosity: 1},
    }));
    expect(unlinkSync).not.toHaveBeenCalled();
    expect(result).toEqual({ok: true, message: 'ok'});
  });
});
