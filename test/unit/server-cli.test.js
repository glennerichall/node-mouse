import {jest} from '@jest/globals';
import {executeCliCommand} from '../../server/cli/executeCliCommand.js';

describe('server cli', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-02T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('executes the QR command through admin actions', async () => {
    const openQrBrowserServer = jest.fn(async () => ({
      ok: true,
      message: 'Page QR ouverte sur le serveur.',
    }));

    const result = await executeCliCommand({
      getRemotes: () => ({
        adminActions: {
          openQrBrowserServer,
        },
      }),
    }, {name: 'open-qr', args: {}});

    expect(openQrBrowserServer).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      ok: true,
      message: 'Page QR ouverte sur le serveur.',
    });
  });

  it('returns help text for help command', async () => {
    const result = await executeCliCommand({
      getRemotes: () => ({
        adminActions: {},
      }),
    }, {name: 'help', args: {}});

    expect(result.ok).toBe(true);
    expect(result.message).toContain('remote-mouse --help');
  });

  it('returns the effective persisted config for config command', async () => {
    const config = {
      preview: {
        enabled: true,
      },
    };

    const result = await executeCliCommand({
      getConfig: () => config,
      getRemotes: () => ({
        adminActions: {},
      }),
    }, {name: 'config', args: {}});

    expect(result).toEqual({
      ok: true,
      message: 'Configuration persistée effective.',
      data: config,
    });
  });

  it('returns one persisted config value for config get', async () => {
    const result = await executeCliCommand({
      getConfigService: () => ({
        getConfig: () => 12,
      }),
      getRemotes: () => ({
        adminActions: {},
      }),
    }, {name: 'config', args: {action: 'get', path: 'preview.fps', value: ''}});

    expect(result).toEqual({
      ok: true,
      message: 'Configuration preview.fps.',
      data: {
        path: 'preview.fps',
        value: 12,
      },
    });
  });

  it('updates one persisted config value for config set through config service', async () => {
    const setConfig = jest.fn();
    const getConfig = jest.fn(() => 12);

    const result = await executeCliCommand({
      getConfigService: () => ({
        setConfig,
        getConfig,
      }),
      getRemotes: () => ({
        adminActions: {},
      }),
    }, {name: 'config', args: {action: 'set', path: 'preview.fps', value: '12'}});

    expect(setConfig).toHaveBeenCalledWith('preview.fps', 12);
    expect(result).toEqual({
      ok: true,
      message: 'Configuration preview.fps mise a jour.',
      data: {
        path: 'preview.fps',
        value: 12,
      },
    });
  });

  it('returns the system config for sys-config command', async () => {
    const systemConfig = {
      port: 3000,
      protocol: 'http',
    };

    const result = await executeCliCommand({
      getSystemConfig: () => systemConfig,
      getRemotes: () => ({
        adminActions: {},
      }),
    }, {name: 'sys-config', args: {}});

    expect(result).toEqual({
      ok: true,
      message: 'Configuration système.',
      data: systemConfig,
    });
  });

  it('returns the system capabilities for info command', async () => {
    const getInfo = jest.fn(async () => ({
      platform: 'linux',
      hostname: 'host-1',
      browsers: [{id: 'firefox', name: 'Firefox'}],
      vlc: {available: true},
      screen: {width: 1920, height: 1080},
      network: {
        lanIp: '192.168.1.10',
        publicBaseUrl: 'http://192.168.1.10:3000',
        localBaseUrl: 'http://127.0.0.1:3000',
        interfaces: [],
      },
    }));
    const info = {
      platform: 'linux',
      hostname: 'host-1',
      browsers: [{id: 'firefox', name: 'Firefox'}],
      vlc: {available: true},
      screen: {width: 1920, height: 1080},
      network: {
        lanIp: '192.168.1.10',
        publicBaseUrl: 'http://192.168.1.10:3000',
        localBaseUrl: 'http://127.0.0.1:3000',
        interfaces: [],
      },
    };

    const result = await executeCliCommand({
      getSystem: () => ({
        getInfo,
      }),
      getRemotes: () => ({
        adminActions: {},
      }),
    }, {name: 'info', args: {}});

    expect(getInfo).toHaveBeenCalledWith();
    expect(result).toEqual({
      ok: true,
      message: 'Capacites du serveur.',
      data: info,
    });
  });

  it('executes service actions through the grouped service command handler', async () => {
    const restart = jest.fn(async () => ({
      ok: true,
      message: 'Service redemarre.',
    }));

    const result = await executeCliCommand({
      getApplicationDaemonService: () => ({
        restart,
      }),
      getRemotes: () => ({
        adminActions: {},
      }),
    }, {name: 'service', args: {action: 'restart'}});

    expect(restart).toHaveBeenCalledWith({
      cause: 'user',
      source: 'cli',
    });
    expect(result).toEqual({
      ok: true,
      message: 'Service redemarre.',
    });
  });

  it('returns the token list for tokens command', async () => {
    const result = await executeCliCommand({
      getPersistence: () => ({
        entryTokenDao: {
          loadEntryTokens: () => new Map([
            ['alpha', 1000],
            ['beta', 2000],
          ]),
        },
      }),
      getRemotes: () => ({
        adminActions: {},
      }),
    }, {name: 'tokens', args: {}});

    expect(result).toEqual({
      ok: true,
      message: 'Tokens chargés.',
      data: [
        {
          token: 'alpha',
          createdAt: 1000,
        },
        {
          token: 'beta',
          createdAt: 2000,
        },
      ],
    });
  });

  it('detects a samsung tv without persisting host/mac', async () => {
    const result = await executeCliCommand({
      getConfig: () => ({
        samsungTv: {
          alwaysAutoResolve: true,
          host: '',
          mac: '',
          discoveryTimeoutMs: 3000,
        },
      }),
      getRemotes: () => ({
        adminActions: {},
        samsung: {
          discoverDevices: async () => ([
            {
              name: 'Salon',
              model: 'QN90',
              ip: '192.168.1.20',
              mac: 'AA:BB:CC:DD:EE:02',
            },
          ]),
        },
      }),
    }, {name: 'samsung-detect', args: {}});

    expect(result).toEqual({
      ok: true,
      message: 'TV Samsung detectee.',
      data: {
        name: 'Salon',
        model: 'QN90',
        host: '192.168.1.20',
        mac: 'AA:BB:CC:DD:EE:02',
      },
    });
  });

  it('returns a clear error when several samsung tvs are detected', async () => {
    const result = await executeCliCommand({
      getConfig: () => ({
        samsungTv: {
          alwaysAutoResolve: true,
          host: '',
          mac: '',
          discoveryTimeoutMs: 3000,
        },
      }),
      getRemotes: () => ({
        adminActions: {},
        samsung: {
          discoverDevices: async () => ([
            {
              name: 'Salon',
              model: 'QN90',
              ip: '192.168.1.20',
              mac: 'AA:BB:CC:DD:EE:02',
            },
            {
              name: 'Bureau',
              model: 'Frame',
              ip: '192.168.1.21',
              mac: 'AA:BB:CC:DD:EE:03',
            },
          ]),
        },
      }),
    }, {name: 'samsung-detect', args: {}});

    expect(result).toEqual({
      ok: false,
      message: 'Plusieurs TV Samsung detectees. Configurez samsungTv.host ou samsungTv.mac, ou desactivez alwaysAutoResolve.',
      data: [
        {
          name: 'Salon',
          model: 'QN90',
          host: '192.168.1.20',
          mac: 'AA:BB:CC:DD:EE:02',
        },
        {
          name: 'Bureau',
          model: 'Frame',
          host: '192.168.1.21',
          mac: 'AA:BB:CC:DD:EE:03',
        },
      ],
    });
  });

  it('returns the task manager snapshot for tasks command', async () => {
    const result = await executeCliCommand({
      getTaskManager: () => ({
        getTasksSnapshot: () => ([
          {
            id: 'task-1',
            name: 'update-check',
            dueAt: '2026-04-02T12:01:00.000Z',
            delayMs: 60_000,
            running: false,
          },
          {
            id: 'task-2',
            name: 'token-rotation',
            dueAt: null,
            delayMs: 30_000,
            running: true,
          },
        ]),
      }),
      getRemotes: () => ({
        adminActions: {},
      }),
    }, {name: 'tasks', args: {}});

    expect(result).toEqual({
      ok: true,
      message: 'Etat du task manager.',
      data: {
        now: '2026-04-02T12:00:00.000Z',
        tasks: [
          {
            id: 'task-1',
            name: 'update-check',
            dueAt: '2026-04-02T12:01:00.000Z',
            dueInMs: 60_000,
            delayMs: 60_000,
            running: false,
          },
          {
            id: 'task-2',
            name: 'token-rotation',
            dueAt: null,
            dueInMs: null,
            delayMs: 30_000,
            running: true,
          },
        ],
      },
    });
  });
});
