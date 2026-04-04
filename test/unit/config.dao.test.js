import {jest} from '@jest/globals';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createConfigDao} from '../../server/services/persistence/createConfigDao.js';
import {createDatabaseProvider} from '../../server/services/persistence/createDatabaseProvider.js';
import {
  PUBSUB_EVENT_CONFIG_DELETED,
  PUBSUB_EVENT_CONFIG_UPDATED,
  PUBSUB_SERVICE_CONFIG,
} from '../../server/services/pubsub/serviceEventConstants.js';

describe('config dao pubsub', () => {
  let tempDir;
  let getDatabase;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'remote-mouse-config-dao-'));
    getDatabase = createDatabaseProvider({
      getDatabasePath: () => path.join(tempDir, 'config.sqlite'),
    });
  });

  afterEach(() => {
    try {
      getDatabase?.().close();
    } catch (_error) {
      // Best effort.
    }

    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('publishes config updates from the dao', () => {
    const publish = jest.fn();
    const dao = createConfigDao({
      getDatabase,
      getPubSub: () => ({publish}),
    });

    dao.saveStoredConfig({
      logging: {
        level: 'debug',
      },
      notifications: {
        clientConnected: {
          client: false,
        },
      },
    }, ['logging.level', 'notifications.clientConnected.client']);

    expect(publish).toHaveBeenCalledWith(PUBSUB_SERVICE_CONFIG, {
      changeType: 'updated',
      changedKeys: ['logging.level', 'notifications.clientConnected.client'],
      storedConfig: {
        logging: {
          level: 'debug',
        },
        notifications: {
          clientConnected: {
            client: false,
          },
        },
      },
    }, {
      type: PUBSUB_EVENT_CONFIG_UPDATED,
      snapshot: false,
    });
  });

  it('publishes config deletions from the dao', () => {
    const publish = jest.fn();
    const dao = createConfigDao({
      getDatabase,
      getPubSub: () => ({publish}),
    });

    dao.saveStoredConfig({
      logging: {
        level: 'debug',
      },
    }, ['logging.level']);
    publish.mockClear();

    const changes = dao.deleteStoredConfig(['logging.level'], ['logging.level']);

    expect(changes).toBe(1);
    expect(publish).toHaveBeenCalledWith(PUBSUB_SERVICE_CONFIG, {
      changeType: 'deleted',
      changedKeys: ['logging.level'],
      storedConfig: {},
    }, {
      type: PUBSUB_EVENT_CONFIG_DELETED,
      snapshot: false,
    });
  });
});
