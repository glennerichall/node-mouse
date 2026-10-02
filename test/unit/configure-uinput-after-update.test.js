import {jest} from '@jest/globals';
import {
  configureUInputAfterAppUpdate,
  hasUInputSystemAccess,
  resolveDesktopUser,
} from '../../scripts/configure-uinput-after-update.mjs';

describe('uinput migration after app update', () => {
  it('prefers the sudo user when resolving the desktop account', () => {
    expect(resolveDesktopUser({SUDO_USER: 'alice', USER: 'root'})).toBe('alice');
  });

  it('recognizes an installed rule and group membership', () => {
    const run = jest.fn(() => ({status: 0, stdout: 'alice audio remote-mouse-uinput\n'}));

    expect(hasUInputSystemAccess({user: 'alice', ruleExists: true, run})).toBe(true);
    expect(run).toHaveBeenCalledWith('id', ['-nG', 'alice'], {encoding: 'utf8'});
  });

  it('does nothing outside an update launched by the daemon', () => {
    const execute = jest.fn();

    expect(configureUInputAfterAppUpdate({
      env: {USER: 'alice'},
      platform: 'linux',
      execute,
    })).toEqual({attempted: false, configured: false});
    expect(execute).not.toHaveBeenCalled();
  });

  it('opens a local Polkit prompt when uinput is not configured', () => {
    const execute = jest.fn();

    expect(configureUInputAfterAppUpdate({
      env: {REMOTE_MOUSE_DAEMON: '1', USER: 'alice'},
      platform: 'linux',
      isConfigured: () => false,
      execute,
    })).toEqual({attempted: true, configured: true});
    expect(execute).toHaveBeenCalledWith(
      'pkexec',
      expect.arrayContaining(['bash', expect.stringMatching(/configure-uinput-access\.sh$/), 'alice']),
      expect.objectContaining({stdio: 'inherit'}),
    );
  });

  it('keeps npm installation successful when Polkit is refused', () => {
    const stderr = {write: jest.fn()};
    const error = new Error('authorization dismissed');

    const result = configureUInputAfterAppUpdate({
      env: {REMOTE_MOUSE_DAEMON: '1', USER: 'alice'},
      platform: 'linux',
      isConfigured: () => false,
      execute: () => { throw error; },
      stderr,
    });

    expect(result).toEqual({attempted: true, configured: false, error});
    expect(stderr.write).toHaveBeenCalledWith(expect.stringContaining('sudo bash'));
  });
});
