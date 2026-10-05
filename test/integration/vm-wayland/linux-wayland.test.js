import {spawnSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {createDesktopProbe} from '../desktop-probe/index.js';
import {runBrowserClient} from '../desktop-probe/run-browser-client.js';

const probe = createDesktopProbe();
const {repositoryRoot} = probe;
const guest = (command) => probe.runGuest(command);

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

    runBrowserClient(probe, {token: 'vm-wayland-integration-token'});

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
