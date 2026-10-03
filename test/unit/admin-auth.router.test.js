import {jest} from '@jest/globals';
import {
  createAdminElevation,
  deleteAdminElevation,
} from '../../server/connection/api/admin-auth.router.js';

function createResponse() {
  const response = {status: jest.fn(), json: jest.fn()};
  response.status.mockReturnValue(response);
  return response;
}

describe('admin elevation creation', () => {
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

    createAdminElevation(req, res);

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

    createAdminElevation(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(elevateSession).not.toHaveBeenCalled();
  });

  it('accepts a password shorter than 12 characters when the configured minimum allows it', () => {
    const elevateSession = jest.fn(() => 61_000);
    const req = {
      body: {password: '123456'},
      securityContext: {authenticationMethod: 'session', deviceSessionId: 'session-1'},
      services: {
        getSystemConfig: () => ({
          admin: {password: '123456', passwordMinLength: 6, unlockMinutes: 1},
        }),
        getDeviceSessionService: () => ({elevateSession}),
      },
    };
    const res = createResponse();

    createAdminElevation(req, res);

    expect(elevateSession).toHaveBeenCalledWith('session-1', 60_000);
    expect(res.json).toHaveBeenCalledWith({ok: true, adminUntil: 61_000});
  });
});

describe('admin elevation deletion', () => {
  it('revokes only the current elevation and disconnects its sockets', () => {
    const revokeElevation = jest.fn(() => true);
    const currentSocket = {
      securityContext: {deviceSessionId: 'session-1'},
      disconnect: jest.fn(),
    };
    const otherSocket = {
      securityContext: {deviceSessionId: 'session-2'},
      disconnect: jest.fn(),
    };
    const req = {
      securityContext: {
        authenticationMethod: 'session',
        deviceSessionId: 'session-1',
        role: 'admin',
      },
      services: {
        getDeviceSessionService: () => ({revokeElevation}),
        getServer: () => ({
          io: {of: () => ({sockets: new Map([
            ['current', currentSocket],
            ['other', otherSocket],
          ])})},
        }),
      },
    };
    const res = createResponse();

    deleteAdminElevation(req, res);

    expect(revokeElevation).toHaveBeenCalledWith('session-1');
    expect(currentSocket.disconnect).toHaveBeenCalledWith(true);
    expect(otherSocket.disconnect).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ok: true});
  });

  it('rejects a non-session administrator', () => {
    const revokeElevation = jest.fn();
    const req = {
      securityContext: {authenticationMethod: 'loopback', role: 'admin'},
      services: {getDeviceSessionService: () => ({revokeElevation})},
    };
    const res = createResponse();

    deleteAdminElevation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(revokeElevation).not.toHaveBeenCalled();
  });
});
