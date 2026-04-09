import {jest} from '@jest/globals';

const createPersistence = jest.fn(() => ({}));
const loadRobot = jest.fn(async () => ({}));
const createServer = jest.fn(() => ({
  server: {},
  io: {},
  app: {},
  basePublicUrl: 'http://127.0.0.1:3000',
  serverStartedAt: Date.now(),
  cookieParser: () => {},
}));
const createInputController = jest.fn(() => ({}));
const getSystemConfig = jest.fn(() => ({
  protocol: 'http',
  port: 3000,
  session: {
    cookieSecret: 'secret',
  },
}));
const createConfig = jest.fn(() => ({}));
const createTokenManager = jest.fn(() => ({}));
const createNotifier = jest.fn(() => ({}));
const createTaskRunner = jest.fn(() => ({}));
const createTaskManager = jest.fn(() => ({}));
const createUpdateManager = jest.fn(() => ({}));
const createQrOverlay = jest.fn(async () => ({}));
const createRemotes = jest.fn(() => ({}));
const createPubSub = jest.fn(() => ({
  publish: jest.fn(),
  subscribe: jest.fn(() => () => {}),
}));
const createEventStore = jest.fn(() => ({}));
const createServiceEvents = jest.fn(() => ({
  publish: jest.fn(),
  publishState: jest.fn(),
  publishEvent: jest.fn(),
}));
const createSseService = jest.fn(() => ({}));
const createApplicationDaemonService = jest.fn(() => ({}));
const createOsService = jest.fn(() => ({}));

jest.unstable_mockModule('../../server/services/persistence/index.js', () => ({
  createPersistence,
}));

jest.unstable_mockModule('../../server/utils/robot.js', () => ({
  loadRobot,
}));

jest.unstable_mockModule('../../server/services/server/createServer.js', () => ({
  createServer,
}));

jest.unstable_mockModule('../../server/services/input/createInputController.js', () => ({
  createInputController,
}));

jest.unstable_mockModule('../../server/services/config/index.js', () => ({
  getSystemConfig,
}));

jest.unstable_mockModule('../../server/services/config/configService.js', () => ({
  createConfig,
}));

jest.unstable_mockModule('../../server/services/token-manager/createTokenManager.js', () => ({
  createTokenManager,
}));

jest.unstable_mockModule('../../server/services/notifier/createNotifier.js', () => ({
  createNotifier,
}));

jest.unstable_mockModule('../../server/services/task-runner/createTaskRunner.js', () => ({
  createTaskRunner,
}));

jest.unstable_mockModule('../../server/services/task-manager/createTaskManager.js', () => ({
  createTaskManager,
}));

jest.unstable_mockModule('../../server/services/update-manager/createUpdateManager.js', () => ({
  createUpdateManager,
}));

jest.unstable_mockModule('../../server/services/overlay/createQrOverlay.js', () => ({
  createQrOverlay,
}));

jest.unstable_mockModule('../../server/services/remotes/createRemotes.js', () => ({
  createRemotes,
}));

jest.unstable_mockModule('../../server/services/pubsub/createPubSub.js', () => ({
  createPubSub,
}));

jest.unstable_mockModule('../../server/services/pubsub/createEventStore.js', () => ({
  createEventStore,
}));

jest.unstable_mockModule('../../server/services/pubsub/createServiceEvents.js', () => ({
  createServiceEvents,
}));

jest.unstable_mockModule('../../server/services/sse/createSseService.js', () => ({
  createSseService,
}));

jest.unstable_mockModule('../../server/services/application/createApplicationDaemonService.js', () => ({
  createApplicationDaemonService,
}));

jest.unstable_mockModule('../../server/services/os/index.js', () => ({
  createOsService,
}));

describe('createServicesRegistry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not eagerly resolve any service during registry creation', async () => {
    const {createServicesRegistry} = await import('../../server/services/createServicesRegistry.js');

    const services = await createServicesRegistry();

    expect(services).toBeTruthy();
    expect(typeof services.getServer).toBe('function');
    expect(typeof services.getRobot).toBe('function');
    expect(typeof services.getQrOverlay).toBe('function');
    expect(typeof services.initializeCoreServices).toBe('function');

    expect(createPersistence).not.toHaveBeenCalled();
    expect(loadRobot).not.toHaveBeenCalled();
    expect(createServer).not.toHaveBeenCalled();
    expect(createInputController).not.toHaveBeenCalled();
    expect(getSystemConfig).not.toHaveBeenCalled();
    expect(createConfig).not.toHaveBeenCalled();
    expect(createTokenManager).not.toHaveBeenCalled();
    expect(createNotifier).not.toHaveBeenCalled();
    expect(createTaskRunner).not.toHaveBeenCalled();
    expect(createTaskManager).not.toHaveBeenCalled();
    expect(createUpdateManager).not.toHaveBeenCalled();
    expect(createQrOverlay).not.toHaveBeenCalled();
    expect(createRemotes).not.toHaveBeenCalled();
    expect(createPubSub).not.toHaveBeenCalled();
    expect(createEventStore).not.toHaveBeenCalled();
    expect(createServiceEvents).not.toHaveBeenCalled();
    expect(createSseService).not.toHaveBeenCalled();
    expect(createApplicationDaemonService).not.toHaveBeenCalled();
    expect(createOsService).not.toHaveBeenCalled();
  });
});
