import {jest} from '@jest/globals';

describe('window toggle platform helpers', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('linux toggles a maximized window by removing maximized flags', async () => {
    const commandExists = jest.fn(async (command) => ['xprop', 'wmctrl'].includes(command));
    const execFileAsync = jest.fn(async (command, args) => {
      if (command === 'xprop') {
        return {
          ok: true,
          stdout: '_NET_WM_STATE(ATOM) = _NET_WM_STATE_MAXIMIZED_VERT, _NET_WM_STATE_MAXIMIZED_HORZ',
          stderr: '',
        };
      }

      if (command === 'wmctrl' && args[1] === '0x123' && args[2] === '-b') {
        return {ok: true, stdout: '', stderr: ''};
      }

      return {ok: false, stdout: '', stderr: ''};
    });

    jest.unstable_mockModule('../../server/utils/process.js', () => ({
      execFileAsync,
    }));
    jest.unstable_mockModule('../../server/os/linux/process.js', () => ({
      commandExists,
    }));

    const {toggleWindow} = await import('../../server/os/linux/windows.js');
    const ok = await toggleWindow('0x123');

    expect(ok).toBe(true);
    expect(execFileAsync).toHaveBeenCalledWith('wmctrl', ['-ir', '0x123', '-b', 'remove,maximized_vert,maximized_horz']);
  });

  it('windows toggle script restores instead of minimizing', async () => {
    const {buildForegroundWindowPowerShell} = await import('../../server/os/win32/powershell.js');

    const script = buildForegroundWindowPowerShell('toggle');

    expect(script).toContain('ShowWindow($hwnd, 9)');
    expect(script).not.toContain('ShowWindow($hwnd, 6)');
  });

  it('darwin toggle scripts use the zoom button and do not minimize', async () => {
    const {buildActiveWindowScript, buildAppWindowScript} = await import('../../server/os/darwin/applescript.js');

    const activeScript = buildActiveWindowScript('toggle');
    const appScript = buildAppWindowScript('VLC', 'toggle');

    expect(activeScript).toContain('AXZoomButton');
    expect(appScript).toContain('AXZoomButton');
    expect(activeScript).not.toContain('AXMinimized');
    expect(appScript).not.toContain('AXMinimized');
  });
});
