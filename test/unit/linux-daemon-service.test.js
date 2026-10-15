import {jest} from '@jest/globals';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const execFileAsync = jest.fn();
const spawnDetached = jest.fn();
const serviceDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'remote-mouse-systemd-test-'));

jest.unstable_mockModule('../../server/utils/process.js', () => ({
  execFileAsync,
  spawnDetached,
}));

jest.unstable_mockModule('../../server/services/application/utils.js', () => ({
  getEntrypoint: () => '/opt/remote-mouse/bin/remote-mouse.js',
  getPlatformKind: () => 'systemd-user',
  getSystemdUnitPath: (serviceName) => path.join(serviceDirectory, serviceName),
  isDaemonProcess: () => true,
  shellQuote: (value) => `'${String(value).replace(/'/g, `'\\''`)}'`,
}));

const {
  buildSystemdUnit,
  disableLinuxDaemon,
  getLinuxDaemonInfo,
  installLinuxDaemon,
  restartLinuxDaemon,
  uninstallLinuxDaemon,
} = await import('../../server/os/linux/systemd.js');

describe('Linux user daemon service', () => {
  beforeEach(async () => {
    execFileAsync.mockReset().mockResolvedValue({ok: true, stdout: '', stderr: ''});
    spawnDetached.mockReset().mockResolvedValue({pid: 123});
    await fs.rm(serviceDirectory, {recursive: true, force: true});
    await fs.mkdir(serviceDirectory, {recursive: true});
  });

  afterAll(async () => {
    await fs.rm(serviceDirectory, {recursive: true, force: true});
  });

  it('generates a user-session unit with the current Node path and daemon environment', () => {
    const unit = buildSystemdUnit({entrypoint: '/app/bin/remote-mouse.js', nodePath: '/opt/node/bin/node'});
    for (const line of [
      'After=graphical-session.target network-online.target',
      'ExecStart=/app/bin/remote-mouse.js',
      'Restart=on-failure',
      'Environment=PATH=/opt/node/bin:/usr/local/bin:/usr/bin:/bin',
      'Environment=REMOTE_MOUSE_DAEMON=1',
      'PassEnvironment=DISPLAY WAYLAND_DISPLAY XAUTHORITY DBUS_SESSION_BUS_ADDRESS XDG_SESSION_TYPE XDG_CURRENT_DESKTOP DESKTOP_SESSION',
      'WantedBy=default.target',
    ]) {
      expect(unit).toContain(line);
    }
  });

  it('writes the unit, reloads systemd, then enables and starts it', async () => {
    await expect(installLinuxDaemon('remote-mouse.service')).resolves.toMatchObject({ok: true});

    const unit = await fs.readFile(path.join(serviceDirectory, 'remote-mouse.service'), 'utf8');
    expect(unit).toContain('ExecStart=/opt/remote-mouse/bin/remote-mouse.js');
    expect(execFileAsync.mock.calls).toEqual([
      ['systemctl', ['--user', 'daemon-reload'], {timeout: 15000}],
      ['systemctl', ['--user', 'enable', '--now', 'remote-mouse.service'], {timeout: 30000}],
    ]);
  });

  it('does not enable the service if daemon-reload fails', async () => {
    execFileAsync.mockResolvedValueOnce({ok: false, stdout: '', stderr: 'invalid unit'});

    await expect(installLinuxDaemon('remote-mouse.service')).resolves.toMatchObject({
      ok: false,
      message: 'invalid unit',
    });
    expect(execFileAsync).toHaveBeenCalledTimes(1);
  });

  it('disables and stops the selected user service', async () => {
    await expect(disableLinuxDaemon('remote-mouse.service')).resolves.toMatchObject({ok: true});
    expect(execFileAsync).toHaveBeenCalledWith('systemctl', [
      '--user', 'disable', '--now', 'remote-mouse.service',
    ], {timeout: 30000});
  });

  it('removes the selected unit and reloads systemd on uninstall', async () => {
    const unitPath = path.join(serviceDirectory, 'remote-mouse.service');
    await fs.writeFile(unitPath, '[Service]\n');

    await expect(uninstallLinuxDaemon('remote-mouse.service')).resolves.toMatchObject({ok: true});
    await expect(fs.access(unitPath)).rejects.toMatchObject({code: 'ENOENT'});
    expect(execFileAsync.mock.calls).toEqual([
      ['systemctl', ['--user', 'disable', '--now', 'remote-mouse.service'], {timeout: 30000}],
      ['systemctl', ['--user', 'daemon-reload'], {timeout: 15000}],
      ['systemctl', ['--user', 'reset-failed', 'remote-mouse.service'], {timeout: 10000}],
    ]);
  });

  it('requests restart asynchronously to avoid terminating the command caller', async () => {
    await expect(restartLinuxDaemon('remote-mouse.service')).resolves.toMatchObject({ok: true});
    expect(execFileAsync).toHaveBeenCalledWith('systemctl', [
      '--user', 'enable', 'remote-mouse.service',
    ], {timeout: 15000});
    expect(spawnDetached).toHaveBeenCalledWith('bash', [
      '-lc', "sleep 0.8; systemctl --user restart 'remote-mouse.service'",
    ]);
  });

  it('does not request a restart when re-enabling the service fails', async () => {
    execFileAsync.mockResolvedValueOnce({ok: false, stdout: '', stderr: 'unit not found'});

    await expect(restartLinuxDaemon('remote-mouse.service')).resolves.toEqual({
      ok: false,
      message: 'unit not found',
    });
    expect(spawnDetached).not.toHaveBeenCalled();
  });

  it('reports service state from the user systemd manager', async () => {
    await expect(getLinuxDaemonInfo('remote-mouse.service')).resolves.toEqual({
      serviceName: 'remote-mouse.service',
      platform: process.platform,
      platformKind: 'systemd-user',
      runningAsDaemon: true,
      installed: true,
    });
    expect(execFileAsync).toHaveBeenCalledWith('systemctl', [
      '--user', 'status', 'remote-mouse.service',
    ], {timeout: 5000});
  });
});
