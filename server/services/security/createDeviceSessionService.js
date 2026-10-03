import {createHash, randomBytes, randomUUID} from 'node:crypto';

function hashToken(token) {
  return createHash('sha256').update(String(token)).digest('hex');
}

function normalizeText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

export function createDeviceSessionService(services, {now = Date.now} = {}) {
  const adminElevations = new Map();

  function getElevation(id) {
    const adminUntil = Number(adminElevations.get(id) || 0);
    if (adminUntil <= now()) {
      adminElevations.delete(id);
      return 0;
    }
    return adminUntil;
  }

  function getTtlMs() {
    const days = Number(services.getSystemConfig().session.cookieMaxAgeDays || 7);
    return Math.max(1, days) * 24 * 60 * 60 * 1000;
  }

  function createSession({clientAddress = '', userAgent = '', deviceName = ''} = {}) {
    const timestamp = now();
    const persistence = services.getPersistence();
    persistence.deviceSessionDao.deleteExpiredSessions(timestamp);
    const token = randomBytes(32).toString('base64url');
    const session = persistence.deviceSessionDao.createSession({
      id: randomUUID(),
      tokenHash: hashToken(token),
      createdAt: timestamp,
      expiresAt: timestamp + getTtlMs(),
      lastActivityAt: timestamp,
      clientAddress: normalizeText(clientAddress, 128),
      userAgent: normalizeText(userAgent, 512),
      deviceName: normalizeText(deviceName, 80),
    });

    return {token, session};
  }

  function authenticate(token) {
    if (typeof token !== 'string' || !token) {
      return null;
    }
    const session = services.getPersistence().deviceSessionDao.findSessionByTokenHash(hashToken(token));
    const timestamp = now();
    if (!session || session.revokedAt !== null || session.expiresAt <= timestamp) {
      return null;
    }
    services.getPersistence().deviceSessionDao.touchSession(session.id, timestamp);
    const adminUntil = getElevation(session.id);
    return {
      ...session,
      lastActivityAt: timestamp,
      role: adminUntil ? 'admin' : 'controller',
      adminUntil: adminUntil || null,
    };
  }

  function elevateSession(id, durationMs) {
    const sessionId = String(id || '');
    if (!sessionId || !services.getPersistence().deviceSessionDao.findSessionById(sessionId)) {
      return null;
    }
    const adminUntil = now() + Math.max(60_000, Number(durationMs) || 0);
    adminElevations.set(sessionId, adminUntil);
    return adminUntil;
  }

  function revokeElevation(id) {
    return adminElevations.delete(String(id || ''));
  }

  function listSessions() {
    const timestamp = now();
    return services.getPersistence().deviceSessionDao.listSessions().map((session) => ({
      ...session,
      role: getElevation(session.id) ? 'admin' : 'controller',
      state: session.revokedAt !== null
        ? 'revoked'
        : session.expiresAt <= timestamp ? 'expired' : 'active',
    }));
  }

  function listHistory() {
    return services.getPersistence().deviceSessionDao.listEvents();
  }

  function revokeSession(id) {
    adminElevations.delete(String(id || ''));
    return services.getPersistence().deviceSessionDao.revokeSession(String(id || ''), now()) > 0;
  }

  function revokeAllSessions(options) {
    return services.getPersistence().deviceSessionDao.revokeAllSessions(now(), options);
  }

  function cleanupExpired() {
    return services.getPersistence().deviceSessionDao.deleteExpiredSessions(now());
  }

  return {
    createSession,
    authenticate,
    elevateSession,
    revokeElevation,
    listSessions,
    listHistory,
    revokeSession,
    revokeAllSessions,
    cleanupExpired,
  };
}
