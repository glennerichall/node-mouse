const DEVICE_SESSION_TABLE = 'device_sessions';

function mapSession(row) {
  if (!row) {
    return null;
  }

  return {
    id: String(row.session_id),
    createdAt: Number(row.created_at),
    expiresAt: Number(row.expires_at),
    lastActivityAt: Number(row.last_activity_at),
    revokedAt: row.revoked_at === null ? null : Number(row.revoked_at),
    clientAddress: String(row.client_address || ''),
    userAgent: String(row.user_agent || ''),
    deviceName: String(row.device_name || ''),
  };
}

export function createDeviceSessionDao({getDatabase}) {
  let bootstrapped = false;

  function bootstrap() {
    if (bootstrapped) {
      return;
    }

    const db = getDatabase();
    db.exec(`
      CREATE TABLE IF NOT EXISTS ${DEVICE_SESSION_TABLE} (
        session_id TEXT PRIMARY KEY,
        token_hash TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        last_activity_at INTEGER NOT NULL,
        revoked_at INTEGER,
        client_address TEXT NOT NULL DEFAULT '',
        user_agent TEXT NOT NULL DEFAULT '',
        device_name TEXT NOT NULL DEFAULT ''
      );
      CREATE INDEX IF NOT EXISTS idx_device_sessions_expires_at
        ON ${DEVICE_SESSION_TABLE}(expires_at);
    `);
    bootstrapped = true;
  }

  function createSession(session) {
    bootstrap();
    getDatabase().prepare(`
      INSERT INTO ${DEVICE_SESSION_TABLE} (
        session_id, token_hash, created_at, expires_at, last_activity_at,
        client_address, user_agent, device_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      session.id,
      session.tokenHash,
      session.createdAt,
      session.expiresAt,
      session.lastActivityAt,
      session.clientAddress,
      session.userAgent,
      session.deviceName,
    );
    return findSessionById(session.id);
  }

  function findSessionByTokenHash(tokenHash) {
    bootstrap();
    const row = getDatabase().prepare(`
      SELECT * FROM ${DEVICE_SESSION_TABLE} WHERE token_hash = ? LIMIT 1
    `).get(tokenHash);
    return mapSession(row);
  }

  function findSessionById(id) {
    bootstrap();
    const row = getDatabase().prepare(`
      SELECT * FROM ${DEVICE_SESSION_TABLE} WHERE session_id = ? LIMIT 1
    `).get(id);
    return mapSession(row);
  }

  function listSessions() {
    bootstrap();
    return getDatabase().prepare(`
      SELECT * FROM ${DEVICE_SESSION_TABLE} ORDER BY created_at DESC
    `).all().map(mapSession);
  }

  function touchSession(id, lastActivityAt) {
    bootstrap();
    return getDatabase().prepare(`
      UPDATE ${DEVICE_SESSION_TABLE}
      SET last_activity_at = ?
      WHERE session_id = ? AND revoked_at IS NULL
    `).run(lastActivityAt, id).changes;
  }

  function revokeSession(id, revokedAt) {
    bootstrap();
    return getDatabase().prepare(`
      UPDATE ${DEVICE_SESSION_TABLE}
      SET revoked_at = ?
      WHERE session_id = ? AND revoked_at IS NULL
    `).run(revokedAt, id).changes;
  }

  function revokeAllSessions(revokedAt, {exceptId = ''} = {}) {
    bootstrap();
    if (exceptId) {
      return getDatabase().prepare(`
        UPDATE ${DEVICE_SESSION_TABLE}
        SET revoked_at = ?
        WHERE revoked_at IS NULL AND session_id != ?
      `).run(revokedAt, exceptId).changes;
    }
    return getDatabase().prepare(`
      UPDATE ${DEVICE_SESSION_TABLE}
      SET revoked_at = ?
      WHERE revoked_at IS NULL
    `).run(revokedAt).changes;
  }

  function deleteExpiredSessions(now) {
    bootstrap();
    return getDatabase().prepare(`
      DELETE FROM ${DEVICE_SESSION_TABLE}
      WHERE expires_at <= ? OR revoked_at IS NOT NULL
    `).run(now).changes;
  }

  return {
    createSession,
    findSessionByTokenHash,
    findSessionById,
    listSessions,
    touchSession,
    revokeSession,
    revokeAllSessions,
    deleteExpiredSessions,
  };
}
