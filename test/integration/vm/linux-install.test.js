import {spawn, spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {createDesktopProbe} from '../desktop-probe/index.js';
import {runBrowserClient} from '../desktop-probe/run-browser-client.js';

const probe = createDesktopProbe();
const {repositoryRoot} = probe;
const guest = (command) => probe.runGuest(command);

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function captureInputDuring(browserAction) {
  const captureCommand = [
    'mouse=$(grep -l "Remote Mouse Virtual Mouse" /sys/class/input/event*/device/name | head -n1)',
    'keyboard=$(grep -l "Remote Mouse Virtual Keyboard" /sys/class/input/event*/device/name | head -n1)',
    'mouse=/dev/input/$(basename "$(dirname "$(dirname "$mouse")")")',
    'keyboard=/dev/input/$(basename "$(dirname "$(dirname "$keyboard")")")',
    'sudo timeout 8s evtest "$mouse" & sudo timeout 8s evtest "$keyboard" & wait',
  ].join('; ');
  const capture = spawn('vagrant', ['ssh', probe.machine, '-c', captureCommand], {
    cwd: new URL('../../../dev/vagrant', import.meta.url),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  capture.stdout.on('data', (chunk) => { output += chunk; });
  capture.stderr.on('data', (chunk) => { output += chunk; });
  await delay(1500);
  await browserAction();
  await new Promise((resolve) => capture.once('close', resolve));
  return output;
}

describe('Ubuntu installation guest', () => {
  test('runs the installed service and exposes the expected version and client', async () => {
    const expectedVersion = JSON.parse(
      await readFile(path.join(repositoryRoot, 'package.json'), 'utf8'),
    ).version;
    expect(guest('remote-mouse version')).toBe(expectedVersion);
    expect(guest('systemctl --user is-enabled remote-mouse.service')).toBe('enabled');
    expect(guest('systemctl --user is-active remote-mouse.service')).toBe('active');

    const health = JSON.parse(guest('curl --fail --silent http://127.0.0.1:3987/health'));
    expect(health).toMatchObject({ok: true, version: expectedVersion});
    expect(guest('curl --fail --silent http://127.0.0.1:3987/'))
      .toContain('<title>Remote Mouse</title>');
  });

  test('preserves local configuration during an update installation', () => {
    const command = [
      'env_file=$HOME/.config/remote-mouse/.env',
      'grep -q ^INTEGRATION_SENTINEL= "$env_file" || printf "\\nINTEGRATION_SENTINEL=preserved\\n" >> "$env_file"',
      'before=$(sha256sum "$env_file" | cut -d" " -f1)',
      'XDG_SESSION_TYPE=wayland /workspace/remote-mouse/scripts/install-linux.sh --yes --package /workspace/remote-mouse --config-dir "$HOME/.config/remote-mouse" --port 3987 --no-https --wayland --install-service',
      'after=$(sha256sum "$env_file" | cut -d" " -f1)',
      'test "$before" = "$after"',
    ].join('; ');
    expect(() => guest(command)).not.toThrow();
  });

  test('carries browser commands through Socket.IO to Linux uinput devices', async () => {
    const output = await captureInputDuring(async () => {
      runBrowserClient(probe);
    });

    expect(output).toContain('REL_X');
    expect(output).toContain('REL_Y');
    expect(output).toContain('BTN_LEFT');
    expect(output).toContain('KEY_A');
    expect(output).toContain('KEY_ENTER');
  });
});
