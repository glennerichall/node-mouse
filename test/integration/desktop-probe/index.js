import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const vagrantDirectory = path.join(repositoryRoot, 'dev/vagrant');

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

  function vagrant(...args) {
    const result = run('vagrant', args, {
      cwd: vagrantDirectory,
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    });
    if (result.status !== 0) {
      throw new Error(`vagrant ${args.join(' ')} failed\n${result.stdout}\n${result.stderr}`);
    }
    return result.stdout.trim();
  }

  return Object.freeze({
    profile,
    desktop: target.desktop,
    machine: target.machine,
    repositoryRoot,
    runGuest(command) {
      return vagrant('ssh', target.machine, '-c', `${linuxDesktopEnvironment(target.desktop)} ${command}`);
    },
    baseUrl() {
      const sshConfig = vagrant('ssh-config', target.machine);
      const host = sshConfig.match(/^\s*HostName\s+(\S+)/m)?.[1];
      if (!host) throw new Error(`Vagrant did not report the ${target.machine} guest address`);
      return `http://${host}:3987`;
    },
    vagrant,
  });
}

export const desktopProbeProfiles = Object.freeze(Object.keys(profiles));
