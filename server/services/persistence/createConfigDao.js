import {
    setNestedValue,
    toFlatMap
} from "../../../utils/shared/objet.utils.js";

const CONFIG_TABLE = 'config_entries';

export function createConfigDao({getDatabase, getStatePubSub} = {}) {
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

    function emitStateChange(changeType, changedKeys = []) {
        if (typeof getStatePubSub !== 'function') {
            return;
        }

        getStatePubSub().publish('config', {
            changeType,
            changedKeys: Array.from(new Set(changedKeys)),
            storedConfig: getStoredConfig(),
        }, {
            type: `config.${changeType}`,
        });
    }

    function saveStoredConfig(value, managedPaths = []) {
        const db = getDatabase();
        if (!bootstrapped) {
            bootstrapConfigDatabase();
            bootstrapped = true;
        }

        const flattened = toFlatMap(value);
        const allowedKeys = new Set(managedPaths);
        const insertStatement = db.prepare(`
            INSERT INTO ${CONFIG_TABLE} (key, value_json)
            VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json
        `);

        const persist = db.transaction(() => {
            for (const [key, entryValue] of flattened.entries()) {
                if (allowedKeys.size > 0 && !allowedKeys.has(key)) {
                    continue;
                }
                insertStatement.run(key, JSON.stringify(entryValue));
            }
        });

        persist();
        emitStateChange(
            'updated',
            Array.from(flattened.keys()).filter((key) => !allowedKeys.size || allowedKeys.has(key)),
        );
    }

    function getStoredConfig(managedPaths = []) {
        const db = getDatabase();
        if (!bootstrapped) {
            bootstrapConfigDatabase();
            bootstrapped = true;
        }
        const selectStatement = db.prepare(`SELECT key, value_json FROM ${CONFIG_TABLE}`);
        const rows = selectStatement.all();
        const allowedKeys = new Set(managedPaths);
        const config = {};

        for (const row of rows) {
            if (allowedKeys.size > 0 && !allowedKeys.has(row.key)) {
                continue;
            }

            let value;
            try {
                value = JSON.parse(row.value_json);
            } catch (_error) {
                value = row.value_json;
            }
            setNestedValue(config, row.key, value);
        }

        return config;
    }

    function deleteStoredConfig(paths = [], managedPaths = []) {
        const db = getDatabase();
        if (!bootstrapped) {
            bootstrapConfigDatabase();
            bootstrapped = true;
        }

        const allowedKeys = new Set(managedPaths);
        const filteredPaths = Array.from(new Set(paths))
            .filter((pathKey) => !allowedKeys.size || allowedKeys.has(pathKey));

        if (!filteredPaths.length) {
            return 0;
        }

        const remove = db.transaction(() => {
            const statement = db.prepare(`DELETE FROM ${CONFIG_TABLE} WHERE key = ?`);
            let changes = 0;

            for (const pathKey of filteredPaths) {
                changes += statement.run(pathKey).changes;
            }

            return changes;
        });

        const changes = remove();
        if (changes > 0) {
            emitStateChange('deleted', filteredPaths);
        }
        return changes;
    }

    return {
        bootstrapConfigDatabase,
        saveStoredConfig,
        getStoredConfig,
        deleteStoredConfig,
    };
}
