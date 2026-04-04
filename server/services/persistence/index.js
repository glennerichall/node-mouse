import {createConfigDao} from './createConfigDao.js';
import {createEntryTokenDao} from './createEntryTokenDao.js';
import {createDatabaseProvider} from './createDatabaseProvider.js';

export function createPersistence(services) {
    const getDatabase = createDatabaseProvider({
        getDatabasePath: () => services.getSystemConfig().persistence.dbPath,
    });

    return {
        getDatabase,
        configDao: createConfigDao({
            getDatabase,
            getPubSub: () => services.getPubSub(),
        }),
        entryTokenDao: createEntryTokenDao({getDatabase}),
    };
}
