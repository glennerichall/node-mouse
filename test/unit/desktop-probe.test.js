import {createDesktopProbe, desktopProbeProfiles} from '../integration/desktop-probe/index.js';

describe('DesktopProbe', () => {
  test.each([
    ['linux-install', null, 'linux-install'],
    ['linux-x11', 'x11', 'linux-x11'],
    ['linux-wayland', 'wayland', 'linux-wayland'],
  ])('selects the %s target', (profile, desktop, machine) => {
    const probe = createDesktopProbe({profile});

    expect(probe).toMatchObject({profile, desktop, machine});
  });

  test('lists the Windows provider while requiring a native Windows host for now', () => {
    expect(desktopProbeProfiles).toContain('windows');
    expect(() => createDesktopProbe({profile: 'windows'})).toThrow(/must run on a Windows test host/);
  });

  test('rejects missing or unknown target profiles with guidance', () => {
    expect(() => createDesktopProbe({profile: undefined})).toThrow(/Choose:/);
    expect(() => createDesktopProbe({profile: 'linux-xorg'})).toThrow(/Unknown REMOTE_MOUSE_TEST_PROFILE/);
  });

  test('uses the configured Vagrant target and provides its base URL', () => {
    const calls = [];
    const run = (command, args, options) => {
      calls.push({command, args, options});
      return {status: 0, stdout: args[0] === 'ssh-config' ? 'HostName 192.0.2.20' : 'active', stderr: ''};
    };
    const probe = createDesktopProbe({profile: 'linux-wayland', run});

    expect(probe.runGuest('systemctl is-active remote-mouse')).toBe('active');
    expect(probe.baseUrl()).toBe('http://192.0.2.20:3987');
    expect(calls[0].args).toEqual(['ssh', 'linux-wayland', '-c', expect.stringContaining('XDG_RUNTIME_DIR')]);
    expect(calls[1].args).toEqual(['ssh-config', 'linux-wayland']);
  });
});
