import {jest} from '@jest/globals';
import {getServerInfoData, getServerInfoPage} from '../../server/connection/api/server-info.handlers.js';

function response() {
  return {json: jest.fn(), sendFile: jest.fn()};
}

function services() {
  return {
    getServer: () => ({
      serverStartedAt: Date.parse('2026-01-01T00:00:00.000Z'),
      io: {of: () => ({sockets: new Map()})},
    }),
    getConfig: () => ({preview: {enabled: true}}),
    getSystemConfig: () => ({entryPath: {graceMin: 120, rotateMin: 60}}),
    getTaskManager: () => ({getTasksSnapshot: () => []}),
    getPersistence: () => ({
      entryTokenDao: {loadEntryTokens: () => new Map()},
      restartLogDao: {listRecentRestartRecords: () => []},
      updateEventLogDao: {listRecentEvents: () => []},
    }),
    getTokenManager: () => ({getToken: () => ''}),
    getApplicationDaemonService: () => ({getInfo: jest.fn().mockResolvedValue({ok: true})}),
    getSystem: () => ({getInfo: jest.fn().mockResolvedValue({platform: 'linux'})}),
  };
}

describe('server info handlers', () => {
  it('serves the server info page', () => {
    const res = response();
    getServerInfoPage({}, res);
    expect(res.sendFile).toHaveBeenCalled();
  });

  it('builds the server data response from services', async () => {
    const res = response();
    await getServerInfoData({services: services()}, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      clientsConnected: 0,
      clients: [],
      tasks: [],
      tokens: [],
      config: {preview: {enabled: true}},
      sysConfig: {entryPath: {graceMin: 120, rotateMin: 60}},
    }));
  });
});
