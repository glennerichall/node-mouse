import {jest} from '@jest/globals';
import {
  broadcast,
  createActionHandlers,
  createNotificationHandler,
  createSocketGuardMiddleware,
  createGuards,
} from '../../server/init/socketBootstrapComponents.js';
import {
  PUBSUB_EVENT_SOCKET_CLIENT_CONNECTED,
  PUBSUB_SERVICE_SOCKET,
} from '../../server/services/pubsub/serviceEventConstants.js';

describe('socket bootstrap components', () => {
  it('broadcasts the same arguments to every handler', () => {
    const first = jest.fn();
    const second = jest.fn();
    const handler = broadcast(first, second);

    expect(handler('socket', 42)).toEqual([undefined, undefined]);
    expect(first).toHaveBeenCalledWith('socket', 42);
    expect(second).toHaveBeenCalledWith('socket', 42);
  });

  it('publishes the connection event and does not require transport details', () => {
    const publishEvent = jest.fn();
    const services = {getEvents: () => ({publishEvent})};
    const socket = {id: 'client-123', emit: jest.fn()};

    createNotificationHandler(services)(socket);

    expect(publishEvent).toHaveBeenCalledWith(
      PUBSUB_SERVICE_SOCKET,
      PUBSUB_EVENT_SOCKET_CLIENT_CONNECTED,
      {clientId: socket.id},
    );
    expect(socket.emit).not.toHaveBeenCalled();
  });

  it('registers timestamp and admin guards before continuing', () => {
    const use = jest.fn();
    const next = jest.fn();
    const services = {
      getSystemConfig: () => ({
        session: {socketEventMaxAgeMs: 1000},
        adminActionsEnabled: true,
      }),
      getAuthorization: () => ({authorize: jest.fn(() => ({allowed: true}))}),
    };
    const socket = {
      id: 'client-123',
      securityContext: {role: 'admin'},
      use,
      emit: jest.fn(),
    };

    createSocketGuardMiddleware(services)(socket, next);

    expect(use).toHaveBeenCalledTimes(2);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('creates all named event subscriptions for a channel', () => {
    const services = {
      getInputController: () => ({mouse: {}, keyboard: {}, updateConfig: jest.fn()}),
      getRemotes: () => ({browser: {}, adminActions: {}, qrActions: {}, preview: {}, samsung: {}, vlc: {}, windowActions: {}}),
      getConfig: () => ({}),
      getEvents: () => ({publishEvent: jest.fn()}),
    };
    const channel = {id: 'client-123', on: jest.fn(), emit: jest.fn()};
    const handler = createActionHandlers(services);

    handler(channel);

    expect(channel.on).toHaveBeenCalled();
    expect(channel.on.mock.calls.length).toBeGreaterThan(10);
  });

  it('builds the four Socket.IO guards in order', () => {
    const services = {
      getSystemConfig: () => ({protocol: 'http', allowedOrigins: [], session: {socketEventMaxAgeMs: 100}}),
      getAuthorization: () => ({authorize: () => ({allowed: false})}),
      getSecurity: () => ({authenticateSocket: jest.fn()}),
    };

    expect(createGuards(services)).toHaveLength(4);
  });
});
