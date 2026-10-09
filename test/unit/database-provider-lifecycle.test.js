import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createDatabaseProvider} from '../../server/services/persistence/createDatabaseProvider.js';

describe('database provider lifecycle', () => {
  let tempDir;
  let getDatabase;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'remote-mouse-database-lifecycle-'));
    getDatabase = createDatabaseProvider({
      getDatabasePath: () => path.join(tempDir, 'state.sqlite'),
    });
  });

  afterEach(() => {
    getDatabase.close();
    fs.rmSync(tempDir, {recursive: true, force: true});
  });

  it('closes and safely reopens a WAL database while preserving committed data', () => {
    getDatabase().exec('CREATE TABLE lifecycle (value TEXT NOT NULL)');
    getDatabase().prepare('INSERT INTO lifecycle (value) VALUES (?)').run('persisted');

    getDatabase.close();
    expect(getDatabase().prepare('SELECT value FROM lifecycle').get()).toEqual({value: 'persisted'});
  });
});
