import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {createDatabaseProvider} from '../../server/services/persistence/createDatabaseProvider.js';
import {createUpdateEventLogDao} from '../../server/services/persistence/createUpdateEventLogDao.js';

describe('update event log dao', () => {
  let tempDir;
  let getDatabase;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'remote-mouse-update-event-dao-'));
    getDatabase = createDatabaseProvider({
      getDatabasePath: () => path.join(tempDir, 'events.sqlite'),
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

  it('persists and lists recent update-manager events', () => {
    const dao = createUpdateEventLogDao({getDatabase});

    dao.createEvent({
      at: '2026-04-25T17:00:00.000Z',
      type: 'update.available',
      payload: {
        enabled: true,
        lastKey: 'npm:6.5.0',
        lastInstallCommand: '',
        lastResult: {
          checked: true,
          hasUpdate: true,
        },
      },
    });

    expect(dao.listRecentEvents(5)).toEqual([
      {
        id: 1,
        eventAt: Date.parse('2026-04-25T17:00:00.000Z'),
        type: 'update.available',
        enabled: true,
        lastKey: 'npm:6.5.0',
        lastInstallCommand: '',
        lastResult: {
          checked: true,
          hasUpdate: true,
        },
      },
    ]);
  });
});
