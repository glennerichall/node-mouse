import {jest} from '@jest/globals';

describe('linux app resolution', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('resolves snap commands even when snap is missing from the service PATH', async () => {
    const execFileAsync = jest.fn(async (command, args, options) => {
      if (command === 'which' && args[0] === 'vlc') {
        expect(options.env.PATH).toContain('/snap/bin');
        return {
          ok: true,
          stdout: '/snap/bin/vlc\n',
          stderr: '',
        };
      }

      return {ok: false, stdout: '', stderr: ''};
    });

    jest.unstable_mockModule('../../server/utils/process.js', () => ({
      execFileAsync,
      spawnDetached: jest.fn(),
    }));
    jest.unstable_mockModule('../../server/application/logger.js', () => ({
      createLogger: () => ({
        debug: jest.fn(),
        trace: jest.fn(),
      }),
    }));

    const {resolveLinuxApp} = await import('../../server/os/linux/app.js');
    const resolved = await resolveLinuxApp({
      linux: {
        commands: ['vlc'],
        processNames: ['vlc', 'vlc.bin'],
        windowClasses: ['vlc'],
      },
    });

    expect(resolved).toEqual(expect.objectContaining({
      launchCommand: '/snap/bin/vlc',
      launchArgs: [],
      processNames: ['vlc', 'vlc.bin'],
    }));
  });
});
