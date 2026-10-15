import {jest} from '@jest/globals';

describe('Wayland window focus adapters', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('detects the display server and compositor from the session environment', async () => {
    const {detectLinuxDisplayServer, detectWaylandCompositor} = await import('../../server/os/linux/wayland/windows.js');

    expect(detectLinuxDisplayServer({XDG_SESSION_TYPE: 'x11'})).toBe('x11');
    expect(detectLinuxDisplayServer({XDG_SESSION_TYPE: 'wayland'})).toBe('wayland');
    expect(detectLinuxDisplayServer({WAYLAND_DISPLAY: 'wayland-0'})).toBe('wayland');
    expect(detectLinuxDisplayServer({DISPLAY: ':0'})).toBe('x11');
    expect(detectWaylandCompositor({XDG_CURRENT_DESKTOP: 'sway'})).toBe('sway');
    expect(detectWaylandCompositor({HYPRLAND_INSTANCE_SIGNATURE: 'instance'})).toBe('hyprland');
    expect(detectWaylandCompositor({XDG_CURRENT_DESKTOP: 'GNOME'})).toBe('mutter');
    expect(detectWaylandCompositor({XDG_CURRENT_DESKTOP: 'KDE'})).toBe('kwin');
  });

  it('focuses a matching Sway window through the compositor IPC', async () => {
    const execFileAsync = jest.fn(async (command, args) => {
      if (command === 'which' && args[0] === 'swaymsg') {
        return {ok: true, stdout: '/usr/bin/swaymsg\n', stderr: ''};
      }
      if (command === 'swaymsg' && args[0] === '-t') {
        return {
          ok: true,
          stdout: JSON.stringify({nodes: [{nodes: [{id: 42, app_id: 'google-chrome', name: 'New Tab'}]}]}),
          stderr: '',
        };
      }
      return {ok: true, stdout: '', stderr: ''};
    });

    jest.unstable_mockModule('../../server/utils/process.js', () => ({
      execFileAsync,
      spawnDetached: jest.fn(),
    }));

    const {focusWaylandWindow} = await import('../../server/os/linux/wayland/windows.js');
    const focused = await focusWaylandWindow({classes: ['google-chrome'], names: ['Chrome']}, {
      XDG_CURRENT_DESKTOP: 'sway',
    });

    expect(focused).toBe(true);
    expect(execFileAsync).toHaveBeenCalledWith('swaymsg', ['[con_id="42"]', 'focus']);
  });

  it('focuses a matching Hyprland window through the compositor IPC', async () => {
    const execFileAsync = jest.fn(async (command, args) => {
      if (command === 'which' && args[0] === 'hyprctl') {
        return {ok: true, stdout: '/usr/bin/hyprctl\n', stderr: ''};
      }
      if (command === 'hyprctl' && args[0] === '-j') {
        return {ok: true, stdout: JSON.stringify([{address: '0xabc', class: 'google-chrome', title: 'New Tab'}]), stderr: ''};
      }
      return {ok: true, stdout: '', stderr: ''};
    });

    jest.unstable_mockModule('../../server/utils/process.js', () => ({
      execFileAsync,
      spawnDetached: jest.fn(),
    }));

    const {focusWaylandWindow} = await import('../../server/os/linux/wayland/windows.js');
    const focused = await focusWaylandWindow({classes: ['google-chrome'], names: ['Chrome']}, {
      XDG_CURRENT_DESKTOP: 'Hyprland',
    });

    expect(focused).toBe(true);
    expect(execFileAsync).toHaveBeenCalledWith('hyprctl', ['dispatch', 'focuswindow', 'address:0xabc']);
  });

  it('focuses a matching Mutter window through the GNOME extension D-Bus API', async () => {
    const execFileAsync = jest.fn(async (command, args) => {
      if (command === 'which' && args[0] === 'gdbus') {
        return {ok: true, stdout: '/usr/bin/gdbus\n', stderr: ''};
      }
      return {ok: true, stdout: '(true,)', stderr: ''};
    });

    jest.unstable_mockModule('../../server/utils/process.js', () => ({
      execFileAsync,
      spawnDetached: jest.fn(),
    }));

    const {focusWaylandWindow} = await import('../../server/os/linux/wayland/windows.js');
    const focused = await focusWaylandWindow({classes: ['google-chrome']}, {
      XDG_CURRENT_DESKTOP: 'GNOME',
    });

    expect(focused).toBe(true);
    expect(execFileAsync).toHaveBeenCalledWith('gdbus', [
      'call',
      '--session',
      '--dest', 'org.gnome.Shell',
      '--object-path', '/com/velor/RemoteMouseFocus',
      '--method', 'com.velor.RemoteMouseFocus.ActivateByClass',
      'google-chrome',
    ]);
  });

  it('also asks Mutter to match the browser title when the native class differs', async () => {
    const execFileAsync = jest.fn(async (command, args) => {
      if (command === 'which' && args[0] === 'gdbus') {
        return {ok: true, stdout: '/usr/bin/gdbus\n', stderr: ''};
      }
      return args.at(-1) === 'Google Chrome'
        ? {ok: true, stdout: '(true,)', stderr: ''}
        : {ok: true, stdout: '(false,)', stderr: ''};
    });

    jest.unstable_mockModule('../../server/utils/process.js', () => ({
      execFileAsync,
      spawnDetached: jest.fn(),
    }));

    const {focusWaylandWindow} = await import('../../server/os/linux/wayland/windows.js');
    const focused = await focusWaylandWindow({classes: ['google-chrome'], names: ['Google Chrome']}, {
      XDG_CURRENT_DESKTOP: 'GNOME',
    });

    expect(focused).toBe(true);
    expect(execFileAsync).toHaveBeenLastCalledWith('gdbus', [
      'call', '--session', '--dest', 'org.gnome.Shell',
      '--object-path', '/com/velor/RemoteMouseFocus',
      '--method', 'com.velor.RemoteMouseFocus.ActivateByClass',
      'Google Chrome',
    ]);
  });
});
