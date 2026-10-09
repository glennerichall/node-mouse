import {jest} from '@jest/globals';
import {
  listDeviceSessions,
  revokeAllDeviceSessions,
  revokeDeviceSession,
} from '../../server/connection/api/handlers/admin-sessions.handlers.js';

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    end: jest.fn(),
  };
}

describe('admin sessions controllers', () => {
  it('lists sessions and their audit history', () => {
    const sessions = [{id: 'session-1', role: 'controller', state: 'active'}];
    const history = [{id: 1, sessionId: 'session-1', type: 'associated'}];
    const req = {securityContext: {deviceSessionId: 'session-1'}, services: {getDeviceSessionService: () => ({
      listSessions: () => sessions,
      listHistory: () => history,
    })}};
    const res = createResponse();

    listDeviceSessions(req, res);

    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      sessions: [{...sessions[0], isCurrent: true}],
      history,
    });
  });

  it('revokes one session and reports an absent or already revoked session', () => {
    const revokeSession = jest.fn()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    const matchingSocket = {
      securityContext: {deviceSessionId: 'session-1'},
      disconnect: jest.fn(),
    };
    const unrelatedSocket = {
      securityContext: {deviceSessionId: 'session-2'},
      disconnect: jest.fn(),
    };
    const req = {
      params: {sessionId: 'session-1'},
      services: {
        getDeviceSessionService: () => ({revokeSession}),
        getServer: () => ({io: {of: () => ({sockets: new Map([
          ['socket-1', matchingSocket],
          ['socket-2', unrelatedSocket],
        ])})}}),
      },
    };
    const success = createResponse();
    const missing = createResponse();

    revokeDeviceSession(req, success);
    revokeDeviceSession(req, missing);

    expect(revokeSession).toHaveBeenCalledWith('session-1');
    expect(matchingSocket.disconnect).toHaveBeenCalledWith(true);
    expect(unrelatedSocket.disconnect).not.toHaveBeenCalled();
    expect(success.status).toHaveBeenCalledWith(204);
    expect(success.end).toHaveBeenCalledTimes(1);
    expect(missing.status).toHaveBeenCalledWith(404);
    expect(missing.json).toHaveBeenCalledWith({
      ok: false,
      message: 'Session d’appareil introuvable ou déjà révoquée.',
    });
  });

  it('revokes all other sessions and disconnects their sockets while preserving the current session', () => {
    const revokeAllSessions = jest.fn(() => 2);
    const currentSocket = {
      securityContext: {deviceSessionId: 'current'},
      disconnect: jest.fn(),
    };
    const activeSocket = {
      securityContext: {deviceSessionId: 'active-other'},
      disconnect: jest.fn(),
    };
    const expiredSocket = {
      securityContext: {deviceSessionId: 'expired-other'},
      disconnect: jest.fn(),
    };
    const revokedSocket = {
      securityContext: {deviceSessionId: 'already-revoked'},
      disconnect: jest.fn(),
    };
    const service = {
      listSessions: () => [
        {id: 'current', state: 'active'},
        {id: 'active-other', state: 'active'},
        {id: 'expired-other', state: 'expired'},
        {id: 'already-revoked', state: 'revoked'},
      ],
      revokeAllSessions,
    };
    const req = {
      securityContext: {deviceSessionId: 'current'},
      services: {
        getDeviceSessionService: () => service,
        getServer: () => ({io: {of: () => ({sockets: new Map([
          ['current', currentSocket],
          ['active', activeSocket],
          ['expired', expiredSocket],
          ['revoked', revokedSocket],
        ])})}}),
      },
    };
    const res = createResponse();

    revokeAllDeviceSessions(req, res);

    expect(revokeAllSessions).toHaveBeenCalledWith({exceptId: 'current'});
    expect(currentSocket.disconnect).not.toHaveBeenCalled();
    expect(activeSocket.disconnect).toHaveBeenCalledWith(true);
    expect(expiredSocket.disconnect).toHaveBeenCalledWith(true);
    expect(revokedSocket.disconnect).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ok: true, revokedCount: 2});
  });
});
