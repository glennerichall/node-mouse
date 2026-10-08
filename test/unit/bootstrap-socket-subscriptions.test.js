import {jest} from '@jest/globals';
import {bootstrapSocket} from '../../server/init/bootstrapSocket.js';

describe('bootstrapSocket route builders', () => {
  it('builds the route tree and attaches the service container to each request', async () => {
    const connectionHandlers = [];
    const publishEvent = jest.fn();
    const io = {
      engine: {use: jest.fn()},
      use: jest.fn(),
      on: jest.fn((eventName, handler) => connectionHandlers.push(handler)),
    };
    const services = {
      getServer: () => ({io, cookieParser: jest.fn()}),
      getEvents: () => ({publishEvent}),
      getInputController: () => ({mouse: {click: jest.fn()}, keyboard: {}, updateConfig: jest.fn()}),
      getRemotes: () => ({
        browser: {},
        adminActions: {forceUpdateCheck: jest.fn().mockResolvedValue({ok: true, message: 'done'})},
        qrActions: {},
        preview: {},
        samsung: {},
        vlc: {},
        windowActions: {},
      }),
      getConfig: () => ({}),
      getSystemConfig: () => ({
        protocol: 'http',
        allowedOrigins: [],
        adminActionsEnabled: true,
        session: {socketEventMaxAgeMs: 1000},
      }),
      getAuthorization: () => ({authorize: () => ({allowed: true})}),
    };

    bootstrapSocket(services);
    const socket = {id: 'client-123', securityContext: {}, on: jest.fn(), emit: jest.fn()};
    connectionHandlers[0](socket);

    const routeRequest = socket.on.mock.calls.find(([eventName]) => eventName === 'route:request')[1];
    const response = jest.fn();
    routeRequest({path: 'admin/update-check', method: 'POST', body: {}}, response);
    await new Promise(resolve => setImmediate(resolve));

    expect(response).toHaveBeenCalledWith({ok: true, message: 'done'});
    expect(socket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
  });
});
