import sinon from 'sinon';
import {createSocketSessionAuthMiddleware} from '../../server/connection/socket/createSocketSessionAuthMiddleware.js';

describe('createSocketSessionAuthMiddleware', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  function createServices({isValid = () => false, cookieName = 'session', trustProxy = ''} = {}) {
    return {
      getSystemConfig: () => ({
        trustProxy,
        session: {
          cookieName,
        },
      }),
      getTokenManager: () => ({
        isValid,
      }),
    };
  }

  it('allows localhost socket without cookie', () => {
    const isValid = sandbox.stub().returns(false);
    const authorizeSocket = createSocketSessionAuthMiddleware(createServices({isValid}));
    const next = sandbox.stub();
    const socket = {
      request: {
        socket: {remoteAddress: '127.0.0.1'},
        signedCookies: {},
      },
    };

    authorizeSocket(socket, next);

    expect(next.calledOnceWithExactly()).toBe(true);
    expect(isValid.called).toBe(false);
  });

  it('rejects remote unauthorized socket', () => {
    const isValid = sandbox.stub().returns(false);
    const authorizeSocket = createSocketSessionAuthMiddleware(createServices({isValid}));
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
    });
  });

  it('rejects a direct remote socket spoofing localhost through x-forwarded-for', () => {
    const isValid = sandbox.stub().returns(false);
    const authorizeSocket = createSocketSessionAuthMiddleware(createServices({isValid}));
    const next = sandbox.stub();
    const socket = {
      request: {
        headers: {'x-forwarded-for': '127.0.0.1'},
        socket: {remoteAddress: '10.0.0.8'},
        signedCookies: {},
      },
    };

    authorizeSocket(socket, next);

    expect(isValid.calledOnce).toBe(true);
    expect(next.firstCall.args[0]).toBeInstanceOf(Error);
  });

  it('accepts remote authorized socket and sets sessionToken', () => {
    const isValid = sandbox.stub().returns(true);
    const authorizeSocket = createSocketSessionAuthMiddleware(createServices({isValid}));
    const next = sandbox.stub();
    const socket = {
      request: {
        socket: {remoteAddress: '10.0.0.8'},
        signedCookies: {session: 'token-abc'},
      },
    };

    authorizeSocket(socket, next);

    expect(next.calledOnceWithExactly()).toBe(true);
    expect(socket.sessionToken).toBe('token-abc');
  });

  it('uses x-forwarded-for when the direct peer is a trusted proxy', () => {
    const isValid = sandbox.stub().returns(true);
    const authorizeSocket = createSocketSessionAuthMiddleware(createServices({
      isValid,
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

    expect(isValid.calledOnceWithExactly('token-abc')).toBe(true);
    expect(next.calledOnceWithExactly()).toBe(true);
  });
});
