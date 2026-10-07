import {jest} from '@jest/globals';
import {bootstrapSocket} from '../../server/init/bootstrapSocket.js';

describe('bootstrapSocket event subscriptions', () => {
  it('uses the registered event subscription service for new channels', () => {
    const connectionHandlers = [];
    const subscribe = jest.fn();
    const publishEvent = jest.fn();
    const io = {
      engine: {use: jest.fn()},
      use: jest.fn(),
      on: jest.fn((eventName, handler) => connectionHandlers.push(handler)),
    };
    const services = {
      getServer: () => ({io, cookieParser: jest.fn()}),
      getEventSubscriptions: () => ({subscribe}),
      getEvents: () => ({publishEvent}),
      getSystemConfig: () => ({
        protocol: 'http',
        allowedOrigins: [],
        adminActionsEnabled: true,
        session: {socketEventMaxAgeMs: 1000},
      }),
      getAuthorization: () => ({authorize: () => ({allowed: true})}),
    };

    bootstrapSocket(services);
    const socket = {id: 'client-123', on: jest.fn(), emit: jest.fn()};
    connectionHandlers[0](socket);

    expect(subscribe).toHaveBeenCalledWith(expect.objectContaining({
      id: socket.id,
      on: expect.any(Function),
      emit: expect.any(Function),
    }));
    expect(subscribe.mock.calls[0][0]).not.toBe(socket);
  });
});
