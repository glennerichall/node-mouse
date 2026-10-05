import {spawnSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(import.meta.dirname, '../../..');
const vagrantDirectory = path.join(repositoryRoot, 'dev/vagrant');

function vagrant(...args) {
  const result = spawnSync('vagrant', args, {
    cwd: vagrantDirectory,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`vagrant ${args.join(' ')} failed\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout.trim();
}

function guest(command) {
  return vagrant('ssh', 'linux-wayland', '-c', command);
}

function guestBaseUrl() {
  const sshConfig = vagrant('ssh-config', 'linux-wayland');
  const host = sshConfig.match(/^\s*HostName\s+(\S+)/m)?.[1];
  if (!host) throw new Error('Vagrant did not report the linux-wayland guest address');
  return `http://${host}:3987`;
}

describe('Ubuntu GNOME Wayland desktop guest', () => {
  test('runs a real Wayland session and receives client input through uinput', async () => {
    expect(guest(`for session in $(loginctl show-user vagrant -p Sessions --value); do
      if [ "$(loginctl show-session "$session" -p Type --value 2>/dev/null || true)" = wayland ]; then
        echo wayland; exit 0
      fi
    done
    exit 1`)).toBe('wayland');
    expect(guest('systemctl --user is-active remote-mouse.service')).toBe('active');
    guest(`mouse_device= keyboard_device=
      for name_file in /sys/class/input/event*/device/name; do
        name=$(cat "$name_file")
        case "$name" in
          *'Remote Mouse'*Keyboard*) keyboard_device="/dev/input/$(basename "$(dirname "$(dirname "$name_file")")")" ;;
          *'Remote Mouse'*Mouse*) mouse_device="/dev/input/$(basename "$(dirname "$(dirname "$name_file")")")" ;;
        esac
      done
      test -n "$mouse_device" && test -n "$keyboard_device"
      sudo timeout 30s evtest "$mouse_device" >/tmp/remote-mouse-wayland-mouse.log 2>&1 &
      sudo timeout 30s evtest "$keyboard_device" >/tmp/remote-mouse-wayland-keyboard.log 2>&1 &
      sleep 1`);

    const {JEST_WORKER_ID: _jestWorkerId, ...childEnvironment} = process.env;
    Object.assign(childEnvironment, {
      REMOTE_MOUSE_VM_URL: guestBaseUrl(),
      REMOTE_MOUSE_VM_TOKEN: 'vm-wayland-integration-token',
    });
    const browser = spawnSync('npx', ['playwright', 'test', '--config=playwright.vm.config.js'], {
      cwd: repositoryRoot,
      encoding: 'utf8',
      env: childEnvironment,
    });
    expect(`${browser.stdout}\n${browser.stderr}`).toContain('1 passed');
    expect(browser.status).toBe(0);

    guest('sleep 1');
    const mouse = guest('cat /tmp/remote-mouse-wayland-mouse.log');
    const keyboard = guest('cat /tmp/remote-mouse-wayland-keyboard.log');
    expect(mouse).toMatch(/REL_X/);
    expect(mouse).toMatch(/BTN_LEFT/);
    expect(keyboard).toMatch(/KEY_A/);
    expect(keyboard).toMatch(/KEY_ENTER/);

    guest(`for _attempt in $(seq 1 80); do
      window_id=$(xdotool search --name 'Remote Mouse QR Overlay' 2>/dev/null | head -n 1)
      if [ -n "$window_id" ] && xwininfo -id "$window_id" | grep -q 'Map State: IsViewable'; then exit 0; fi
      sleep 0.25
    done
    echo 'QR overlay did not appear on the XWayland desktop.' >&2
    exit 1`);

    const artifactDirectory = path.join(repositoryRoot, 'test-results/vm-wayland');
    await mkdir(artifactDirectory, {recursive: true});
    const screenshot = spawnSync('virsh', [
      '--connect', 'qemu:///system', 'screenshot', 'vagrant_linux-wayland',
      path.join(artifactDirectory, 'desktop.png'),
    ], {encoding: 'utf8'});
    expect(`${screenshot.stdout}\n${screenshot.stderr}`).toContain('Screenshot saved');
    expect(screenshot.status).toBe(0);
  });
});
