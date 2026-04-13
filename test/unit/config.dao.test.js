import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {createConfigDao} from '../../server/services/persistence/createConfigDao.js';
import {createDatabaseProvider} from '../../server/services/persistence/createDatabaseProvider.js';

describe('config dao', () => {
  let tempDir;
  let getDatabase;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'remote-mouse-config-dao-'));
    getDatabase = createDatabaseProvider({
      getDatabasePath: () => path.join(tempDir, 'config.sqlite'),
    });
  });

  afterEach(() => {
    try {
      getDatabase?.().close();
    } catch (_error) {
      // Best effort.
    }

    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('persists and loads individual entries', () => {
    const dao = createConfigDao({getDatabase});

    dao.saveOne('preview.fps', 12);
    dao.saveOne('notifications.clientConnected.client', false);

    expect(dao.getOne('preview.fps')).toBe(12);
    expect(dao.getOne('notifications.clientConnected.client')).toBe(false);
    expect(dao.getAll()).toEqual(expect.arrayContaining([
      {key: 'preview.fps', value: 12},
      {key: 'notifications.clientConnected.client', value: false},
    ]));
  });

  it('deletes one persisted entry', () => {
    const dao = createConfigDao({getDatabase});

    dao.saveOne('preview.fps', 12);

    expect(dao.deleteOne('preview.fps')).toBe(1);
    expect(dao.getOne('preview.fps')).toBeUndefined();
    expect(dao.getAll()).toEqual([]);
  });
});
