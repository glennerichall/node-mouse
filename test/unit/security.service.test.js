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

function createService({isValid = () => false, trustProxy = ''} = {}) {
  return createSecurityService({
    getSystemConfig: () => ({
      trustProxy,
      session: {cookieName: 'session'},
    }),
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
    const isValid = jest.fn((token) => token === 'valid-token');
    const service = createService({isValid});
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

  it('resolves a forwarded client only through a configured trusted proxy', () => {
    const context = createService({trustProxy: 'loopback'}).createClientContext({
      transport: 'http',
      request: createRequest({address: '127.0.0.1', forwardedFor: '2001:db8::8'}),
    });

    expect(context.clientAddress).toBe('2001:db8::8');
    expect(context.local).toBe(false);
  });
});
