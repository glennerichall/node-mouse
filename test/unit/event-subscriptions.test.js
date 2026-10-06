import {jest} from '@jest/globals';
import {createEventSubscriptions} from '../../server/init/createEventSubscriptions.js';

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
    Object.values(subscriptions).forEach(subscribe => subscribe(channel));

    expect(Object.keys(subscriptions)).toEqual([
      'subscribeInput',
      'subscribeBrowser',
      'subscribeQr',
      'subscribeAdmin',
      'subscribePreview',
      'subscribeSamsung',
      'subscribeVlc',
      'subscribeWindow',
      'subscribeConnection',
    ]);
    expect(updateConfig).toHaveBeenCalledTimes(1);
    expect(handlers.has('mouse:move')).toBe(true);
    expect(handlers.has('disconnect')).toBe(true);
  });
});
