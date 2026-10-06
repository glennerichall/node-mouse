import {createDesktopProbe} from '../desktop-probe/index.js';
import {runBrowserClient} from '../desktop-probe/run-browser-client.js';

const probe = createDesktopProbe();
const {repositoryRoot} = probe;
const guest = (command) => probe.runGuest(command);

function pointerPosition() {
  const output = guest('xdotool getmouselocation --shell');
  return {
    x: Number(output.match(/^X=(\d+)/m)?.[1]),
    y: Number(output.match(/^Y=(\d+)/m)?.[1]),
  };
}

function waitForOverlayState(expected) {
  guest(`for _attempt in $(seq 1 80); do
    window_id=$(xdotool search --name 'Remote Mouse QR Overlay' 2>/dev/null | head -n 1)
    map_state=$(xwininfo -id "$window_id" 2>/dev/null | sed -n 's/.*Map State: //p')
    opacity=$(xprop -id "$window_id" _NET_WM_WINDOW_OPACITY 2>/dev/null | sed 's/.*= //')
    if [ "$map_state" = '${expected}' ] \
      && { [ '${expected}' != IsViewable ] || [ "$opacity" = 4294967295 ]; }; then
      exit 0
    fi
    sleep 0.25
  done
  echo 'QR overlay did not reach Map State: ${expected}.' >&2
  exit 1`);
}

describe('Ubuntu X11 desktop guest', () => {
  test('runs a real Xorg desktop and the Remote Mouse user service', () => {
    expect(guest('xdpyinfo | sed -n "s/^vendor string: *//p"')).toBe('The X.Org Foundation');
    expect(guest(`for session in $(loginctl show-user "$USER" -p Sessions --value); do
      session_type=$(loginctl show-session "$session" -p Type --value 2>/dev/null || true)
      if [ "$session_type" = x11 ]; then echo x11; exit 0; fi
    done
    exit 1`)).toBe('x11');
    expect(guest('systemctl --user is-active remote-mouse.service')).toBe('active');
  });

  test('drives RobotJS input, receives preview frames and captures the QR overlay check', async () => {
    guest('xdotool mousemove 300 300; systemctl --user restart remote-mouse.service; rm -f /tmp/remote-mouse-xinput.log; nohup timeout 20s xinput test-xi2 --root >/tmp/remote-mouse-xinput.log 2>&1 </dev/null & sleep 1');
    waitForOverlayState('IsViewable');
    const before = pointerPosition();
    runBrowserClient(probe, {token: 'vm-x11-integration-token', assertPreview: true});

    const after = pointerPosition();
    expect(after.x).toBeGreaterThan(before.x);
    expect(after.y).toBeLessThan(before.y);
    const keyboardEvents = guest('cat /tmp/remote-mouse-xinput.log');
    expect(keyboardEvents).toMatch(/RawKeyPress[\s\S]*detail: 38/);
    expect(keyboardEvents).toMatch(/RawKeyPress[\s\S]*detail: 36/);

    waitForOverlayState('IsViewable');
    guest(`window_id=$(xdotool search --name 'Remote Mouse QR Overlay' | head -n 1)
      xdotool mousemove --window "$window_id" 30 30
      for _attempt in $(seq 1 40); do
        if xwininfo -id "$window_id" | grep -q 'Map State: IsUnMapped'; then break; fi
        sleep 0.1
      done
      xwininfo -id "$window_id" | grep -q 'Map State: IsUnMapped'
      xdotool mousemove 300 300
      for _attempt in $(seq 1 80); do
        if xwininfo -id "$window_id" | grep -q 'Map State: IsViewable'; then exit 0; fi
        sleep 0.25
      done
      echo 'QR overlay did not reappear after the pointer left.' >&2
      exit 1`);
    waitForOverlayState('IsViewable');
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });
});
