import {jest} from '@jest/globals';
import {
  createSecurityService,
  SECURITY_REASON_INVALID_SESSION,
  SECURITY_REASON_LOCAL_CLIENT,
  SECURITY_REASON_VALID_SESSION,
} from '../../server/services/security/createSecurityService.js';

function createRequest({address, token, forwardedFor} = {}) {
  return {
    headers: forwardedFor ? {'x-forwarded-for': forwardedFor} : {},
    socket: {remoteAddress: address},
    signedCookies: token ? {session: token} : {},
  };
}

function createService({isValid = () => false, authenticate = () => null, trustProxy = ''} = {}) {
  return createSecurityService({
    getSystemConfig: () => ({
      trustProxy,
      session: {cookieName: 'session'},
    }),
    getDeviceSessionService: () => ({authenticate}),
    getTokenManager: () => ({isValid}),
  });
}

describe('createSecurityService', () => {
  it.each([
    ['http', (service, request) => service.authenticateHttp(request)],
    ['socket.io', (service, request) => service.authenticateSocket({request})],
  ])('allows a local client consistently over %s', (transport, authenticate) => {
    const decision = authenticate(createService(), createRequest({address: '::1'}));

    expect(decision).toEqual({
      allowed: true,
      reason: SECURITY_REASON_LOCAL_CLIENT,
      context: {
        correlationId: expect.any(String),
        transport,
        clientAddress: '::1',
        local: true,
        authenticated: true,
        authenticationMethod: 'local',
      },
    });
  });

  it('returns equivalent decisions for HTTP and Socket.IO', () => {
    const authenticate = jest.fn((token) => token === 'valid-token' ? {id: 'device-session-1'} : null);
    const service = createService({authenticate});
    const request = createRequest({address: '10.0.0.8', token: 'valid-token'});

    const http = service.authenticateHttp(request);
    const socket = service.authenticateSocket({request});

    expect({...http, context: {...http.context, correlationId: '', transport: ''}})
      .toEqual({...socket, context: {...socket.context, correlationId: '', transport: ''}});
    expect(http.reason).toBe(SECURITY_REASON_VALID_SESSION);
  });

  it('rejects an invalid session without exposing its token in the decision', () => {
    const decision = createService().authenticateHttp(createRequest({
      address: '10.0.0.8',
      token: 'sensitive-token',
    }));

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe(SECURITY_REASON_INVALID_SESSION);
    expect(JSON.stringify(decision)).not.toContain('sensitive-token');
  });

  it('authenticates a device session without validating the pairing token', () => {
    const isValid = jest.fn(() => false);
    const authenticate = jest.fn(() => ({id: 'device-session-1'}));
    const decision = createService({isValid, authenticate}).authenticateHttp(createRequest({
      address: '10.0.0.8',
      token: 'opaque-session-token',
    }));

    expect(decision.allowed).toBe(true);
    expect(decision.context).toEqual(expect.objectContaining({
      authenticationMethod: 'session',
      deviceSessionId: 'device-session-1',
    }));
    expect(authenticate).toHaveBeenCalledWith('opaque-session-token');
    expect(isValid).not.toHaveBeenCalled();
    expect(JSON.stringify(decision)).not.toContain('opaque-session-token');
  });

  it('uses the same device session decision for HTTP and Socket.IO', () => {
    const service = createService({
      authenticate: (token) => token === 'device-token' ? {id: 'session-1'} : null,
    });
    const request = createRequest({address: '10.0.0.8', token: 'device-token'});
    const http = service.authenticateHttp(request);
    const socket = service.authenticateSocket({request});

    expect({...http, context: {...http.context, correlationId: '', transport: ''}})
      .toEqual({...socket, context: {...socket.context, correlationId: '', transport: ''}});
    expect(http.context.authenticationMethod).toBe('session');
    expect(http.context.deviceSessionId).toBe('session-1');
  });

  it('rejects a legacy entry-token cookie instead of treating it as a session', () => {
    const isValid = jest.fn(() => true);
    const decision = createService({isValid})
      .authenticateHttp(createRequest({address: '10.0.0.8', token: 'legacy-token'}));

    expect(decision.allowed).toBe(false);
    expect(decision.context.authenticationMethod).toBeNull();
    expect(isValid).not.toHaveBeenCalled();
  });

  it('resolves a forwarded client only through a configured trusted proxy', () => {
    const context = createService({trustProxy: 'loopback'}).createClientContext({
      transport: 'http',
      request: createRequest({address: '127.0.0.1', forwardedFor: '2001:db8::8'}),
    });

    expect(context.clientAddress).toBe('2001:db8::8');
    expect(context.local).toBe(false);
  });
});
