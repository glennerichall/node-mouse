import {jest} from '@jest/globals';
import {createEventSubscriptionService} from '../../server/services/transport/createEventSubscriptionService.js';
import {assertEventChannel} from '../../server/services/transport/event-channel.js';

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
      on: jest.fn((eventName, handler) => {
        handlers.set(eventName, handler);
        return channel;
      }),
      emit: jest.fn(),
    };

    const subscriptions = createEventSubscriptionService(services);
    subscriptions.subscribe(channel);
    const secondChannel = {
      id: 'client-5678',
      on: jest.fn(() => secondChannel),
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

  it('rejects adapters that do not implement the channel contract', () => {
    expect(() => assertEventChannel({on: jest.fn()})).toThrow(
      'An event channel must expose on(eventName, handler) and emit(eventName, payload).',
    );
  });

  it('validates the channel at the transport boundary before subscribing', () => {
    const services = {
      getInputController: () => ({mouse: {}, keyboard: {}, updateConfig: jest.fn()}),
      getRemotes: () => ({
        browser: {}, adminActions: {}, qrActions: {}, preview: {}, samsung: {}, vlc: {}, windowActions: {},
      }),
      getConfig: () => ({}),
      getEvents: () => ({publishEvent: jest.fn()}),
    };
    const subscriptions = createEventSubscriptionService(services);
    expect(() => subscriptions.subscribe({id: 'invalid', on: jest.fn()})).toThrow(TypeError);
  });
});
