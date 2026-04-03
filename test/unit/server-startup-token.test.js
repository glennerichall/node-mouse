import {jest} from '@jest/globals';
import {
  PUBSUB_EVENT_TOKEN_CHANGED,
  PUBSUB_SERVICE_TOKEN_MANAGER,
} from '../../server/services/pubsub/serviceEventConstants.js';

const createServicesRegistry = jest.fn();
const bootstrapApi = jest.fn();
const bootstrapSocket = jest.fn();
const bootstrapLogger = jest.fn();
const createLogger = jest.fn(() => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));
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
  createLogger,
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
    const show = jest.fn(async () => {});
    const refresh = jest.fn(async () => {});
    const taskStart = jest.fn(async () => {});
    const info = jest.fn();
    const error = jest.fn();
    const subscribers = new Set();
    const pubsub = {
      subscribe: jest.fn((listener) => {
        subscribers.add(listener);
        return () => {
          subscribers.delete(listener);
        };
      }),
    };

    createServicesRegistry.mockResolvedValue({
      getTokenManager: () => ({
        createToken,
      }),
      getPubSub: () => pubsub,
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
        refresh,
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

    for (const listener of subscribers) {
      listener({
        service: PUBSUB_SERVICE_TOKEN_MANAGER,
        type: PUBSUB_EVENT_TOKEN_CHANGED,
      });
    }
    await new Promise((resolve) => setImmediate(resolve));

    expect(createServicesRegistry).toHaveBeenCalledTimes(1);
    expect(createToken).toHaveBeenCalledTimes(1);
    expect(bootstrapApi).toHaveBeenCalledTimes(1);
    expect(bootstrapSocket).toHaveBeenCalledTimes(1);
    expect(taskStart).toHaveBeenCalledTimes(1);
    expect(show).toHaveBeenCalledTimes(1);
    expect(pubsub.subscribe).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(startCliServer).toHaveBeenCalledTimes(1);
    expect(qrcodeGenerate).toHaveBeenCalledWith(
      'http://127.0.0.1:3000/api/sessions/startup-token',
      {small: true},
    );
    expect(error).not.toHaveBeenCalled();
  });
});
