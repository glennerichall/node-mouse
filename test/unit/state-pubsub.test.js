import {jest} from '@jest/globals';
import {createPubSub} from '../../server/services/pubsub/createPubSub.js';
import {createTaskManager} from '../../server/services/task-manager/createTaskManager.js';
import {createTokenManager} from '../../server/services/token-manager/createTokenManager.js';
import {createUpdateManager} from '../../server/services/update-manager/createUpdateManager.js';

describe('state pubsub', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-02T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('stores the latest state and notifies subscribers', () => {
    const bus = createPubSub();
    const listener = jest.fn();
    bus.subscribe(listener);

    const event = bus.publish('task-manager', {tasks: []}, {type: 'task.changed'});

    expect(event).toEqual({
      sequence: 1,
      service: 'task-manager',
      type: 'task.changed',
      at: '2026-04-02T12:00:00.000Z',
      state: {tasks: []},
    });
    expect(listener).toHaveBeenCalledWith(event);
    expect(bus.getServiceState('task-manager')).toEqual(event);
    expect(bus.getLatestSnapshot()).toEqual([event]);
  });

  it('publishes task manager state changes to the central bus', async () => {
    const bus = createPubSub();
    const taskManager = createTaskManager({
      getPubSub: () => bus,
    });

    taskManager.run(() => Promise.resolve(), 30_000, {name: 'update-check'});

    expect(bus.getServiceState('task-manager')).toEqual(expect.objectContaining({
      service: 'task-manager',
      state: {
        tasks: [
          expect.objectContaining({
            name: 'update-check',
            dueAt: '2026-04-02T12:00:30.000Z',
          }),
        ],
      },
    }));

    await jest.advanceTimersByTimeAsync(30_000);

    expect(bus.getServiceState('task-manager')).toEqual(expect.objectContaining({
      service: 'task-manager',
      state: {
        tasks: [
          expect.objectContaining({
            name: 'update-check',
            dueAt: '2026-04-02T12:01:00.000Z',
            running: false,
          }),
        ],
      },
    }));
  });

  it('publishes token manager state changes to the central bus', () => {
    const bus = createPubSub();
    let latestToken = '';
    let latestCreatedAt = null;
    const createEntryToken = jest.fn((token, createdAt) => {
      latestToken = token;
      latestCreatedAt = createdAt;
    });
    const tokenManager = createTokenManager({
      getPubSub: () => bus,
      getSystemConfig: () => ({
        entryPath: {
          enabled: true,
          fixed: '',
          tokenLength: 8,
          graceMin: 60,
          rotateMin: 10,
        },
      }),
      getPersistence: () => ({
        entryTokenDao: {
          countEntryTokens: () => 1,
          deleteExpiredEntryTokens: () => 0,
          getLatestEntryToken: () => latestToken,
          getLatestEntryTokenRecord: () => latestToken ? ({
            token: latestToken,
            createdAt: latestCreatedAt,
          }) : null,
          hasEntryToken: () => false,
          createEntryToken,
        },
      }),
    });

    const token = tokenManager.createToken();

    expect(typeof token).toBe('string');
    expect(createEntryToken).toHaveBeenCalled();
    expect(bus.getServiceState('token-manager')).toEqual(expect.objectContaining({
      service: 'token-manager',
      type: 'token.changed',
      state: expect.objectContaining({
        enabled: true,
        persistenceEnabled: true,
        token,
      }),
    }));
  });

  it('publishes update manager checks to the central bus', async () => {
    const bus = createPubSub();
    const notify = jest.fn();
    const updateManager = createUpdateManager({
      getPubSub: () => bus,
      getConfig: () => ({
        updateCheck: {
          enabled: true,
        },
      }),
      getSystemConfig: () => ({
        updateCheck: {
          checkCommand: '',
          checkTimeoutSec: 20,
          packageName: '',
          currentVersion: '',
          intervalMin: 60,
        },
      }),
      getNotifier: () => ({notify}),
      getLogger: () => ({
        debug: jest.fn(),
        error: jest.fn(),
      }),
    });

    await updateManager.check();

    expect(bus.getServiceState('update-manager')).toEqual(expect.objectContaining({
      service: 'update-manager',
      type: 'update.check',
      state: expect.objectContaining({
        enabled: true,
        lastResult: expect.objectContaining({
          checked: true,
          checkedAt: '2026-04-02T12:00:00.000Z',
        }),
      }),
    }));
  });
});
