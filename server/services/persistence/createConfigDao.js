const CONFIG_TABLE = 'config_entries';

export function createConfigDao({getDatabase} = {}) {
    let bootstrapped = false;

    function bootstrapConfigDatabase() {
        const db = getDatabase();
        db.exec(`
            CREATE TABLE IF NOT EXISTS ${CONFIG_TABLE}
            (
                key TEXT PRIMARY KEY,
                value_json TEXT NOT NULL
            )
        `);
    }

    function saveOne(key, value) {
        const db = getDatabase();
        if (!bootstrapped) {
            bootstrapConfigDatabase();
            bootstrapped = true;
        }

        const normalizedKey = String(key || '').trim();
        if (!normalizedKey) {
            return 0;
        }

        const statement = db.prepare(`
            INSERT INTO ${CONFIG_TABLE} (key, value_json)
            VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json
        `);
        return statement.run(normalizedKey, JSON.stringify(value)).changes;
    }

    function getOne(key) {
        const db = getDatabase();
        if (!bootstrapped) {
            bootstrapConfigDatabase();
            bootstrapped = true;
        }

        const normalizedKey = String(key || '').trim();
        if (!normalizedKey) {
            return undefined;
        }

        const row = db.prepare(`SELECT value_json FROM ${CONFIG_TABLE} WHERE key = ?`).get(normalizedKey);
        if (!row) {
            return undefined;
        }

        try {
            return JSON.parse(row.value_json);
        } catch (_error) {
            return row.value_json;
        }
    }

    function getAll() {
        const db = getDatabase();
        if (!bootstrapped) {
            bootstrapConfigDatabase();
            bootstrapped = true;
        }

        const rows = db.prepare(`SELECT key, value_json FROM ${CONFIG_TABLE}`).all();
        return rows.map((row) => {
            let value;
            try {
                value = JSON.parse(row.value_json);
            } catch (_error) {
                value = row.value_json;
            }

            return {
                key: row.key,
                value,
            };
        });
    }

    function deleteOne(key) {
        const db = getDatabase();
        if (!bootstrapped) {
            bootstrapConfigDatabase();
            bootstrapped = true;
        }

        const normalizedKey = String(key || '').trim();
        if (!normalizedKey) {
            return 0;
        }

        return db.prepare(`DELETE FROM ${CONFIG_TABLE} WHERE key = ?`).run(normalizedKey).changes;
    }

    return {
        bootstrapConfigDatabase,
        saveOne,
        getOne,
        getAll,
        deleteOne,
    };
}
