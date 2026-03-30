import sinon from 'sinon';
import {createSocketSessionAuthMiddleware} from '../../server/connection/socket/socket-session-auth.js';

describe('createSocketSessionAuthMiddleware', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('allows localhost socket without cookie', () => {
    const isValid = sandbox.stub().returns(false);
    const middleware = createSocketSessionAuthMiddleware(
      {
        tokenManager: {isValid},
        cookies: sandbox.stub(),
      },
      {cookieName: 'session'},
    );
    const next = sandbox.stub();
    const socket = {
      request: {
        socket: {remoteAddress: '127.0.0.1'},
        signedCookies: {},
      },
    };

    middleware.authorizeSocket(socket, next);

    expect(next.calledOnceWithExactly()).toBe(true);
    expect(isValid.called).toBe(false);
  });

  it('rejects remote unauthorized socket', () => {
    const isValid = sandbox.stub().returns(false);
    const middleware = createSocketSessionAuthMiddleware(
      {
        tokenManager: {isValid},
        cookies: sandbox.stub(),
      },
      {cookieName: 'session'},
    );
    const next = sandbox.stub();
    const socket = {
      request: {
        socket: {remoteAddress: '10.0.0.8'},
        signedCookies: {},
      },
    };

    middleware.authorizeSocket(socket, next);

    expect(next.calledOnce).toBe(true);
    expect(next.firstCall.args[0]).toBeInstanceOf(Error);
    expect(next.firstCall.args[0].message).toBe('unauthorized');
    expect(next.firstCall.args[0].data).toEqual({
      code: 'ENTRY_TOKEN_INVALID',
      message: 'Rescannez le code QR du serveur.',
    });
  });

  it('accepts remote authorized socket and sets sessionToken', () => {
    const isValid = sandbox.stub().returns(true);
    const middleware = createSocketSessionAuthMiddleware(
      {
        tokenManager: {isValid},
        cookies: sandbox.stub(),
      },
      {cookieName: 'session'},
    );
    const next = sandbox.stub();
    const socket = {
      request: {
        socket: {remoteAddress: '10.0.0.8'},
        signedCookies: {session: 'token-abc'},
      },
    };

    middleware.authorizeSocket(socket, next);

    expect(next.calledOnceWithExactly()).toBe(true);
    expect(socket.sessionToken).toBe('token-abc');
  });

  it('prepareSocketAuth delegates to cookies middleware', () => {
    const cookies = sandbox.stub().callsFake((_req, _res, next) => next());
    const middleware = createSocketSessionAuthMiddleware(
      {
        tokenManager: {isValid: sandbox.stub()},
        cookies,
      },
      {cookieName: 'session'},
    );
    const engineUse = sandbox.stub();
    const io = {engine: {use: engineUse}};

    middleware.prepareSocketAuth(io);

    expect(engineUse.calledOnce).toBe(true);
    const callback = engineUse.firstCall.args[0];
    const next = sandbox.stub();
    callback({}, {}, next);
    expect(cookies.calledOnce).toBe(true);
    expect(next.calledOnce).toBe(true);
  });
});
