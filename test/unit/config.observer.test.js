import {jest} from '@jest/globals';
import {createPubSub} from '../../server/services/pubsub/createPubSub.js';
import {startConfigObserver} from '../../server/init/observers/startConfigObserver.js';
import {
  PUBSUB_EVENT_CONFIG_UPDATED,
  PUBSUB_SERVICE_CONFIG,
} from '../../server/services/pubsub/serviceEventConstants.js';

describe('config observer', () => {
  it('broadcasts config snapshots on config pubsub events', () => {
    const bus = createPubSub();
    const emit = jest.fn();
    const services = {
      getPubSub: () => bus,
      getSseService: () => ({emit}),
      getConfig: () => ({
        logging: {
          level: 'debug',
        },
      }),
      getSystemConfig: () => ({
        serviceName: 'remote-mouse.service',
      }),
    };

    startConfigObserver(services);

    bus.publish(PUBSUB_SERVICE_CONFIG, {
      changeType: 'updated',
      changedKeys: ['logging.level'],
    }, {
      type: PUBSUB_EVENT_CONFIG_UPDATED,
      snapshot: false,
    });

    expect(emit).toHaveBeenCalledWith(expect.objectContaining({
      name: 'config.changed',
      service: PUBSUB_SERVICE_CONFIG,
      type: PUBSUB_EVENT_CONFIG_UPDATED,
      payload: {
        sequence: 1,
        at: expect.any(String),
        type: PUBSUB_EVENT_CONFIG_UPDATED,
        changeType: 'updated',
        changedKeys: ['logging.level'],
        config: {
          logging: {
            level: 'debug',
          },
        },
        sysConfig: {
          serviceName: 'remote-mouse.service',
        },
      },
    }));
  });
});
