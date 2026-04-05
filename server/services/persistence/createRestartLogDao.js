const RESTART_LOG_TABLE = 'application_restart_log';

const DEFAULT_RESTART_CAUSE = 'user';
const DEFAULT_EVENT_TYPE = 'restart';

function normalizeRestartCause(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'user' || normalized === 'reboot' || normalized === 'unexpected') {
    return normalized;
  }
  return DEFAULT_RESTART_CAUSE;
}

function normalizeEventType(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'start' || normalized === 'stop' || normalized === 'restart') {
    return normalized;
  }
  return DEFAULT_EVENT_TYPE;
}

function normalizeRecord(row) {
  if (!row) {
    return null;
  }

  let details = {};
  try {
    details = JSON.parse(String(row.details_json || '{}'));
  } catch (_error) {
    details = {};
  }

  return {
    id: Number(row.id),
    requestedAt: Number(row.requested_at),
    detectedAt: Number(row.detected_at || 0) || null,
    eventType: normalizeEventType(row.event_type),
    cause: normalizeRestartCause(row.restart_cause),
    source: String(row.source || ''),
    status: String(row.status || ''),
    details,
  };
}

export function createRestartLogDao({getDatabase}) {
  let bootstrapped = false;

  function bootstrapRestartLogTable() {
    if (bootstrapped) {
      return;
    }

    const db = getDatabase();
    db.exec(`
      CREATE TABLE IF NOT EXISTS ${RESTART_LOG_TABLE} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        requested_at INTEGER NOT NULL,
        detected_at INTEGER,
        event_type TEXT NOT NULL DEFAULT '${DEFAULT_EVENT_TYPE}',
        restart_cause TEXT NOT NULL DEFAULT '${DEFAULT_RESTART_CAUSE}',
        source TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'requested',
        details_json TEXT NOT NULL DEFAULT '{}'
      )
    `);

    const columns = db.prepare(`PRAGMA table_info(${RESTART_LOG_TABLE})`).all();
    const hasRestartCause = columns.some((column) => String(column?.name || '') === 'restart_cause');
    const hasEventType = columns.some((column) => String(column?.name || '') === 'event_type');
    if (!hasEventType) {
      db.exec(`
        ALTER TABLE ${RESTART_LOG_TABLE}
        ADD COLUMN event_type TEXT NOT NULL DEFAULT '${DEFAULT_EVENT_TYPE}'
      `);
    }

    if (!hasRestartCause) {
      db.exec(`
        ALTER TABLE ${RESTART_LOG_TABLE}
        ADD COLUMN restart_cause TEXT NOT NULL DEFAULT '${DEFAULT_RESTART_CAUSE}'
      `);
    }

    bootstrapped = true;
  }

  function createRestartRequest({
    requestedAt = Date.now(),
    detectedAt = null,
    cause = DEFAULT_RESTART_CAUSE,
    source = 'unknown',
    status = 'requested',
    details = {},
  } = {}) {
    bootstrapRestartLogTable();
    const db = getDatabase();
    const result = db.prepare(`
      INSERT INTO ${RESTART_LOG_TABLE} (requested_at, detected_at, event_type, restart_cause, source, status, details_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      Math.floor(Number(requestedAt) || Date.now()),
      detectedAt == null ? null : Math.floor(Number(detectedAt) || Date.now()),
      DEFAULT_EVENT_TYPE,
      normalizeRestartCause(cause),
      String(source || 'unknown'),
      String(status || 'requested'),
      JSON.stringify(details || {}),
    );
    return Number(result.lastInsertRowid);
  }

  function createLifecycleEvent({
    eventAt = Date.now(),
    eventType,
    cause = DEFAULT_RESTART_CAUSE,
    source = 'unknown',
    status = 'completed',
    details = {},
  } = {}) {
    bootstrapRestartLogTable();
    const db = getDatabase();
    const timestamp = Math.floor(Number(eventAt) || Date.now());
    const result = db.prepare(`
      INSERT INTO ${RESTART_LOG_TABLE} (requested_at, detected_at, event_type, restart_cause, source, status, details_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      timestamp,
      timestamp,
      normalizeEventType(eventType),
      normalizeRestartCause(cause),
      String(source || 'unknown'),
      String(status || 'completed'),
      JSON.stringify(details || {}),
    );
    return Number(result.lastInsertRowid);
  }

  function updateRestartStatus(id, {
    detectedAt,
    status,
    details,
  } = {}) {
    bootstrapRestartLogTable();
    if (!Number.isFinite(Number(id))) {
      return false;
    }

    const db = getDatabase();
    const current = normalizeRecord(db.prepare(`
      SELECT *
      FROM ${RESTART_LOG_TABLE}
      WHERE id = ?
      LIMIT 1
    `).get(Number(id)));

    if (!current) {
      return false;
    }

    const nextDetails = details === undefined
      ? current.details
      : {...current.details, ...(details || {})};

    db.prepare(`
      UPDATE ${RESTART_LOG_TABLE}
      SET detected_at = ?,
          status = ?,
          details_json = ?
      WHERE id = ?
    `).run(
      detectedAt == null ? current.detectedAt : Math.floor(Number(detectedAt)),
      String(status || current.status),
      JSON.stringify(nextDetails || {}),
      Number(id),
    );

    return true;
  }

  function listRecentRestartRecords(limit = 20) {
    bootstrapRestartLogTable();
    const db = getDatabase();
    return db.prepare(`
      SELECT *
      FROM ${RESTART_LOG_TABLE}
      ORDER BY requested_at DESC, id DESC
      LIMIT ?
    `).all(Math.max(1, Number(limit) || 20)).map(normalizeRecord);
  }

  function getLastLifecycleEvent() {
    bootstrapRestartLogTable();
    const db = getDatabase();
    return normalizeRecord(db.prepare(`
      SELECT *
      FROM ${RESTART_LOG_TABLE}
      ORDER BY requested_at DESC, id DESC
      LIMIT 1
    `).get());
  }

  return {
    createRestartRequest,
    createLifecycleEvent,
    updateRestartStatus,
    getLastLifecycleEvent,
    listRecentRestartRecords,
  };
}
