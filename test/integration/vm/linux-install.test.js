import {spawn, spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(import.meta.dirname, '../../..');
const vagrantDirectory = path.join(repositoryRoot, 'dev/vagrant');
const guestEnvironment = 'XDG_RUNTIME_DIR=/run/user/$(id -u) DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$(id -u)/bus';

function vagrant(...args) {
  const result = spawnSync('vagrant', args, {cwd: vagrantDirectory, encoding: 'utf8'});
  if (result.status !== 0) {
    throw new Error(`vagrant ${args.join(' ')} failed\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout.trim();
}

function guest(command) {
  return vagrant('ssh', 'linux-install', '-c', `${guestEnvironment} ${command}`);
}

function guestBaseUrl() {
  const sshConfig = vagrant('ssh-config', 'linux-install');
  const host = sshConfig.match(/^\s*HostName\s+(\S+)/m)?.[1];
  if (!host) {
    throw new Error('Vagrant did not report the linux-install guest address');
  }
  return `http://${host}:3987`;
}

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
  const capture = spawn('vagrant', ['ssh', 'linux-install', '-c', captureCommand], {
    cwd: vagrantDirectory,
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
      const {JEST_WORKER_ID: _jestWorkerId, ...childEnvironment} = process.env;
      childEnvironment.REMOTE_MOUSE_VM_URL = guestBaseUrl();
      const result = spawnSync('npx', ['playwright', 'test', '--config=playwright.vm.config.js'], {
        cwd: repositoryRoot,
        encoding: 'utf8',
        env: childEnvironment,
      });
      expect(`${result.stdout}\n${result.stderr}`).toContain('1 passed');
      expect(result.status).toBe(0);
    });

    expect(output).toContain('REL_X');
    expect(output).toContain('REL_Y');
    expect(output).toContain('BTN_LEFT');
    expect(output).toContain('KEY_A');
    expect(output).toContain('KEY_ENTER');
  });
});
