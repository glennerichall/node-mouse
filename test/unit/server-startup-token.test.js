import {jest} from '@jest/globals';

const createServicesRegistry = jest.fn();
const bootstrapApi = jest.fn();
const bootstrapSocket = jest.fn();
const bootstrapLogger = jest.fn();
const logStartupConfig = jest.fn();
const startCliServer = jest.fn(async () => ({close: jest.fn()}));
const qrcodeGenerate = jest.fn();

jest.unstable_mockModule('../../server/services/createServicesRegistry.js', () => ({
  createServicesRegistry,
}));

jest.unstable_mockModule('../../server/init/bootstrapApi.js', () => ({
  bootstrapApi,
}));

jest.unstable_mockModule('../../server/init/bootstrapSocket.js', () => ({
  bootstrapSocket,
}));

jest.unstable_mockModule('../../server/services/log/logger.js', () => ({
  bootstrapLogger,
}));

jest.unstable_mockModule('../../server/services/config/logConfig.js', () => ({
  logStartupConfig,
}));

jest.unstable_mockModule('../../server/cli/startCliServer.js', () => ({
  startCliServer,
}));

jest.unstable_mockModule('qrcode-terminal', () => ({
  default: {
    generate: qrcodeGenerate,
  },
}));

describe('startServer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rotates the entry token during startup', async () => {
    const createToken = jest.fn(() => 'startup-token');
    const onTokenChanged = jest.fn();
    const show = jest.fn(async () => {});
    const taskStart = jest.fn(async () => {});
    const info = jest.fn();
    const error = jest.fn();

    createServicesRegistry.mockResolvedValue({
      getTokenManager: () => ({
        createToken,
        onTokenChanged,
      }),
      getConfig: () => ({
        qrOverlay: {
          enabled: true,
        },
      }),
      getServer: () => ({
        server: {
          listen: (_port, callback) => callback(),
          close: (callback) => callback(),
        },
      }),
      getQrOverlay: () => ({
        show,
        close: jest.fn(),
        refresh: jest.fn(),
      }),
      getSystemConfig: () => ({
        port: 3000,
      }),
      getTaskManager: () => ({
        start: taskStart,
        stop: jest.fn(),
      }),
      getUrls: () => ({
        entryUrl: 'http://127.0.0.1:3000/api/sessions/startup-token',
      }),
      getLogger: () => ({
        info,
        error,
      }),
    });

    const {startServer} = await import('../../server/index.js');
    await startServer();
    await new Promise((resolve) => setImmediate(resolve));

    expect(createServicesRegistry).toHaveBeenCalledTimes(1);
    expect(createToken).toHaveBeenCalledTimes(1);
    expect(bootstrapApi).toHaveBeenCalledTimes(1);
    expect(bootstrapSocket).toHaveBeenCalledTimes(1);
    expect(taskStart).toHaveBeenCalledTimes(1);
    expect(show).toHaveBeenCalledTimes(1);
    expect(onTokenChanged).toHaveBeenCalledTimes(1);
    expect(startCliServer).toHaveBeenCalledTimes(1);
    expect(qrcodeGenerate).toHaveBeenCalledWith(
      'http://127.0.0.1:3000/api/sessions/startup-token',
      {small: true},
    );
    expect(error).not.toHaveBeenCalled();
  });
});
