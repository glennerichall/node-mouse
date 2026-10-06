import {createDesktopProbe, desktopProbeProfiles} from '../integration/desktop-probe/index.js';

describe('DesktopProbe', () => {
  beforeAll(() => { process.env.REMOTE_MOUSE_TEST_HOST = '127.0.0.1'; });
  afterAll(() => { delete process.env.REMOTE_MOUSE_TEST_HOST; });
  test.each([
    ['linux-install', null, 'linux-install'],
    ['linux-x11', 'x11', 'linux-x11'],
    ['linux-wayland', 'wayland', 'linux-wayland'],
  ])('selects the %s target', (profile, desktop) => {
    const probe = createDesktopProbe({profile});

    expect(probe).toMatchObject({profile, desktop, machine: '127.0.0.1'});
  });

  test('lists the Windows provider while requiring a native Windows host for now', () => {
    expect(desktopProbeProfiles).toContain('windows');
    expect(() => createDesktopProbe({profile: 'windows'})).toThrow(/must run on a Windows test host/);
  });

  test('rejects missing or unknown target profiles with guidance', () => {
    expect(() => createDesktopProbe({profile: undefined})).toThrow(/Choose:/);
    expect(() => createDesktopProbe({profile: 'linux-xorg'})).toThrow(/Unknown REMOTE_MOUSE_TEST_PROFILE/);
  });

  test('uses the configured developer VM over SSH and provides its base URL', () => {
    const calls = [];
    const previousHost = process.env.REMOTE_MOUSE_TEST_HOST;
    process.env.REMOTE_MOUSE_TEST_HOST = '192.0.2.20';
    const run = (command, args, options) => {
      calls.push({command, args, options});
      return {status: 0, stdout: 'active', stderr: ''};
    };
    const probe = createDesktopProbe({profile: 'linux-wayland', run});

    expect(probe.runGuest('systemctl is-active remote-mouse')).toBe('active');
    expect(probe.baseUrl()).toBe('http://192.0.2.20:3987');
    expect(calls[0].command).toBe('ssh');
    expect(calls[0].args).toEqual(expect.arrayContaining([expect.stringMatching(/@192\.0\.2\.20$/)]));
    if (previousHost === undefined) delete process.env.REMOTE_MOUSE_TEST_HOST;
    else process.env.REMOTE_MOUSE_TEST_HOST = previousHost;
  });
});
