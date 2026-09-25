import {jest} from '@jest/globals';
import {httpOriginGuard, sessionCsrfGuard, isOriginAllowed, normalizeOrigin} from '../../server/connection/security/origin.js';

describe('Origin validation', () => {
  it('normalizes valid origins and rejects opaque or malformed origins', () => {
    expect(normalizeOrigin('https://example.test/path')).toBe('https://example.test');
    expect(normalizeOrigin('null')).toBe('');
    expect(normalizeOrigin('not an origin')).toBe('');
  });

  it('allows same-origin and explicitly configured origins only', () => {
    expect(isOriginAllowed('https://app.example.test', 'https://app.example.test/')).toBe(true);
    expect(isOriginAllowed('https://pwa.example.test', 'https://server.example.test', ['https://pwa.example.test'])).toBe(true);
    expect(isOriginAllowed('https://evil.example.test', 'https://server.example.test')).toBe(false);
  });

  it('rejects a cross-origin write', () => {
    const res = {status: jest.fn().mockReturnThis(), json: jest.fn()};
    const next = jest.fn();

    httpOriginGuard({
      method: 'PATCH',
      get: (header) => header === 'origin' ? 'https://evil.test' : 'remote.test',
      protocol: 'https',
      services: {getSystemConfig: () => ({allowedOrigins: []})},
    }, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();

  });

  it('requires Origin for session-backed unsafe requests', () => {
    const response = {status: jest.fn().mockReturnThis(), json: jest.fn()};
    const next = jest.fn();
    sessionCsrfGuard({method: 'DELETE', securityContext: {authenticationMethod: 'session'}, get: () => ''}, response, next);
    expect(response.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('does not apply CSRF Origin checks to safe methods', () => {
    const next = jest.fn();
    httpOriginGuard({method: 'GET', get: () => ''}, {}, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('sets credentialed CORS headers for explicitly trusted origins', () => {
    const res = {set: jest.fn(), vary: jest.fn(), status: jest.fn().mockReturnThis(), end: jest.fn()};
    const next = jest.fn();
    httpOriginGuard({
      method: 'GET',
      protocol: 'https',
      get: (header) => ({origin: 'https://pwa.test', host: 'server.test'}[header]),
      services: {getSystemConfig: () => ({allowedOrigins: ['https://pwa.test']})},
    }, res, next);

    expect(res.set).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'https://pwa.test');
    expect(res.set).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
    expect(res.vary).toHaveBeenCalledWith('Origin');
    expect(next).toHaveBeenCalledTimes(1);
  });
});
