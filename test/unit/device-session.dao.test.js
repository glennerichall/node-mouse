import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createDatabaseProvider} from '../../server/services/persistence/createDatabaseProvider.js';
import {createDeviceSessionDao} from '../../server/services/persistence/createDeviceSessionDao.js';

describe('device session dao', () => {
  let tempDir;
  let getDatabase;
  let dao;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'remote-mouse-device-session-'));
    getDatabase = createDatabaseProvider({
      getDatabasePath: () => path.join(tempDir, 'sessions.sqlite'),
    });
    dao = createDeviceSessionDao({getDatabase});
  });

  afterEach(() => {
    try {
      getDatabase?.().close();
    } catch (_error) {
      // Best effort.
    }
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('persists session metadata without returning the credential hash', () => {
    const session = dao.createSession({
      id: 'session-1',
      tokenHash: 'sha256-hash',
      createdAt: 100,
      expiresAt: 200,
      lastActivityAt: 100,
      clientAddress: '10.0.0.8',
      userAgent: 'test browser',
      deviceName: 'Phone',
    });

    expect(session).toEqual({
      id: 'session-1',
      createdAt: 100,
      expiresAt: 200,
      lastActivityAt: 100,
      revokedAt: null,
      clientAddress: '10.0.0.8',
      userAgent: 'test browser',
      deviceName: 'Phone',
    });
    expect(dao.findSessionByTokenHash('sha256-hash')).toEqual(session);
    expect(JSON.stringify(dao.listSessions())).not.toContain('sha256-hash');
  });

  it('touches, revokes and deletes expired sessions', () => {
    dao.createSession({
      id: 'active', tokenHash: 'active-hash', createdAt: 100, expiresAt: 500,
      lastActivityAt: 100, clientAddress: '', userAgent: '', deviceName: '',
    });
    dao.createSession({
      id: 'expired', tokenHash: 'expired-hash', createdAt: 50, expiresAt: 100,
      lastActivityAt: 50, clientAddress: '', userAgent: '', deviceName: '',
    });

    expect(dao.touchSession('active', 150)).toBe(1);
    expect(dao.revokeSession('active', 200)).toBe(1);
    expect(dao.findSessionById('active').revokedAt).toBe(200);
    expect(dao.revokeSession('active', 250)).toBe(0);
    expect(dao.deleteExpiredSessions(100)).toBe(2);
    expect(dao.listSessions()).toEqual([]);
  });
});
