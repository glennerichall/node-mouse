import {jest} from '@jest/globals';

const logEntry = {
  at: '2026-04-02T12:00:00.000Z',
  scope: 'config',
  level: 'debug',
  message: 'config command debug log',
};
const withCliLogStream = jest.fn(async (_level, onLog, callback) => {
  onLog?.(logEntry);
  return callback();
});

jest.unstable_mockModule('../../server/application/logger.js', () => ({
  withCliLogStream,
}));

const {executeCliRequest, withCliVerbosity} = await import('../../server/cli/executeCliRequest.js');

describe('cli request execution', () => {
  beforeEach(() => {
    withCliLogStream.mockClear();
  });

  it('applies verbosity logging around any cli command', async () => {
    const onLog = jest.fn();
    const result = await executeCliRequest({
      getConfigService: () => ({
        getConfig: () => 'debug',
      }),
      getRemotes: () => ({
        adminActions: {},
      }),
    }, {name: 'config', args: {action: 'get', path: 'logging.level', value: ''}}, {verbosity: 1}, onLog);

    expect(withCliLogStream).toHaveBeenCalledWith('debug', onLog, expect.any(Function));
    expect(onLog).toHaveBeenCalledWith(logEntry);
    expect(result).toEqual(expect.objectContaining({
      ok: true,
      message: 'Configuration logging.level.',
    }));
  });

  it('can wrap local cli command execution with the same verbosity behavior', async () => {
    const onLog = jest.fn();
    const result = await withCliVerbosity({verbosity: 2}, async () => ({
      ok: true,
      message: 'local command executed',
    }), onLog);

    expect(withCliLogStream).toHaveBeenCalledWith('trace', onLog, expect.any(Function));
    expect(onLog).toHaveBeenCalledWith(logEntry);
    expect(result).toEqual({
      ok: true,
      message: 'local command executed',
    });
  });
});
