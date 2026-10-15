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

  it('launches a browser in an independent systemd scope when running as a service', async () => {
    const previousDaemon = process.env.REMOTE_MOUSE_DAEMON;
    process.env.REMOTE_MOUSE_DAEMON = '1';
    const spawnDetached = jest.fn(async () => true);
    const execFileAsync = jest.fn(async (command, args) => {
      if (command === 'which' && args[0] === 'firefox') {
        return {ok: true, stdout: '/usr/bin/firefox\n', stderr: ''};
      }
      if (command === 'which' && args[0] === 'systemd-run') {
        return {ok: true, stdout: '/usr/bin/systemd-run\n', stderr: ''};
      }
      return {ok: false, stdout: '', stderr: ''};
    });

    jest.unstable_mockModule('../../server/utils/process.js', () => ({
      execFileAsync,
      spawnDetached,
    }));
    jest.unstable_mockModule('../../server/os/linux/windows.js', () => ({
      activateWindow: jest.fn(),
      closeWindow: jest.fn(),
      findWindows: jest.fn(async () => []),
      toggleWindow: jest.fn(),
    }));
    jest.unstable_mockModule('../../utils/sync.js', () => ({
      sleep: jest.fn(async () => {}),
    }));
    jest.unstable_mockModule('../../server/application/logger.js', () => ({
      createLogger: () => ({
        debug: jest.fn(),
        trace: jest.fn(),
      }),
    }));

    try {
      const {openOrFocusLinuxApp} = await import('../../server/os/linux/app.js');
      await openOrFocusLinuxApp({
        linux: {
          commands: ['firefox'],
          processNames: ['firefox'],
          windowClasses: ['firefox'],
        },
      });

      expect(spawnDetached).toHaveBeenCalledWith('/usr/bin/systemd-run', [
        '--user',
        '--scope',
        '--quiet',
        '--',
        '/usr/bin/firefox',
      ]);
    } finally {
      if (previousDaemon === undefined) {
        delete process.env.REMOTE_MOUSE_DAEMON;
      } else {
        process.env.REMOTE_MOUSE_DAEMON = previousDaemon;
      }
    }
  });

  it('does not resolve an uninstalled Flatpak application', async () => {
    const execFileAsync = jest.fn(async (command, args) => {
      if (command === 'which' && args[0] === 'flatpak') {
        return {ok: true, stdout: '/usr/bin/flatpak\n', stderr: ''};
      }
      if (command === '/usr/bin/flatpak' && args[0] === 'info') {
        return {ok: false, stdout: '', stderr: 'error: app/com.brave.Browser/x86_64/stable not installed'};
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
        commands: ['brave-browser', 'brave'],
        flatpakAppId: 'com.brave.Browser',
      },
    });

    expect(resolved).toBeNull();
    expect(execFileAsync).toHaveBeenCalledWith(
      '/usr/bin/flatpak',
      ['info', 'com.brave.Browser'],
      expect.objectContaining({timeout: 2000}),
    );
  });

  it('prefers a browser executable installed outside Flatpak', async () => {
    const execFileAsync = jest.fn(async (command, args) => {
      if (command === 'which' && args[0] === 'brave-browser') {
        return {ok: true, stdout: '/usr/bin/brave-browser\n', stderr: ''};
      }
      throw new Error(`Unexpected command: ${command} ${args.join(' ')}`);
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
        commands: ['brave-browser', 'brave'],
        flatpakAppId: 'com.brave.Browser',
      },
    });

    expect(resolved).toEqual(expect.objectContaining({
      launchCommand: '/usr/bin/brave-browser',
      launchArgs: [],
    }));
  });
});
