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

export function saveEntryTokens(tokens) {
    bootstrapEntryTokenTable();

    const db = getDatabase();
    const replaceTokens = db.transaction((entries) => {
        db.prepare(`DELETE FROM ${ENTRY_TOKEN_TABLE}`).run();
        const insert = db.prepare(`
            INSERT INTO ${ENTRY_TOKEN_TABLE} (token, created_at)
            VALUES (?, ?)
        `);

        for (const [token, createdAt] of entries) {
            insert.run(token, createdAt);
        }
    });

    replaceTokens(Array.from(tokens.entries()));
}
