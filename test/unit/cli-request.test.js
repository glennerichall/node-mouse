import {jest} from '@jest/globals';

const getRecentLogCursor = jest.fn(() => 12);
const getRecentLogsSince = jest.fn(() => ([
  {
    at: '2026-04-02T12:00:00.000Z',
    scope: 'config',
    level: 'debug',
    message: 'config command debug log',
  },
]));
const withTemporaryLoggerLevel = jest.fn(async (_level, callback) => callback());

jest.unstable_mockModule('../../server/services/log/logger.js', () => ({
  getRecentLogCursor,
  getRecentLogsSince,
  withTemporaryLoggerLevel,
}));

const {executeCliRequest, withCliVerbosity} = await import('../../server/cli/executeCliRequest.js');

describe('cli request execution', () => {
  beforeEach(() => {
    getRecentLogCursor.mockClear();
    getRecentLogsSince.mockClear();
    withTemporaryLoggerLevel.mockClear();
  });

  it('applies verbosity logging around any cli command', async () => {
    const result = await executeCliRequest({
      getConfigService: () => ({
        getConfig: () => 'debug',
      }),
      getRemotes: () => ({
        adminActions: {},
      }),
    }, {name: 'config', args: {action: 'get', path: 'logging.level', value: ''}}, {verbosity: 1});

    expect(withTemporaryLoggerLevel).toHaveBeenCalledWith('debug', expect.any(Function));
    expect(getRecentLogCursor).toHaveBeenCalledTimes(1);
    expect(getRecentLogsSince).toHaveBeenCalledWith(12);
    expect(result).toEqual(expect.objectContaining({
      ok: true,
      message: 'Configuration logging.level.',
      logs: [
        {
          at: '2026-04-02T12:00:00.000Z',
          scope: 'config',
          level: 'debug',
          message: 'config command debug log',
        },
      ],
    }));
  });

  it('can wrap local cli command execution with the same verbosity behavior', async () => {
    const result = await withCliVerbosity({verbosity: 2}, async () => ({
      ok: true,
      message: 'local command executed',
    }));

    expect(withTemporaryLoggerLevel).toHaveBeenCalledWith('trace', expect.any(Function));
    expect(result).toEqual({
      ok: true,
      message: 'local command executed',
      logs: [
        {
          at: '2026-04-02T12:00:00.000Z',
          scope: 'config',
          level: 'debug',
          message: 'config command debug log',
        },
      ],
    });
  });
});
