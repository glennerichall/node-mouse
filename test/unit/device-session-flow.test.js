import {jest} from '@jest/globals';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createDatabaseProvider} from '../../server/services/persistence/createDatabaseProvider.js';
import {createDeviceSessionDao} from '../../server/services/persistence/createDeviceSessionDao.js';
import {createEntryTokenDao} from '../../server/services/persistence/createEntryTokenDao.js';
import {createDeviceSessionService} from '../../server/services/security/createDeviceSessionService.js';
import {createSecurityService} from '../../server/services/security/createSecurityService.js';
import {sessionRouter} from '../../server/connection/api/session.middleware.js';

describe('device session flow', () => {
  let tempDir;
  let getDatabase;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'remote-mouse-session-flow-'));
    getDatabase = createDatabaseProvider({
      getDatabasePath: () => path.join(tempDir, 'sessions.sqlite'),
    });
  });

  afterEach(() => {
    try {
      getDatabase?.().close();
    } catch (_error) {
      // Best effort.
    }
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('exchanges a pairing token for a revocable HTTP and Socket.IO session', () => {
    const persistence = {
      deviceSessionDao: createDeviceSessionDao({getDatabase}),
      entryTokenDao: createEntryTokenDao({getDatabase}),
    };
    persistence.entryTokenDao.createEntryToken('pairing-token', Date.now());
    const isValid = jest.fn((token) => token === 'pairing-token');
    const services = {
      getPersistence: () => persistence,
      getSystemConfig: () => ({
        trustProxy: '',
        https: {enabled: false},
        session: {cookieName: 'session', cookieMaxAgeDays: 1},
      }),
      getTokenManager: () => ({isValid}),
      getEvents: () => ({publishEvent: jest.fn()}),
    };
    services.getDeviceSessionService = () => createDeviceSessionService(services);
    services.getSecurity = () => createSecurityService(services);

    const router = sessionRouter;
    const response = {
      cookie: jest.fn(),
      redirect: jest.fn(),
      locals: {},
      headersSent: false,
    };

    const pairingRequest = {
      method: 'GET',
      url: '/pairing-token',
      originalUrl: '/pairing-token',
      baseUrl: '',
      headers: {'user-agent': 'test phone'},
      socket: {remoteAddress: '10.0.0.8'},
      get: (name) => name === 'user-agent' ? 'test phone' : undefined,
    };
    pairingRequest.services = {
      ...services,
      getSecurity: () => services.getSecurity().forHttpRequest(pairingRequest),
    };

    router(pairingRequest, response, (error) => {
      if (error) throw error;
    });

    const sessionCookie = response.cookie.mock.calls[0][1];
    expect(sessionCookie).toBeTruthy();
    expect(sessionCookie).not.toBe('pairing-token');
    expect(response.redirect).toHaveBeenCalledWith('/');
    expect(persistence.entryTokenDao.hasEntryToken('pairing-token')).toBe(true);

    isValid.mockClear();
    const oldCookieRequest = {
      socket: {remoteAddress: '10.0.0.8'},
      signedCookies: {session: 'pairing-token'},
    };
    expect(services.getSecurity().authenticateHttp(oldCookieRequest).allowed).toBe(false);
    expect(services.getSecurity().authenticateSocket({request: oldCookieRequest}).allowed).toBe(false);
    expect(isValid).not.toHaveBeenCalled();

    const request = {
      socket: {remoteAddress: '10.0.0.8'},
      signedCookies: {session: sessionCookie},
    };
    const httpDecision = services.getSecurity().authenticateHttp(request);
    const socketDecision = services.getSecurity().authenticateSocket({request});

    expect(httpDecision.allowed).toBe(true);
    expect(httpDecision.context.authenticationMethod).toBe('session');
    expect(socketDecision.allowed).toBe(true);
    expect(socketDecision.context.deviceSessionId).toBe(httpDecision.context.deviceSessionId);
    expect(isValid).not.toHaveBeenCalled();

    expect(services.getDeviceSessionService().revokeSession(httpDecision.context.deviceSessionId)).toBe(true);
    expect(services.getSecurity().authenticateHttp(request).allowed).toBe(false);
  });
});
