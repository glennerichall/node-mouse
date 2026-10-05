import {spawnSync} from 'node:child_process';
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(import.meta.dirname, '../../..');
const vagrantDirectory = path.join(repositoryRoot, 'dev/vagrant');
const guestEnvironment = [
  'export DISPLAY=:0',
  'XAUTHORITY=$HOME/.Xauthority',
  'XDG_RUNTIME_DIR=/run/user/$(id -u)',
  'DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u)/bus;',
].join(' ');

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
  return vagrant('ssh', 'linux-x11', '-c', `${guestEnvironment} ${command}`);
}

function guestBaseUrl() {
  const sshConfig = vagrant('ssh-config', 'linux-x11');
  const host = sshConfig.match(/^\s*HostName\s+(\S+)/m)?.[1];
  if (!host) throw new Error('Vagrant did not report the linux-x11 guest address');
  return `http://${host}:3987`;
}

function pointerPosition() {
  const output = guest('xdotool getmouselocation --shell');
  return {
    x: Number(output.match(/^X=(\d+)/m)?.[1]),
    y: Number(output.match(/^Y=(\d+)/m)?.[1]),
  };
}

describe('Ubuntu X11 desktop guest', () => {
  test('runs a real Xorg desktop and the Remote Mouse user service', () => {
    expect(guest('xdpyinfo | sed -n "s/^vendor string: *//p"')).toBe('The X.Org Foundation');
    expect(guest('loginctl show-session c1 -p Type --value')).toBe('x11');
    expect(guest('systemctl --user is-active remote-mouse.service')).toBe('active');
  });

  test('drives RobotJS input, receives preview frames and captures the QR overlay check', async () => {
    guest('xdotool mousemove 300 300; rm -f /tmp/remote-mouse-xinput.log; nohup timeout 20s xinput test-xi2 --root >/tmp/remote-mouse-xinput.log 2>&1 </dev/null & sleep 1');
    const before = pointerPosition();
    const {JEST_WORKER_ID: _jestWorkerId, ...childEnvironment} = process.env;
    Object.assign(childEnvironment, {
      REMOTE_MOUSE_VM_URL: guestBaseUrl(),
      REMOTE_MOUSE_VM_TOKEN: 'vm-x11-integration-token',
      REMOTE_MOUSE_VM_ASSERT_PREVIEW: 'true',
      REMOTE_MOUSE_VM_TOGGLE_QR: 'true',
    });
    const browser = spawnSync('npx', ['playwright', 'test', '--config=playwright.vm.config.js'], {
      cwd: repositoryRoot,
      encoding: 'utf8',
      env: childEnvironment,
    });
    expect(`${browser.stdout}\n${browser.stderr}`).toContain('1 passed');
    expect(browser.status).toBe(0);

    const after = pointerPosition();
    expect(after.x).toBeGreaterThan(before.x);
    expect(after.y).toBeLessThan(before.y);
    const keyboardEvents = guest('cat /tmp/remote-mouse-xinput.log');
    expect(keyboardEvents).toMatch(/RawKeyPress[\s\S]*detail: 38/);
    expect(keyboardEvents).toMatch(/RawKeyPress[\s\S]*detail: 36/);

    guest('sleep 1; xwd -root -silent -out /tmp/remote-mouse-overlay.xwd');
    const artifactDirectory = path.join(repositoryRoot, 'test-results/vm-x11');
    await mkdir(artifactDirectory, {recursive: true});
    await writeFile(
      path.join(artifactDirectory, 'overlay-root.xwd'),
      Buffer.from(guest('base64 -w0 /tmp/remote-mouse-overlay.xwd'), 'base64'),
    );
  });
});
