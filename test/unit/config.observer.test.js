import {jest} from '@jest/globals';
import {createPubSub} from '../../server/services/pubsub/createPubSub.js';
import {startConfigObserver} from '../../server/init/observers/startConfigObserver.js';
import {
  PUBSUB_SERVICE_CLIENT_CONFIG,
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
        preview: {
          fps: 12,
        },
      }),
      getSystemConfig: () => ({
        serviceName: 'remote-mouse.service',
      }),
      getRemotes: () => ({preview: {isAvailable: () => true}}),
    };

    startConfigObserver(services);

    bus.publish(PUBSUB_SERVICE_CONFIG, {
      changeType: 'updated',
      changedKeys: ['preview.fps'],
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
        changedKeys: ['preview.fps'],
        entries: [
          {
            path: 'preview.fps',
            value: 12,
          },
        ],
        config: {
          preview: {
            fps: 12,
          },
        },
        sysConfig: {
          serviceName: 'remote-mouse.service',
        },
      },
    }));
  });

  it('publishes a filtered client event only for controller-readable keys', () => {
    const bus = createPubSub();
    const emit = jest.fn();
    const services = {
      getPubSub: () => bus,
      getSseService: () => ({emit}),
      getConfig: () => ({
        preview: {hideDelayMs: 5000},
        samsungTv: {host: '192.168.30.20'},
      }),
      getSystemConfig: () => ({session: {secret: 'secret'}}),
      getRemotes: () => ({preview: {isAvailable: () => true}}),
    };

    startConfigObserver(services);
    bus.publish(PUBSUB_SERVICE_CONFIG, {
      changeType: 'updated',
      changedKeys: ['preview.hideDelayMs', 'samsungTv.host'],
    }, {
      type: PUBSUB_EVENT_CONFIG_UPDATED,
      snapshot: false,
    });

    expect(emit).toHaveBeenCalledWith({
      name: 'config.changed',
      service: PUBSUB_SERVICE_CLIENT_CONFIG,
      type: PUBSUB_EVENT_CONFIG_UPDATED,
      payload: {
        sequence: 1,
        at: expect.any(String),
        type: PUBSUB_EVENT_CONFIG_UPDATED,
        changeType: 'updated',
        changedKeys: ['preview.hideDelayMs'],
        entries: [{path: 'preview.hideDelayMs', value: 5000}],
      },
    });

    const clientEvent = emit.mock.calls.map(([event]) => event)
      .find((event) => event.service === PUBSUB_SERVICE_CLIENT_CONFIG);
    expect(JSON.stringify(clientEvent)).not.toContain('192.168.30.20');
    expect(JSON.stringify(clientEvent)).not.toContain('secret');
  });
});
