import {jest} from '@jest/globals';
import {
  PUBSUB_EVENT_CONFIG_UPDATED,
  PUBSUB_EVENT_TOKEN_CHANGED,
  PUBSUB_SERVICE_CONFIG,
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

jest.unstable_mockModule('../../server/application/logger.js', () => ({
  bootstrapLogger,
  createLogger,
}));

jest.unstable_mockModule('../../server/services/config/logConfig.js', () => ({
  logStartupConfig,
}));

jest.unstable_mockModule('../../server/term/srv/startCliServer.js', () => ({
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
    const hide = jest.fn(() => false);
    const update = jest.fn(async () => {});
    const taskStart = jest.fn(async () => {});
    const info = jest.fn();
    const error = jest.fn();
    const subscribers = new Set();
    const configState = {
      qrOverlay: {
        enabled: true,
      },
    };
    const pubsub = {
      subscribe: jest.fn((listener, filter) => {
        const entry = {listener, filter};
        subscribers.add(entry);
        return () => {
          subscribers.delete(entry);
        };
      }),
    };

    createServicesRegistry.mockResolvedValue({
      getTokenManager: () => ({
        createToken,
      }),
      getNotifier: () => ({
        target: jest.fn(() => ({notify: jest.fn()})),
      }),
      getPubSub: () => pubsub,
      getSseService: () => ({
        emit: jest.fn(),
        closeAll: jest.fn(),
      }),
      getPersistence: () => ({
        restartLogDao: {
          getLastLifecycleEvent: jest.fn(() => null),
          createLifecycleEvent: jest.fn(),
          updateRestartStatus: jest.fn(),
        },
      }),
      getConfig: () => configState,
      getServer: () => ({
        server: {
          listen: (_port, callback) => callback(),
          close: (callback) => callback(),
        },
      }),
      getQrOverlay: () => ({
        show,
        hide,
        close: jest.fn(),
        update,
      }),
      getRobot: () => ({
        getMousePos: jest.fn(() => ({x: 0, y: 0})),
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

    for (const subscriber of subscribers) {
      const notify = (event) => {
        if (!subscriber.filter) {
          subscriber.listener(event);
          return;
        }

        if (typeof subscriber.filter === 'function') {
          if (subscriber.filter(event)) {
            subscriber.listener(event);
          }
          return;
        }

        const matches = Object.entries(subscriber.filter)
          .every(([key, value]) => event?.[key] === value);
        if (matches) {
          subscriber.listener(event);
        }
      };

      notify({
        service: PUBSUB_SERVICE_TOKEN_MANAGER,
        type: PUBSUB_EVENT_TOKEN_CHANGED,
      });
      notify({
        service: PUBSUB_SERVICE_CONFIG,
        type: PUBSUB_EVENT_CONFIG_UPDATED,
        payload: {
          changedKeys: ['qrOverlay.size'],
        },
      });
      configState.qrOverlay.enabled = false;
      notify({
        service: PUBSUB_SERVICE_CONFIG,
        type: PUBSUB_EVENT_CONFIG_UPDATED,
        payload: {
          changedKeys: ['qrOverlay.enabled'],
        },
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
    expect(update).toHaveBeenCalledTimes(2);
    expect(hide).toHaveBeenCalledTimes(1);
    expect(startCliServer).toHaveBeenCalledTimes(1);
    expect(qrcodeGenerate).toHaveBeenCalledWith(
      'http://127.0.0.1:3000/api/sessions/startup-token',
      {small: true},
    );
    expect(error).not.toHaveBeenCalled();
  });
});
