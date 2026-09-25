import sinon from 'sinon';
import {
  sessionManagementRouter,
  sessionRouter,
  sessionGuardMiddleware,
} from '../../server/connection/api/session.middleware.js';
import {createSecurityService} from '../../server/services/security/createSecurityService.js';

function withSecurity(services) {
  const configuredServices = {
    ...services,
    getDeviceSessionService: services.getDeviceSessionService || (() => ({authenticate: () => null})),
  };
  return {
    ...configuredServices,
    getSecurity: () => createSecurityService(configuredServices),
  };
}

function createTestSessionGuard(services) {
  return (req, res, next) => {
    req.services = withSecurity(services);
    sessionGuardMiddleware(req, res, next);
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
    const authenticate = sandbox.stub().returns(null);
    const middleware = createTestSessionGuard({
      getDeviceSessionService: () => ({authenticate}),
      getSystemConfig: () => ({
        session: {cookieName: 'session'},
      }),
    });

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

    expect(next.calledOnce).toBe(true);
    expect(authenticate.called).toBe(false);
    expect(res.state.statusCode).toBeNull();
  });

  it('rejects remote unauthorized request', () => {
    const authenticate = sandbox.stub().returns(null);
    const middleware = createTestSessionGuard({
      getDeviceSessionService: () => ({authenticate}),
      getSystemConfig: () => ({
        session: {cookieName: 'session'},
      }),
    });

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

    expect(next.called).toBe(false);
    expect(authenticate.calledOnceWithExactly(undefined)).toBe(true);
    expect(res.state.statusCode).toBe(401);
    expect(res.state.contentType).toBe('text/plain');
    expect(res.state.body).toBe('Unauthorized');
  });

  it('rejects a direct remote request spoofing localhost through x-forwarded-for', () => {
    const authenticate = sandbox.stub().returns(null);
    const middleware = createTestSessionGuard({
      getDeviceSessionService: () => ({authenticate}),
      getSystemConfig: () => ({session: {cookieName: 'session'}}),
    });
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
    expect(authenticate.calledOnceWithExactly(undefined)).toBe(true);
    expect(res.state.statusCode).toBe(401);
  });

  it('accepts a remote valid request and sets its security context', () => {
    const authenticate = sandbox.stub().returns({id: 'session-123'});
    const middleware = createTestSessionGuard({
      getDeviceSessionService: () => ({authenticate}),
      getSystemConfig: () => ({
        session: {
          cookieName: 'session',
        },
      }),
    });

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

    expect(authenticate.calledOnceWithExactly('token-123')).toBe(true);
    expect(next.calledOnce).toBe(true);
    expect(req.securityContext).toEqual(expect.objectContaining({
      authenticated: true,
      authenticationMethod: 'session',
      clientAddress: '10.0.0.12',
      transport: 'http',
    }));
  });

  it('returns friendly html page for browser unauthorized request', () => {
    const authenticate = sandbox.stub().returns(null);
    const middleware = createTestSessionGuard({
      getDeviceSessionService: () => ({authenticate}),
      getSystemConfig: () => ({
        session: {
          cookieName: 'session',
        },
      }),
    });

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

    expect(authenticate.calledOnceWithExactly(undefined)).toBe(true);
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
    const createSession = sandbox.stub().returns({
      token: 'device-session-token',
      session: {id: 'session-123'},
    });
    const publishEvent = sandbox.stub();
    const services = {
      getEvents: () => ({
        publishEvent,
      }),
      getDeviceSessionService: () => ({createSession}),
      getTokenManager,
      getSystemConfig: () => ({
        session: {
          cookieName: 'session',
          cookieMaxAgeDays: 1,
        },
        https: {enabled: true},
      }),
    };
    const router = sessionRouter;
    const req = {
      method: 'GET',
      url: '/token-123',
      originalUrl: '/token-123',
      baseUrl: '',
      services: withSecurity(services),
      headers: {'user-agent': 'test browser'},
      socket: {remoteAddress: '10.0.0.8'},
      get: (name) => name === 'user-agent' ? 'test browser' : undefined,
    };
    const res = {
      cookie: sandbox.stub(),
      redirect: sandbox.stub(),
      locals: {},
      headersSent: false,
    };

    router(req, res, (error) => {
      if (error) throw error;
    });

    expect(getTokenManager.calledOnce).toBe(true);
    expect(createSession.calledOnceWithExactly({
      clientAddress: '10.0.0.8',
      userAgent: 'test browser',
    })).toBe(true);
    expect(res.cookie.calledOnceWithExactly('session', 'device-session-token', {
      signed: true,
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    })).toBe(true);
    expect(publishEvent.firstCall.args[2]).toEqual(expect.objectContaining({
      sessionId: 'session-123',
      address: '10.0.0.8',
    }));
    expect(JSON.stringify(publishEvent.firstCall.args[2])).not.toContain('device-session-token');
    expect(res.redirect.calledOnceWithExactly('/')).toBe(true);
  });

  it('revokes and clears only the authenticated device session', () => {
    const revokeSession = sandbox.stub().returns(true);
    const clearCookie = sandbox.stub();
    const status = sandbox.stub().returnsThis();
    const end = sandbox.stub();
    const services = {
      getDeviceSessionService: () => ({revokeSession}),
      getSystemConfig: () => ({
        https: {enabled: false},
        session: {cookieName: 'session'},
      }),
    };
    const router = sessionManagementRouter;
    router({
      method: 'DELETE',
      url: '/current',
      originalUrl: '/current',
      baseUrl: '',
      headers: {},
      services,
      securityContext: {authenticationMethod: 'session', deviceSessionId: 'session-123'},
    }, {
      clearCookie, status, end,
      locals: {},
      headersSent: false,
    }, (error) => {
      if (error) throw error;
    });

    expect(revokeSession.calledOnceWithExactly('session-123')).toBe(true);
    expect(clearCookie.calledOnce).toBe(true);
    expect(clearCookie.firstCall.args[0]).toBe('session');
    expect(clearCookie.firstCall.args[1]).toEqual(expect.objectContaining({path: '/'}));
    expect(status.calledOnceWithExactly(204)).toBe(true);
    expect(end.calledOnce).toBe(true);
  });
});
