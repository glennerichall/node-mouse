import {jest} from '@jest/globals';
import {unlockAdmin} from '../../server/connection/api/admin-auth.router.js';

function createResponse() {
  const response = {status: jest.fn(), json: jest.fn()};
  response.status.mockReturnValue(response);
  return response;
}

describe('admin unlock', () => {
  it('elevates the current device session for the configured duration', () => {
    const elevateSession = jest.fn(() => 901_000);
    const req = {
      body: {password: 'a-secure-password'},
      securityContext: {authenticationMethod: 'session', deviceSessionId: 'session-1'},
      services: {
        getSystemConfig: () => ({admin: {password: 'a-secure-password', unlockMinutes: 15}}),
        getDeviceSessionService: () => ({elevateSession}),
      },
    };
    const res = createResponse();

    unlockAdmin(req, res);

    expect(elevateSession).toHaveBeenCalledWith('session-1', 900_000);
    expect(res.json).toHaveBeenCalledWith({ok: true, adminUntil: 901_000});
  });

  it('rejects an invalid password without elevating the session', () => {
    const elevateSession = jest.fn();
    const req = {
      body: {password: 'wrong-password'},
      securityContext: {authenticationMethod: 'session', deviceSessionId: 'session-1'},
      services: {
        getSystemConfig: () => ({admin: {password: 'a-secure-password', unlockMinutes: 15}}),
        getDeviceSessionService: () => ({elevateSession}),
      },
    };
    const res = createResponse();

    unlockAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(elevateSession).not.toHaveBeenCalled();
  });
});
