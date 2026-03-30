import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import {
    getEnvConfig
} from "../init/config/index.js";

let database = null;

export function getDatabase() {
    const configuredDatabasePath = getEnvConfig().persistence.dbPath;
    if (!configuredDatabasePath) {
        throw new Error('Persistence database path is not configured');
    }

    if (database) {
        return database;
    }

    fs.mkdirSync(path.dirname(configuredDatabasePath), {recursive: true});
    database = new Database(configuredDatabasePath);
    database.pragma('journal_mode = WAL');
    return database;
}
