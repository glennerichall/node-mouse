import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const profiles = {
  'linux-install': {machine: 'linux-install', desktop: null},
  'linux-x11': {machine: 'linux-x11', desktop: 'x11'},
  'linux-wayland': {machine: 'linux-wayland', desktop: 'wayland'},
  windows: {machine: null, desktop: 'windows'},
};

function linuxDesktopEnvironment(desktop) {
  if (desktop === 'x11') {
    return 'export DISPLAY=:0 XAUTHORITY=$HOME/.Xauthority XDG_RUNTIME_DIR=/run/user/$(id -u) DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u)/bus;';
  }
  if (desktop === 'wayland') {
    return 'export XDG_RUNTIME_DIR=/run/user/$(id -u) DISPLAY=$(systemctl --user show-environment | sed -n "s/^DISPLAY=//p" | tail -n 1) XAUTHORITY=$(systemctl --user show-environment | sed -n "s/^XAUTHORITY=//p" | tail -n 1) DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u)/bus; DISPLAY=${DISPLAY:-:0};';
  }
  return 'export XDG_RUNTIME_DIR=/run/user/$(id -u) DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u)/bus;';
}

export function createDesktopProbe({profile = process.env.REMOTE_MOUSE_TEST_PROFILE, run = spawnSync} = {}) {
  const target = profiles[profile];
  if (!target) {
    throw new Error(`Unknown REMOTE_MOUSE_TEST_PROFILE '${profile ?? ''}'. Choose: ${Object.keys(profiles).join(', ')}.`);
  }
  if (target.machine === null) {
    throw new Error('The Windows DesktopProbe must run on a Windows test host; remote Windows guest transport is not implemented yet.');
  }

  const host = process.env.REMOTE_MOUSE_TEST_HOST ?? (run === spawnSync ? null : '127.0.0.1');
  if (!host) throw new Error('Set REMOTE_MOUSE_TEST_HOST to the developer-provided test VM.');
  const user = process.env.REMOTE_MOUSE_TEST_USER ?? process.env.USER;
  const port = process.env.REMOTE_MOUSE_TEST_PORT ?? '22';
  const key = process.env.REMOTE_MOUSE_TEST_KEY;
  function sshArgs(command) {
    return ['-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=accept-new', '-p', port,
      ...(key ? ['-i', key] : []), `${user}@${host}`, `${linuxDesktopEnvironment(target.desktop)} ${command}`];
  }
  function ssh(command) {
    const result = run('ssh', sshArgs(command), {
      cwd: repositoryRoot,
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    });
    if (result.status !== 0) {
      throw new Error(`ssh ${host} failed\n${result.stdout}\n${result.stderr}`);
    }
    return result.stdout.trim();
  }

  return Object.freeze({
    profile,
    desktop: target.desktop,
    machine: host,
    repositoryRoot,
    runGuest(command) {
      return ssh(command);
    },
    runGuestProcess(command, options = {}) {
      return run('ssh', sshArgs(command), {cwd: repositoryRoot, ...options});
    },
    baseUrl() {
      return `http://${host}:3987`;
    },
  });
}

export const desktopProbeProfiles = Object.freeze(Object.keys(profiles));
