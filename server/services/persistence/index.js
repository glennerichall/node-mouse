import {createConfigDao} from './config.dao.js';
import {createEntryTokenDao} from './entry-token.dao.js';
import {createDatabaseProvider} from './sqlite.js';

export function createPersistence(services) {
    const getDatabase = createDatabaseProvider({
        getDatabasePath: () => services.getSystemConfig().persistence.dbPath,
    });

    return {
        getDatabase,
        configDao: createConfigDao({
            getDatabase,
            getStatePubSub: () => services.getStatePubSub(),
        }),
        entryTokenDao: createEntryTokenDao({getDatabase}),
    };
}
