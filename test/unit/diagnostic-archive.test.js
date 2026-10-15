import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';
import {jest} from '@jest/globals';
import {
  createDiagnosticArchive,
  DIAGNOSTIC_ARCHIVE_RETENTION,
  redactDiagnosticData,
} from '../../server/application/diagnosticArchive.js';
import {executeDiagnosticCommand} from '../../server/term/srv/commands/diagnosticCommand.js';

describe('diagnostic archives', () => {
  let root;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'remote-mouse-diagnostic-'));
  });

  afterEach(async () => {
    await fs.rm(root, {recursive: true, force: true});
  });

  it('redacts sensitive values recursively', () => {
    expect(redactDiagnosticData({sessionSecret: 'secret', nested: {token: 'token'}, safe: 'ok'}))
      .toEqual({sessionSecret: '[redacted]', nested: {token: '[redacted]'}, safe: 'ok'});
  });

  it('writes a compressed archive and retains only the newest five', async () => {
    for (let index = 0; index < DIAGNOSTIC_ARCHIVE_RETENTION + 2; index += 1) {
      await createDiagnosticArchive({
        archiveDir: root,
        now: new Date(Date.UTC(2026, 9, 15, 12, 0, index)),
        snapshot: {index, session: {cookieSecret: 'must-not-leak'}},
      });
    }

    const names = (await fs.readdir(root)).sort();
    expect(names).toHaveLength(DIAGNOSTIC_ARCHIVE_RETENTION);
    const content = JSON.parse(gunzipSync(await fs.readFile(path.join(root, names.at(-1)))).toString());
    expect(content.session.cookieSecret).toBe('[redacted]');
    expect(content.index).toBe(DIAGNOSTIC_ARCHIVE_RETENTION + 1);
  });

  it('builds a diagnostic snapshot without loading persisted entry tokens', async () => {
    const createArchive = jest.fn(async ({snapshot}) => ({
      path: '/config/diagnostics/archive.json.gz',
      bytes: 123,
      retained: [],
      snapshot,
    }));
    const persistence = {
      restartLogDao: {listRecentRestartRecords: () => []},
      updateEventLogDao: {listRecentEvents: () => []},
      entryTokenDao: {loadEntryTokens: jest.fn()},
    };
    const services = {
      getPersistence: () => persistence,
      getServer: () => ({serverStartedAt: Date.now(), io: {of: () => ({sockets: new Map([['id', {}]])})}}),
      getSystemConfig: () => ({session: {cookieSecret: 'secret'}}),
      getConfig: () => ({input: {mouseSpeed: 1.3}}),
      getSystem: () => ({getInfo: async () => ({platform: 'test'})}),
      getApplicationDaemonService: () => ({getInfo: async () => ({active: true})}),
      getTaskManager: () => ({getTasksSnapshot: () => []}),
    };

    const result = await executeDiagnosticCommand(services, {createArchive});

    expect(result).toMatchObject({ok: true, data: {bytes: 123, retained: 0}});
    expect(createArchive).toHaveBeenCalledWith(expect.objectContaining({
      snapshot: expect.objectContaining({version: expect.any(String), logs: expect.any(Array)}),
    }));
    expect(persistence.entryTokenDao.loadEntryTokens).not.toHaveBeenCalled();
  });
});
