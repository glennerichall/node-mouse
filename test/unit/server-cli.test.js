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
    }, 'open-qr');

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
    }, 'help');

    expect(result.ok).toBe(true);
    expect(result.message).toContain('open-qr');
    expect(result.message).toContain('tokens');
    expect(result.message).toContain('tasks');
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
    }, 'config');

    expect(result).toEqual({
      ok: true,
      message: 'Configuration persistée effective.',
      data: config,
    });
  });

  it('returns one persisted config value for config get', async () => {
    const result = await executeCliCommand({
      getConfig: () => ({
        logging: {
          level: 'debug',
        },
      }),
      getRemotes: () => ({
        adminActions: {},
      }),
    }, 'config get logging.level');

    expect(result).toEqual({
      ok: true,
      message: 'Configuration logging.level.',
      data: {
        path: 'logging.level',
        value: 'debug',
      },
    });
  });

  it('updates one persisted config value for config set through configDao', async () => {
    const saveStoredConfig = jest.fn();
    let currentConfig = {
      logging: {
        level: 'info',
      },
    };

    saveStoredConfig.mockImplementation((nextConfig) => {
      currentConfig = nextConfig;
    });

    const result = await executeCliCommand({
      getConfig: () => currentConfig,
      getPersistence: () => ({
        configDao: {
          saveStoredConfig,
        },
      }),
      getRemotes: () => ({
        adminActions: {},
      }),
    }, 'config set logging.level debug');

    expect(saveStoredConfig).toHaveBeenCalledWith({
      logging: {
        level: 'debug',
      },
    }, expect.arrayContaining(['logging.level']));
    expect(result).toEqual({
      ok: true,
      message: 'Configuration logging.level mise a jour.',
      data: {
        path: 'logging.level',
        value: 'debug',
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
    }, 'sys-config');

    expect(result).toEqual({
      ok: true,
      message: 'Configuration système.',
      data: systemConfig,
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
    }, 'tokens');

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
    }, 'tasks');

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
