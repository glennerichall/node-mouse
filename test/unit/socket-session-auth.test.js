import sinon from 'sinon';
import {createSocketSessionAuthMiddleware} from '../../server/connection/socket/createSocketSessionAuthMiddleware.js';
import {createSecurityService} from '../../server/services/security/createSecurityService.js';

describe('createSocketSessionAuthMiddleware', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  function createServices({authenticate = () => null, cookieName = 'session', trustProxy = ''} = {}) {
    const services = {
      getSystemConfig: () => ({
        trustProxy,
        session: {
          cookieName,
        },
      }),
      getDeviceSessionService: () => ({authenticate}),
    };
    services.getSecurity = () => createSecurityService(services);
    return services;
  }

  it('allows localhost socket without cookie', () => {
    const authenticate = sandbox.stub().returns(null);
    const authorizeSocket = createSocketSessionAuthMiddleware(createServices({authenticate}));
    const next = sandbox.stub();
    const socket = {
      request: {
        socket: {remoteAddress: '127.0.0.1'},
        signedCookies: {},
      },
    };

    authorizeSocket(socket, next);

    expect(next.calledOnceWithExactly()).toBe(true);
    expect(authenticate.called).toBe(false);
  });

  it('rejects remote unauthorized socket', () => {
    const authenticate = sandbox.stub().returns(null);
    const authorizeSocket = createSocketSessionAuthMiddleware(createServices({authenticate}));
    const next = sandbox.stub();
    const socket = {
      request: {
        socket: {remoteAddress: '10.0.0.8'},
        signedCookies: {},
      },
    };

    authorizeSocket(socket, next);

    expect(next.calledOnce).toBe(true);
    expect(next.firstCall.args[0]).toBeInstanceOf(Error);
    expect(next.firstCall.args[0].message).toBe('unauthorized');
    expect(next.firstCall.args[0].data).toEqual({
      code: 'ENTRY_TOKEN_INVALID',
      message: 'Rescannez le code QR du serveur.',
      reason: 'invalid-session',
      correlationId: expect.any(String),
    });
  });

  it('rejects a direct remote socket spoofing localhost through x-forwarded-for', () => {
    const authenticate = sandbox.stub().returns(null);
    const authorizeSocket = createSocketSessionAuthMiddleware(createServices({authenticate}));
    const next = sandbox.stub();
    const socket = {
      request: {
        headers: {'x-forwarded-for': '127.0.0.1'},
        socket: {remoteAddress: '10.0.0.8'},
        signedCookies: {},
      },
    };

    authorizeSocket(socket, next);

    expect(authenticate.calledOnce).toBe(true);
    expect(next.firstCall.args[0]).toBeInstanceOf(Error);
  });

  it('accepts remote authorized socket and sets its security context', () => {
    const authenticate = sandbox.stub().withArgs('token-abc').returns({id: 'session-123'});
    const authorizeSocket = createSocketSessionAuthMiddleware(createServices({authenticate}));
    const next = sandbox.stub();
    const socket = {
      request: {
        socket: {remoteAddress: '10.0.0.8'},
        signedCookies: {session: 'token-abc'},
      },
    };

    authorizeSocket(socket, next);

    expect(next.calledOnceWithExactly()).toBe(true);
    expect(socket.securityContext).toEqual(expect.objectContaining({
      authenticated: true,
      authenticationMethod: 'session',
      deviceSessionId: 'session-123',
      clientAddress: '10.0.0.8',
      transport: 'socket.io',
    }));
  });

  it('uses x-forwarded-for when the direct peer is a trusted proxy', () => {
    const authenticate = sandbox.stub().withArgs('token-abc').returns({id: 'session-123'});
    const authorizeSocket = createSocketSessionAuthMiddleware(createServices({
      authenticate,
      trustProxy: 'loopback',
    }));
    const next = sandbox.stub();
    const socket = {
      request: {
        headers: {
          'x-forwarded-for': '10.1.2.3, 127.0.0.1',
        },
        socket: {remoteAddress: '127.0.0.1'},
        signedCookies: {session: 'token-abc'},
      },
    };

    authorizeSocket(socket, next);

    expect(authenticate.calledOnceWithExactly('token-abc')).toBe(true);
    expect(next.calledOnceWithExactly()).toBe(true);
  });
});
