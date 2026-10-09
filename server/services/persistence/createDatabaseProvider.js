import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

export function createDatabaseProvider({getDatabasePath}) {
    let database = null;

    function getDatabase() {
        const configuredDatabasePath = String(getDatabasePath?.() || '').trim();
        if (!configuredDatabasePath) {
            throw new Error('Persistence database path is not configured');
        }

        if (database) {
            return database;
        }

        fs.mkdirSync(path.dirname(configuredDatabasePath), {recursive: true});
        database = new Database(configuredDatabasePath);
        database.pragma('journal_mode = WAL');
        const integrity = database.pragma('quick_check');
        if (integrity.some((result) => Object.values(result)[0] !== 'ok')) {
            database.close();
            database = null;
            throw new Error(`Persistence database integrity check failed: ${configuredDatabasePath}`);
        }
        return database;
    }

    getDatabase.close = () => {
        if (!database) {
            return;
        }
        database.close();
        database = null;
    };

    return getDatabase;
}
