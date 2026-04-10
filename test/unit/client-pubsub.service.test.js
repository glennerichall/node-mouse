import {jest} from '@jest/globals';

import {createPubSubService} from '../../client/services/pubsub/createPubSubService.js';

describe('client pubsub service', () => {
  let previousWindow;

  beforeEach(() => {
    previousWindow = global.window;
    global.window = new EventTarget();
  });

  afterEach(() => {
    global.window = previousWindow;
  });

  it('publishes through browser events and unsubscribes cleanly', () => {
    const pubsub = createPubSubService({});
    const listener = jest.fn();

    const unsubscribe = pubsub.subscribe('remotes.available.changed', listener);
    pubsub.publish('remotes.available.changed', {remotes: ['browser']});

    expect(listener).toHaveBeenCalledWith({remotes: ['browser']});

    unsubscribe();
    pubsub.publish('remotes.available.changed', {remotes: ['vlc']});

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('isolates browser events between pubsub service instances', () => {
    const firstPubSub = createPubSubService({});
    const secondPubSub = createPubSubService({});
    const firstListener = jest.fn();
    const secondListener = jest.fn();

    firstPubSub.subscribe('notification.received', firstListener);
    secondPubSub.subscribe('notification.received', secondListener);

    firstPubSub.publish('notification.received', {message: 'first'});

    expect(firstListener).toHaveBeenCalledWith({message: 'first'});
    expect(secondListener).not.toHaveBeenCalled();
  });
});
