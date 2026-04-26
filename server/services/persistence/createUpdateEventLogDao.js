const UPDATE_EVENT_LOG_TABLE = 'update_manager_event_log';

function normalizeRecord(row) {
  if (!row) {
    return null;
  }

  let lastResult = null;
  try {
    lastResult = JSON.parse(String(row.last_result_json || 'null'));
  } catch (_error) {
    lastResult = null;
  }

  return {
    id: Number(row.id),
    eventAt: Number(row.event_at),
    type: String(row.event_type || ''),
    enabled: Boolean(row.enabled),
    lastKey: String(row.last_key || ''),
    lastInstallCommand: String(row.last_install_command || ''),
    lastResult,
  };
}

export function createUpdateEventLogDao({getDatabase}) {
  let bootstrapped = false;

  function bootstrapUpdateEventLogTable() {
    if (bootstrapped) {
      return;
    }

    const db = getDatabase();
    db.exec(`
      CREATE TABLE IF NOT EXISTS ${UPDATE_EVENT_LOG_TABLE} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_at INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 0,
        last_key TEXT NOT NULL DEFAULT '',
        last_install_command TEXT NOT NULL DEFAULT '',
        last_result_json TEXT NOT NULL DEFAULT 'null'
      )
    `);

    bootstrapped = true;
  }

  function createEvent(event = {}) {
    bootstrapUpdateEventLogTable();
    const db = getDatabase();
    const payload = event?.payload || {};
    const eventAtMs = Math.floor(new Date(event.at || Date.now()).getTime());

    const result = db.prepare(`
      INSERT INTO ${UPDATE_EVENT_LOG_TABLE} (
        event_at,
        event_type,
        enabled,
        last_key,
        last_install_command,
        last_result_json
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      Number.isFinite(eventAtMs) ? eventAtMs : Date.now(),
      String(event.type || 'event'),
      payload?.enabled ? 1 : 0,
      String(payload?.lastKey || ''),
      String(payload?.lastInstallCommand || ''),
      JSON.stringify(payload?.lastResult ?? null),
    );

    return Number(result.lastInsertRowid);
  }

  function listRecentEvents(limit = 20) {
    bootstrapUpdateEventLogTable();
    const db = getDatabase();
    return db.prepare(`
      SELECT *
      FROM ${UPDATE_EVENT_LOG_TABLE}
      ORDER BY event_at DESC, id DESC
      LIMIT ?
    `).all(Math.max(1, Number(limit) || 20)).map(normalizeRecord);
  }

  return {
    createEvent,
    listRecentEvents,
  };
}
