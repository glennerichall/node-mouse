import {jest} from '@jest/globals';
import {createPubSub} from '../../server/services/pubsub/createPubSub.js';
import {startUpdateManagerLogObserver} from '../../server/init/observers/startUpdateManagerLogObserver.js';
import {PUBSUB_SERVICE_UPDATE_MANAGER} from '../../server/services/pubsub/serviceEventConstants.js';

describe('update-manager log observer', () => {
  it('persists update-manager pubsub events', () => {
    const bus = createPubSub();
    const createEvent = jest.fn();

    startUpdateManagerLogObserver({
      getPubSub: () => bus,
      getPersistence: () => ({
        updateEventLogDao: {
          createEvent,
        },
      }),
    });

    bus.publish(PUBSUB_SERVICE_UPDATE_MANAGER, {
      enabled: true,
      lastKey: 'npm:6.5.0',
      lastResult: {
        hasUpdate: true,
      },
    }, {
      type: 'update.available',
    });

    expect(createEvent).toHaveBeenCalledWith(expect.objectContaining({
      service: PUBSUB_SERVICE_UPDATE_MANAGER,
      type: 'update.available',
      payload: expect.objectContaining({
        enabled: true,
        lastKey: 'npm:6.5.0',
      }),
    }));
  });
});
