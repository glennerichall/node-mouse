import {jest} from '@jest/globals';
import {createPubSub} from '../../server/services/pubsub/createPubSub.js';
import {createEventStore} from '../../server/services/pubsub/createEventStore.js';
import {createServiceEvents} from '../../server/services/pubsub/createServiceEvents.js';
import {startNotificationObserver} from '../../server/init/observers/startNotificationObserver.js';
import {createTaskManager} from '../../server/services/task-manager/createTaskManager.js';
import {createTaskRunner} from '../../server/services/task-runner/createTaskRunner.js';
import {createTokenManager} from '../../server/services/token-manager/createTokenManager.js';
import {createUpdateManager} from '../../server/services/update-manager/createUpdateManager.js';
import {NOTIFIER_TARGET_CLIENT} from '../../server/services/notifier/createNotifierComposite.js';
import {
  PUBSUB_EVENT_ADMIN_ROTATED,
  PUBSUB_EVENT_TOKEN_CHANGED,
  PUBSUB_SERVICE_ADMIN_ROTATE_ENTRY_TOKEN,
  PUBSUB_SERVICE_TASK_MANAGER,
  PUBSUB_SERVICE_TOKEN_MANAGER,
  PUBSUB_SERVICE_UPDATE_MANAGER,
} from '../../server/services/pubsub/serviceEventConstants.js';

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
    const eventStore = createEventStore({
      getPubSub: () => bus,
    });
    const listener = jest.fn();
    bus.subscribe(listener);

    const event = bus.publish(PUBSUB_SERVICE_TASK_MANAGER, {tasks: []}, {type: 'task.changed'});

    expect(event).toEqual({
      sequence: 1,
      service: PUBSUB_SERVICE_TASK_MANAGER,
      type: 'task.changed',
      at: '2026-04-02T12:00:00.000Z',
      payload: {tasks: []},
      snapshot: true,
    });
    expect(listener).toHaveBeenCalledWith(event);
    expect(eventStore.getServiceState(PUBSUB_SERVICE_TASK_MANAGER)).toEqual(event);
    expect(eventStore.getLatestSnapshot()).toEqual([event]);
  });

  it('filters subscriptions with a predicate', () => {
    const bus = createPubSub();
    const listener = jest.fn();
    bus.subscribe(listener, (event) => event.type === PUBSUB_EVENT_TOKEN_CHANGED);

    bus.publish(PUBSUB_SERVICE_TASK_MANAGER, {tasks: []}, {type: 'task.changed'});
    bus.publish(PUBSUB_SERVICE_TOKEN_MANAGER, {token: 'abc'}, {type: PUBSUB_EVENT_TOKEN_CHANGED});

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      service: PUBSUB_SERVICE_TOKEN_MANAGER,
      type: PUBSUB_EVENT_TOKEN_CHANGED,
    }));
  });

  it('filters subscriptions by exact event fields', () => {
    const bus = createPubSub();
    const listener = jest.fn();
    bus.subscribe(listener, {
      service: PUBSUB_SERVICE_TOKEN_MANAGER,
      type: PUBSUB_EVENT_TOKEN_CHANGED,
    });

    bus.publish(PUBSUB_SERVICE_TASK_MANAGER, {tasks: []}, {type: 'task.changed'});
    bus.publish(PUBSUB_SERVICE_TOKEN_MANAGER, {token: 'abc'}, {type: 'task.changed'});
    bus.publish(PUBSUB_SERVICE_TOKEN_MANAGER, {token: 'abc'}, {type: PUBSUB_EVENT_TOKEN_CHANGED});

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      service: PUBSUB_SERVICE_TOKEN_MANAGER,
      type: PUBSUB_EVENT_TOKEN_CHANGED,
    }));
  });

  it('publishes task manager state changes to the central bus', async () => {
    const bus = createPubSub();
    const eventStore = createEventStore({
      getPubSub: () => bus,
    });
    const services = {
      getPubSub: () => bus,
    };
    const events = createServiceEvents(services);
    const taskRunner = createTaskRunner();
    const taskManager = createTaskManager({
      getTaskRunner: () => taskRunner,
      getEvents: () => events,
      getUpdateManager: () => ({
        check: jest.fn(() => Promise.resolve()),
      }),
      getTokenManager: () => ({
        rotateIfNeeded: jest.fn(() => 'token'),
      }),
      getSystemConfig: () => ({
        updateCheck: {intervalMin: 0.5},
        entryPath: {rotateMin: 1},
      }),
    });

    await taskManager.start();

    expect(eventStore.getServiceState(PUBSUB_SERVICE_TASK_MANAGER)).toEqual(expect.objectContaining({
      service: PUBSUB_SERVICE_TASK_MANAGER,
      payload: {
        tasks: [
          expect.objectContaining({
            name: 'update-check',
            dueAt: '2026-04-02T12:01:00.000Z',
          }),
          expect.objectContaining({
            name: 'token-rotation',
            dueAt: '2026-04-02T12:01:00.000Z',
          }),
        ],
      },
    }));

    await jest.advanceTimersByTimeAsync(60_000);

    expect(eventStore.getServiceState(PUBSUB_SERVICE_TASK_MANAGER)).toEqual(expect.objectContaining({
      service: PUBSUB_SERVICE_TASK_MANAGER,
      payload: {
        tasks: expect.arrayContaining([
          expect.objectContaining({
            name: 'update-check',
            dueAt: '2026-04-02T12:02:00.000Z',
          }),
          expect.objectContaining({
            name: 'token-rotation',
            delayMs: 60_000,
          }),
        ]),
      },
    }));
  });

  it('publishes token manager state changes to the central bus', () => {
    const bus = createPubSub();
    const eventStore = createEventStore({
      getPubSub: () => bus,
    });
    const services = {
      getPubSub: () => bus,
    };
    const events = createServiceEvents(services);
    let latestToken = '';
    let latestCreatedAt = null;
    const createEntryToken = jest.fn((token, createdAt) => {
      latestToken = token;
      latestCreatedAt = createdAt;
    });
    const tokenManager = createTokenManager({
      getEvents: () => events,
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
    expect(eventStore.getServiceState(PUBSUB_SERVICE_TOKEN_MANAGER)).toEqual(expect.objectContaining({
      service: PUBSUB_SERVICE_TOKEN_MANAGER,
      type: PUBSUB_EVENT_TOKEN_CHANGED,
      payload: expect.objectContaining({
        enabled: true,
        persistenceEnabled: true,
        token,
      }),
    }));
  });

  it('publishes update manager checks to the central bus', async () => {
    const bus = createPubSub();
    const eventStore = createEventStore({
      getPubSub: () => bus,
    });
    const services = {
      getPubSub: () => bus,
    };
    const events = createServiceEvents(services);
    const updateManager = createUpdateManager({
      getEvents: () => events,
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
      getLogger: () => ({
        debug: jest.fn(),
        error: jest.fn(),
      }),
    });

    await updateManager.check();

    expect(eventStore.getServiceState(PUBSUB_SERVICE_UPDATE_MANAGER)).toEqual(expect.objectContaining({
      service: PUBSUB_SERVICE_UPDATE_MANAGER,
      type: 'update.check',
      payload: expect.objectContaining({
        enabled: true,
        lastResult: expect.objectContaining({
          checked: true,
          checkedAt: '2026-04-02T12:00:00.000Z',
        }),
      }),
    }));
  });

  it('routes domain events from pubsub to the notifier', () => {
    const bus = createPubSub();
    const notify = jest.fn();
    const target = jest.fn(() => ({notify}));
    const stop = startNotificationObserver({
      getPubSub: () => bus,
      getNotifier: () => ({target}),
    });

    bus.publish(PUBSUB_SERVICE_ADMIN_ROTATE_ENTRY_TOKEN, {
      clientId: 'client-1',
    }, {
      type: PUBSUB_EVENT_ADMIN_ROTATED,
      snapshot: false,
    });

    expect(target).toHaveBeenCalledWith(NOTIFIER_TARGET_CLIENT);
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Entry token',
      message: 'Token d entree rotation forcee.',
    }), {
      clientId: 'client-1',
    });

    stop();
  });
});
