import {jest} from '@jest/globals';
import {configureGnomeFocusAfterAppUpdate} from '../../scripts/configure-gnome-focus-after-update.mjs';

describe('GNOME focus migration after app update', () => {
  it('installs and enables the extension only for a daemon update in GNOME Wayland', async () => {
    const install = jest.fn().mockResolvedValue({ok: true});

    await expect(configureGnomeFocusAfterAppUpdate({
      platform: 'linux',
      env: {
        REMOTE_MOUSE_DAEMON: '1',
        XDG_SESSION_TYPE: 'wayland',
        XDG_CURRENT_DESKTOP: 'ubuntu:GNOME',
      },
      install,
    })).resolves.toEqual({attempted: true, configured: true});

    expect(install).toHaveBeenCalledWith({env: expect.objectContaining({REMOTE_MOUSE_DAEMON: '1'})});
  });

  it('skips the migration outside a GNOME Wayland daemon update', async () => {
    const install = jest.fn();

    await expect(configureGnomeFocusAfterAppUpdate({
      platform: 'linux',
      env: {REMOTE_MOUSE_DAEMON: '1', XDG_SESSION_TYPE: 'wayland', XDG_CURRENT_DESKTOP: 'KDE'},
      install,
    })).resolves.toEqual({attempted: false, configured: false});

    expect(install).not.toHaveBeenCalled();
  });

  it('keeps the update successful and reports a failed migration', async () => {
    const stderr = {write: jest.fn()};
    const result = await configureGnomeFocusAfterAppUpdate({
      platform: 'linux',
      env: {
        REMOTE_MOUSE_DAEMON: '1',
        XDG_SESSION_TYPE: 'wayland',
        XDG_CURRENT_DESKTOP: 'GNOME',
      },
      install: async () => ({ok: false, message: 'extension command unavailable'}),
      stderr,
    });

    expect(result).toEqual({attempted: true, configured: false, message: 'extension command unavailable'});
    expect(stderr.write).toHaveBeenCalledWith(expect.stringContaining('extension command unavailable'));
  });
});
