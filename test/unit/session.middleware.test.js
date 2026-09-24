import sinon from 'sinon';
import {
  createSessionRouter,
  createSessionGuard,
} from '../../server/connection/api/session.middleware.js';
import {createSecurityService} from '../../server/services/security/createSecurityService.js';

function withSecurity(services) {
  return {
    ...services,
    getSecurity: () => createSecurityService(services),
  };
}

function createResponseSpy() {
  const state = {
    statusCode: null,
    contentType: null,
    body: null,
  };
  return {
    state,
    status(code) {
      state.statusCode = code;
      return this;
    },
    type(contentType) {
      state.contentType = contentType;
      return this;
    },
    send(body) {
      state.body = body;
      return this;
    },
  };
}

describe('createSessionValidationMiddleware', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('bypasses auth for localhost request', () => {
    const isValid = sandbox.stub().returns(false);
    const getTokenManager = sandbox.stub().returns({isValid});
    const middleware = createSessionGuard(withSecurity({
      getTokenManager,
      getSystemConfig: () => ({
        session: {
          cookieName: 'session',
        },
      }),
    }));

    const req = {
      ip: '127.0.0.1',
      hostname: '127.0.0.1',
      headers: {host: '127.0.0.1:3000'},
      socket: {remoteAddress: '127.0.0.1'},
      signedCookies: {},
    };
    const res = createResponseSpy();
    const next = sandbox.stub();

    middleware(req, res, next);

    expect(getTokenManager.called).toBe(false);
    expect(next.calledOnce).toBe(true);
    expect(isValid.called).toBe(false);
    expect(res.state.statusCode).toBeNull();
  });

  it('rejects remote unauthorized request', () => {
    const isValid = sandbox.stub().returns(false);
    const getTokenManager = sandbox.stub().returns({isValid});
    const middleware = createSessionGuard(withSecurity({
      getTokenManager,
      getSystemConfig: () => ({
        session: {
          cookieName: 'session',
        },
      }),
    }));

    const req = {
      ip: '10.0.0.12',
      hostname: '10.0.0.12',
      headers: {host: '10.0.0.12:3000'},
      socket: {remoteAddress: '10.0.0.12'},
      signedCookies: {},
    };
    const res = createResponseSpy();
    const next = sandbox.stub();

    middleware(req, res, next);

    expect(getTokenManager.calledOnce).toBe(true);
    expect(next.called).toBe(false);
    expect(isValid.calledOnce).toBe(true);
    expect(res.state.statusCode).toBe(401);
    expect(res.state.contentType).toBe('text/plain');
    expect(res.state.body).toBe('Unauthorized');
  });

  it('rejects a direct remote request spoofing localhost through x-forwarded-for', () => {
    const isValid = sandbox.stub().returns(false);
    const middleware = createSessionGuard(withSecurity({
      getTokenManager: () => ({isValid}),
      getSystemConfig: () => ({session: {cookieName: 'session'}}),
    }));
    const req = {
      ip: '10.0.0.12',
      headers: {'x-forwarded-for': '127.0.0.1'},
      socket: {remoteAddress: '10.0.0.12'},
      signedCookies: {},
    };
    const res = createResponseSpy();
    const next = sandbox.stub();

    middleware(req, res, next);

    expect(next.called).toBe(false);
    expect(isValid.calledOnce).toBe(true);
    expect(res.state.statusCode).toBe(401);
  });

  it('accepts a remote valid request and sets its security context', () => {
    const isValid = sandbox.stub().returns(true);
    const getTokenManager = sandbox.stub().returns({isValid});
    const middleware = createSessionGuard(withSecurity({
      getTokenManager,
      getSystemConfig: () => ({
        session: {
          cookieName: 'session',
        },
      }),
    }));

    const req = {
      ip: '10.0.0.12',
      hostname: '10.0.0.12',
      headers: {host: '10.0.0.12:3000'},
      socket: {remoteAddress: '10.0.0.12'},
      signedCookies: {session: 'token-123'},
    };
    const res = createResponseSpy();
    const next = sandbox.stub();

    middleware(req, res, next);

    expect(getTokenManager.calledOnce).toBe(true);
    expect(next.calledOnce).toBe(true);
    expect(req.securityContext).toEqual(expect.objectContaining({
      authenticated: true,
      authenticationMethod: 'session',
      clientAddress: '10.0.0.12',
      transport: 'http',
    }));
  });

  it('returns friendly html page for browser unauthorized request', () => {
    const isValid = sandbox.stub().returns(false);
    const getTokenManager = sandbox.stub().returns({isValid});
    const middleware = createSessionGuard(withSecurity({
      getTokenManager,
      getSystemConfig: () => ({
        session: {
          cookieName: 'session',
        },
      }),
    }));

    const req = {
      ip: '10.0.0.12',
      hostname: '10.0.0.12',
      headers: {host: '10.0.0.12:3000'},
      socket: {remoteAddress: '10.0.0.12'},
      signedCookies: {},
      accepts: sandbox.stub().withArgs('html').returns(true),
    };
    const res = createResponseSpy();
    const next = sandbox.stub();

    middleware(req, res, next);

    expect(getTokenManager.calledOnce).toBe(true);
    expect(next.called).toBe(false);
    expect(res.state.statusCode).toBe(401);
    expect(res.state.contentType).toBe('text/html');
    expect(res.state.body).toMatch(/Rescannez le code QR/i);
  });
});

describe('createSessionRouter', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('redirects browser entry requests after creating the session', () => {
    const isValid = sandbox.stub().withArgs('token-123').returns(true);
    const getTokenManager = sandbox.stub().returns({isValid});
    const services = {
      getEvents: () => ({
        publishEvent: sandbox.stub(),
      }),
      getTokenManager,
      getSystemConfig: () => ({
        session: {
          cookieName: 'session',
        },
      }),
    };
    const router = createSessionRouter(withSecurity(services));
    const layer = router.stack.find((entry) => entry.route?.path === '/:token' && entry.route.methods.get);
    const handler = layer.route.stack[0].handle;
    const req = {
      params: {token: 'token-123'},
    };
    const res = {
      createSession: sandbox.stub(),
      redirect: sandbox.stub(),
    };

    handler(req, res);

    expect(getTokenManager.calledOnce).toBe(true);
    expect(res.createSession.calledOnceWithExactly('token-123')).toBe(true);
    expect(res.redirect.calledOnceWithExactly('/')).toBe(true);
  });
});
