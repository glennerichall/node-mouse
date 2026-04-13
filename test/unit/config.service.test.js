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
            {key: 'preview.fps', value: 12},
            {key: 'preview.enabled', value: false},
          ],
        },
      }),
      getPubSub: () => ({
        publish: jest.fn(),
      }),
    });

    const configs = configService.getConfigs();

    expect(configs.preview.fps).toBe(12);
    expect(configs.preview.enabled).toBe(false);
    expect(configService.getConfig('preview.fps')).toBe(12);
  });

  it('publishes updates and deletions from the service', () => {
    const saveOne = jest.fn();
    const deleteOne = jest.fn(() => 1);
    const publish = jest.fn();
    const rows = [{key: 'preview.fps', value: 12}];
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

    configService.setConfig('preview.fps', 12);
    expect(saveOne).toHaveBeenCalledWith('preview.fps', 12);
    expect(publish).toHaveBeenCalledWith(PUBSUB_SERVICE_CONFIG, {
      changeType: 'updated',
      changedKeys: ['preview.fps'],
      storedConfig: {
        preview: {
          fps: 12,
        },
      },
    }, {
      type: PUBSUB_EVENT_CONFIG_UPDATED,
      snapshot: false,
    });

    publish.mockClear();
    rows.length = 0;
    configService.resetConfig('preview.fps');
    expect(deleteOne).toHaveBeenCalledWith('preview.fps');
    expect(publish).toHaveBeenCalledWith(PUBSUB_SERVICE_CONFIG, {
      changeType: 'deleted',
      changedKeys: ['preview.fps'],
      storedConfig: {},
    }, {
      type: PUBSUB_EVENT_CONFIG_DELETED,
      snapshot: false,
    });
  });
});
