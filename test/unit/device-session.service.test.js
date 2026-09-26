import {jest} from '@jest/globals';
import {createHash} from 'node:crypto';
import {createDeviceSessionService} from '../../server/services/security/createDeviceSessionService.js';

describe('device session service', () => {
  it('issues opaque expiring credentials and persists only their hash', () => {
    const createSession = jest.fn((session) => session);
    const deleteExpiredSessions = jest.fn();
    const service = createDeviceSessionService({
      getSystemConfig: () => ({session: {cookieMaxAgeDays: 2}}),
      getPersistence: () => ({deviceSessionDao: {createSession, deleteExpiredSessions}}),
    }, {now: () => 1_000});

    const created = service.createSession({
      clientAddress: '10.0.0.8',
      userAgent: '  test browser  ',
      deviceName: 'Phone',
    });
    const persisted = createSession.mock.calls[0][0];

    expect(created.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(persisted.tokenHash).toBe(createHash('sha256').update(created.token).digest('hex'));
    expect(persisted.tokenHash).not.toBe(created.token);
    expect(persisted.expiresAt).toBe(1_000 + (2 * 24 * 60 * 60 * 1000));
    expect(persisted.lastActivityAt).toBe(1_000);
    expect(persisted.userAgent).toBe('test browser');
    expect(deleteExpiredSessions).toHaveBeenCalledWith(1_000);
  });

  it('refreshes activity and rejects expired or revoked sessions', () => {
    let timestamp = 1_000;
    const touchSession = jest.fn();
    const findSessionByTokenHash = jest.fn(() => ({
      id: 'session-1',
      expiresAt: 1_500,
      revokedAt: null,
      lastActivityAt: 900,
    }));
    const service = createDeviceSessionService({
      getSystemConfig: () => ({session: {cookieMaxAgeDays: 7}}),
      getPersistence: () => ({deviceSessionDao: {findSessionByTokenHash, touchSession}}),
    }, {now: () => timestamp});

    expect(service.authenticate('credential')).toEqual(expect.objectContaining({lastActivityAt: 1_000}));
    expect(touchSession).toHaveBeenCalledWith('session-1', 1_000);

    timestamp = 1_500;
    expect(service.authenticate('credential')).toBeNull();

    timestamp = 1_200;
    findSessionByTokenHash.mockReturnValueOnce({
      id: 'revoked', expiresAt: 2_000, revokedAt: 1_100, lastActivityAt: 1_000,
    });
    expect(service.authenticate('revoked-credential')).toBeNull();
  });

  it('lists safe session metadata with role, state and local history', () => {
    const listSessions = jest.fn(() => [
      {id: 'active', expiresAt: 2_000, revokedAt: null},
      {id: 'expired', expiresAt: 999, revokedAt: null},
      {id: 'revoked', expiresAt: 2_000, revokedAt: 900},
    ]);
    const listEvents = jest.fn(() => [
      {id: 1, sessionId: 'active', type: 'associated', occurredAt: 800},
    ]);
    const service = createDeviceSessionService({
      getSystemConfig: () => ({session: {cookieMaxAgeDays: 7}}),
      getPersistence: () => ({deviceSessionDao: {listSessions, listEvents}}),
    }, {now: () => 1_000});

    expect(service.listSessions()).toEqual([
      expect.objectContaining({id: 'active', role: 'controller', state: 'active'}),
      expect.objectContaining({id: 'expired', role: 'controller', state: 'expired'}),
      expect.objectContaining({id: 'revoked', role: 'controller', state: 'revoked'}),
    ]);
    expect(service.listHistory()).toEqual([
      {id: 1, sessionId: 'active', type: 'associated', occurredAt: 800},
    ]);
  });
});
