import {getDatabase} from './sqlite.js';

const ENTRY_TOKEN_TABLE = 'entry_tokens';

let bootstrapped = false;

function bootstrapEntryTokenTable() {
    if (bootstrapped) {
        return;
    }

    const db = getDatabase();
    db.exec(`
        CREATE TABLE IF NOT EXISTS ${ENTRY_TOKEN_TABLE} (
            token TEXT PRIMARY KEY,
            created_at INTEGER NOT NULL
        )
    `);
    bootstrapped = true;
}

export function loadEntryTokens() {
    bootstrapEntryTokenTable();

    const db = getDatabase();
    const rows = db.prepare(`
        SELECT token, created_at
        FROM ${ENTRY_TOKEN_TABLE}
        ORDER BY created_at ASC
    `).all();

    return new Map(rows.map((row) => [row.token, row.created_at]));
}

export function deleteExpiredEntryTokens({olderThan, keepToken = ''} = {}) {
    bootstrapEntryTokenTable();

    const db = getDatabase();
    const safeOlderThan = Math.floor(Number(olderThan));
    if (!Number.isFinite(safeOlderThan)) {
        return 0;
    }

    if (keepToken) {
        const result = db.prepare(`
            DELETE FROM ${ENTRY_TOKEN_TABLE}
            WHERE created_at < ?
              AND token != ?
        `).run(safeOlderThan, keepToken);
        return result.changes;
    }

    const result = db.prepare(`
        DELETE FROM ${ENTRY_TOKEN_TABLE}
        WHERE created_at < ?
    `).run(safeOlderThan);
    return result.changes;
}

export function hasEntryToken(token) {
    bootstrapEntryTokenTable();

    const db = getDatabase();
    const row = db.prepare(`
        SELECT 1
        FROM ${ENTRY_TOKEN_TABLE}
        WHERE token = ?
        LIMIT 1
    `).get(token);

    return Boolean(row);
}

export function createEntryToken(token, createdAt = Date.now()) {
    bootstrapEntryTokenTable();

    const db = getDatabase();
    db.prepare(`
        INSERT INTO ${ENTRY_TOKEN_TABLE} (token, created_at)
        VALUES (?, ?)
        ON CONFLICT(token) DO UPDATE SET created_at = excluded.created_at
    `).run(token, Math.floor(createdAt));
}
