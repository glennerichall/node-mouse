import {jest} from '@jest/globals';
import {createEventSubscriptions} from '../../server/services/transport/createEventSubscriptions.js';

describe('createEventSubscriptions', () => {
  it('exposes named subscriptions over the client channel contract', () => {
    const updateConfig = jest.fn();
    const services = {
      getInputController: () => ({mouse: {}, keyboard: {}, updateConfig}),
      getRemotes: () => ({
        browser: {},
        adminActions: {},
        qrActions: {},
        preview: {},
        samsung: {},
        vlc: {},
        windowActions: {},
      }),
      getConfig: () => ({}),
      getEvents: () => ({publishEvent: jest.fn()}),
    };
    const handlers = new Map();
    const channel = {
      id: 'client-1234',
      on: jest.fn((eventName, handler) => handlers.set(eventName, handler)),
      emit: jest.fn(),
    };

    const subscriptions = createEventSubscriptions(services);
    subscriptions.subscribe(channel);
    const secondChannel = {
      id: 'client-5678',
      on: jest.fn(),
      emit: jest.fn(),
    };
    subscriptions.subscribe(secondChannel);

    expect(Object.keys(subscriptions)).toEqual(['subscribe']);
    expect(updateConfig).toHaveBeenCalledTimes(1);
    expect(handlers.has('mouse:move')).toBe(true);
    expect(handlers.has('disconnect')).toBe(true);
    expect(secondChannel.on).toHaveBeenCalled();
    expect(updateConfig).toHaveBeenCalledTimes(1);
  });
});
