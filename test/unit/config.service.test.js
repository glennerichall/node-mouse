import {jest} from '@jest/globals';

import {createConfigService} from '../../server/services/config/configService.js';
import {
  PUBSUB_EVENT_CONFIG_DELETED,
  PUBSUB_EVENT_CONFIG_UPDATED,
  PUBSUB_SERVICE_CONFIG,
} from '../../server/services/pubsub/serviceEventConstants.js';

describe('config service', () => {
  it('builds effective config objects from dao rows', () => {
    const configService = createConfigService({
      getPersistence: () => ({
        configDao: {
          getAll: () => [
            {key: 'logging.level', value: 'debug'},
            {key: 'preview.enabled', value: false},
          ],
        },
      }),
      getPubSub: () => ({
        publish: jest.fn(),
      }),
    });

    const configs = configService.getConfigs();

    expect(configs.logging.level).toBe('debug');
    expect(configs.preview.enabled).toBe(false);
    expect(configService.getConfig('logging.level')).toBe('debug');
  });

  it('publishes updates and deletions from the service', () => {
    const saveOne = jest.fn();
    const deleteOne = jest.fn(() => 1);
    const publish = jest.fn();
    const rows = [{key: 'logging.level', value: 'debug'}];
    const configService = createConfigService({
      getPersistence: () => ({
        configDao: {
          getAll: () => rows,
          saveOne,
          deleteOne,
        },
      }),
      getPubSub: () => ({publish}),
    });

    configService.setConfig('logging.level', 'debug');
    expect(saveOne).toHaveBeenCalledWith('logging.level', 'debug');
    expect(publish).toHaveBeenCalledWith(PUBSUB_SERVICE_CONFIG, {
      changeType: 'updated',
      changedKeys: ['logging.level'],
      storedConfig: {
        logging: {
          level: 'debug',
        },
      },
    }, {
      type: PUBSUB_EVENT_CONFIG_UPDATED,
      snapshot: false,
    });

    publish.mockClear();
    rows.length = 0;
    configService.resetConfig('logging.level');
    expect(deleteOne).toHaveBeenCalledWith('logging.level');
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
