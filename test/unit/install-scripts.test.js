import {mkdtemp, readFile, writeFile, chmod} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';

function run(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('close', (code) => {
      resolve({code, stdout, stderr});
    });
  });
}

async function writeExecutable(filePath, content) {
  await writeFile(filePath, content, 'utf8');
  await chmod(filePath, 0o755);
}

describe('install scripts', () => {
  it('uses the canonical 120-minute entry token grace period in every template', async () => {
    const templates = await Promise.all([
      readFile(path.join(process.cwd(), '.env.example'), 'utf8'),
      readFile(path.join(process.cwd(), 'scripts/install-linux.sh'), 'utf8'),
      readFile(path.join(process.cwd(), 'scripts/install-windows.ps1'), 'utf8'),
    ]);

    for (const template of templates) {
      expect(template).toMatch(/^ENTRY_PATH_GRACE_MIN=120$/m);
    }
  });

  it('limits Wayland input permissions to uinput instead of the input group', async () => {
    const script = await readFile(path.join(process.cwd(), 'scripts/configure-uinput-access.sh'), 'utf8');
    expect(script).toContain('GROUP="remote-mouse-uinput"');
    expect(script).toContain('/dev/uinput');
    expect(script).not.toContain('usermod -a -G input ');
    expect(script).not.toContain('/dev/input/event');
  });

  it('keeps the single-file installer autonomous for uinput setup', async () => {
    const script = await readFile(path.join(process.cwd(), 'scripts/install-linux.sh'), 'utf8');
    expect(script).toContain('GROUP="remote-mouse-uinput"');
    expect(script).toContain('/etc/udev/rules.d/70-remote-mouse-uinput.rules');
    expect(script).not.toContain('$PROJECT_ROOT/scripts/configure-uinput-access.sh');
  });

  it('migrates an existing Wayland installation without replacing secrets or data', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'remote-mouse-migrate-linux-'));
    const mockBin = path.join(root, 'bin');
    const configDir = path.join(root, 'config');
    const prefix = path.join(root, 'npm-prefix');
    const logPath = path.join(root, 'commands.log');
    await import('node:fs/promises').then((fs) => Promise.all([
      fs.mkdir(mockBin, {recursive: true}),
      fs.mkdir(configDir, {recursive: true}),
      fs.mkdir(prefix, {recursive: true}),
    ]));
    const envPath = path.join(configDir, '.env');
    const databasePath = path.join(configDir, 'remote-mouse.sqlite3');
    const originalSecret = 'existing-secret-that-must-survive';
    await writeFile(envPath, `PORT=4567\nSESSION_COOKIE_SECRET=${originalSecret}\nCUSTOM_SETTING=keep-me\n`);
    await writeFile(databasePath, 'existing-database');

    const commands = {
      node: '#!/usr/bin/env bash\necho v22.0.0',
      npm: `#!/usr/bin/env bash
echo "npm $*" >> "$REMOTE_MOUSE_TEST_LOG"
if [[ "$1 $2 $3" == "config get prefix" ]]; then echo "$REMOTE_MOUSE_NPM_PREFIX"; fi
if [[ "$1" == "--version" ]]; then echo 10.0.0; fi`,
      gcc: '#!/usr/bin/env bash\nexit 0',
      make: '#!/usr/bin/env bash\nexit 0',
      wmctrl: '#!/usr/bin/env bash\nexit 0',
      openssl: '#!/usr/bin/env bash\nexit 0',
      'remote-mouse': '#!/usr/bin/env bash\nexit 0',
      id: `#!/usr/bin/env bash
if [[ "$1" == "-u" ]]; then echo 1001; elif [[ "$1" == "-un" ]]; then echo glenn; elif [[ "$1" == "-nG" ]]; then echo glenn; else exit 0; fi`,
      sudo: `#!/usr/bin/env bash
echo "sudo $*" >> "$REMOTE_MOUSE_TEST_LOG"
exec "$@"`,
    };
    for (const [name, content] of Object.entries(commands)) {
      await writeExecutable(path.join(mockBin, name), content);
    }
    for (const name of ['groupadd', 'usermod', 'install', 'modprobe', 'udevadm']) {
      await writeExecutable(path.join(mockBin, name), `#!/usr/bin/env bash
echo "${name} $*" >> "$REMOTE_MOUSE_TEST_LOG"
exit 0`);
    }

    const args = [
      'scripts/install-linux.sh', '--wayland', '-y', '--config-dir', configDir,
      '--no-https', '--no-service',
    ];
    const env = {
      ...process.env,
      PATH: `${mockBin}:${process.env.PATH}`,
      REMOTE_MOUSE_TEST_LOG: logPath,
      REMOTE_MOUSE_NPM_PREFIX: prefix,
      XDG_SESSION_TYPE: 'wayland',
    };

    const first = await run('bash', args, {cwd: process.cwd(), env});
    const second = await run('bash', args, {cwd: process.cwd(), env});
    expect(first.code).toBe(0);
    expect(second.code).toBe(0);

    const migratedEnv = await readFile(envPath, 'utf8');
    expect(migratedEnv).toContain(`PORT=4567`);
    expect(migratedEnv).toContain(`SESSION_COOKIE_SECRET=${originalSecret}`);
    expect(migratedEnv).toContain('CUSTOM_SETTING=keep-me');
    expect(migratedEnv.match(/^REMOTE_MOUSE_WAYLAND_INPUT=uinput$/gm)).toHaveLength(1);
    await expect(readFile(databasePath, 'utf8')).resolves.toBe('existing-database');

    const commandLog = await readFile(logPath, 'utf8');
    expect(commandLog).toContain('groupadd --force --system remote-mouse-uinput');
    expect(commandLog).toContain('usermod -a -G remote-mouse-uinput glenn');
    expect(commandLog).toContain('install -o root -g root -m 0644');
    expect(commandLog).toContain('modprobe uinput');
    expect(commandLog).toContain('udevadm control --reload-rules');
  });

  it('linux installer installs npm package, generates HTTPS config and installs service with mocked commands', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'remote-mouse-install-linux-'));
    const mockBin = path.join(root, 'bin');
    const configDir = path.join(root, 'config');
    const prefix = path.join(root, 'npm-prefix');
    const logPath = path.join(root, 'commands.log');
    await import('node:fs/promises').then((fs) => Promise.all([
      fs.mkdir(mockBin, {recursive: true}),
      fs.mkdir(prefix, {recursive: true}),
    ]));

    await writeExecutable(path.join(mockBin, 'node'), `#!/usr/bin/env bash
echo "node $*" >> "$REMOTE_MOUSE_TEST_LOG"
echo "v22.0.0"
`);
    await writeExecutable(path.join(mockBin, 'npm'), `#!/usr/bin/env bash
echo "npm $*" >> "$REMOTE_MOUSE_TEST_LOG"
if [[ "$1 $2 $3" == "config get prefix" ]]; then
  echo "$REMOTE_MOUSE_NPM_PREFIX"
elif [[ "$1" == "--version" ]]; then
  echo "10.0.0"
fi
`);
    await writeExecutable(path.join(mockBin, 'gcc'), `#!/usr/bin/env bash
echo "gcc $*" >> "$REMOTE_MOUSE_TEST_LOG"
exit 0
`);
    await writeExecutable(path.join(mockBin, 'make'), `#!/usr/bin/env bash
echo "make $*" >> "$REMOTE_MOUSE_TEST_LOG"
exit 0
`);
    await writeExecutable(path.join(mockBin, 'wmctrl'), `#!/usr/bin/env bash
echo "wmctrl $*" >> "$REMOTE_MOUSE_TEST_LOG"
exit 0
`);
    await writeExecutable(path.join(mockBin, 'openssl'), `#!/usr/bin/env bash
echo "openssl $*" >> "$REMOTE_MOUSE_TEST_LOG"
if [[ "$1" == "rand" ]]; then
  echo "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
elif [[ "$1" == "req" ]]; then
  while [[ "$#" -gt 0 ]]; do
    case "$1" in
      -keyout) shift; key="$1" ;;
      -out) shift; cert="$1" ;;
    esac
    shift
  done
  mkdir -p "$(dirname "$key")" "$(dirname "$cert")"
  printf "key" > "$key"
  printf "cert" > "$cert"
fi
`);
    await writeExecutable(path.join(mockBin, 'remote-mouse'), `#!/usr/bin/env bash
echo "remote-mouse $*" >> "$REMOTE_MOUSE_TEST_LOG"
exit 0
`);

    const result = await run('bash', [
      'scripts/install-linux.sh',
      '--no-wayland',
      '-y',
      '--config-dir',
      configDir,
      '--port',
      '3210',
    ], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PATH: `${mockBin}:${process.env.PATH}`,
        REMOTE_MOUSE_TEST_LOG: logPath,
        REMOTE_MOUSE_NPM_PREFIX: prefix,
      },
    });

    expect(result).toEqual(expect.objectContaining({code: 0}));
    const commandLog = await readFile(logPath, 'utf8');
    expect(commandLog).toContain('npm install -g @velor/remote-mouse');
    expect(commandLog).toContain('openssl req -x509');
    expect(commandLog).toContain('remote-mouse service install');
    expect(commandLog).toContain('remote-mouse service restart');

    const envFile = await readFile(path.join(configDir, '.env'), 'utf8');
    expect(envFile).toContain('PORT=3210');
    expect(envFile).toContain(`CONFIG_DIR=${configDir}`);
    expect(envFile).toContain('HTTPS=true');
    expect(envFile).toContain(`SSL_KEY_PATH=${path.join(configDir, 'certs', 'remote-mouse.key')}`);
    expect(envFile).toContain(`SSL_CERT_PATH=${path.join(configDir, 'certs', 'remote-mouse.crt')}`);
    expect(envFile).toContain('SESSION_COOKIE_SECRET=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
  });

  it('linux installer skips package manager when dependencies are available outside the OS package manager', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'remote-mouse-install-linux-'));
    const mockBin = path.join(root, 'bin');
    const configDir = path.join(root, 'config');
    const prefix = path.join(root, 'npm-prefix');
    const logPath = path.join(root, 'commands.log');
    await import('node:fs/promises').then((fs) => Promise.all([
      fs.mkdir(mockBin, {recursive: true}),
      fs.mkdir(prefix, {recursive: true}),
    ]));

    for (const name of ['node', 'gcc', 'make', 'wmctrl', 'remote-mouse']) {
      await writeExecutable(path.join(mockBin, name), `#!/usr/bin/env bash
echo "${name} $*" >> "$REMOTE_MOUSE_TEST_LOG"
${name === 'node' ? 'echo "v22.0.0"' : ''}
exit 0
`);
    }
    await writeExecutable(path.join(mockBin, 'npm'), `#!/usr/bin/env bash
echo "npm $*" >> "$REMOTE_MOUSE_TEST_LOG"
if [[ "$1 $2 $3" == "config get prefix" ]]; then echo "$REMOTE_MOUSE_NPM_PREFIX"; fi
if [[ "$1" == "--version" ]]; then echo "10.0.0"; fi
exit 0
`);
    await writeExecutable(path.join(mockBin, 'openssl'), `#!/usr/bin/env bash
echo "openssl $*" >> "$REMOTE_MOUSE_TEST_LOG"
if [[ "$1" == "rand" ]]; then echo "secret"; fi
exit 0
`);
    await writeExecutable(path.join(mockBin, 'apt-get'), `#!/usr/bin/env bash
echo "apt-get $*" >> "$REMOTE_MOUSE_TEST_LOG"
exit 9
`);

    const result = await run('bash', [
      'scripts/install-linux.sh',
      '--no-wayland',
      '-y',
      '--config-dir',
      configDir,
    ], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PATH: `${mockBin}:${process.env.PATH}`,
        REMOTE_MOUSE_TEST_LOG: logPath,
        REMOTE_MOUSE_NPM_PREFIX: prefix,
      },
    });

    expect(result.code).toBe(0);
    const commandLog = await readFile(logPath, 'utf8');
    expect(commandLog).not.toContain('apt-get update');
    expect(commandLog).not.toContain('apt-get install');
  });

  it('linux installer upgrades old apt Node.js with NodeSource', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'remote-mouse-install-linux-'));
    const mockBin = path.join(root, 'bin');
    const configDir = path.join(root, 'config');
    const prefix = path.join(root, 'npm-prefix');
    const logPath = path.join(root, 'commands.log');
    const nodeReadyPath = path.join(root, 'node-ready');
    await import('node:fs/promises').then((fs) => Promise.all([
      fs.mkdir(mockBin, {recursive: true}),
      fs.mkdir(prefix, {recursive: true}),
    ]));

    await writeExecutable(path.join(mockBin, 'node'), `#!/usr/bin/env bash
echo "node $*" >> "$REMOTE_MOUSE_TEST_LOG"
if [[ -f "$REMOTE_MOUSE_NODE_READY" ]]; then
  echo "v22.0.0"
else
  echo "v18.19.1"
fi
`);
    await writeExecutable(path.join(mockBin, 'npm'), `#!/usr/bin/env bash
echo "npm $*" >> "$REMOTE_MOUSE_TEST_LOG"
if [[ "$1 $2 $3" == "config get prefix" ]]; then echo "$REMOTE_MOUSE_NPM_PREFIX"; fi
if [[ "$1" == "--version" ]]; then echo "10.0.0"; fi
exit 0
`);
    await writeExecutable(path.join(mockBin, 'apt-get'), `#!/usr/bin/env bash
echo "apt-get $*" >> "$REMOTE_MOUSE_TEST_LOG"
if [[ "$*" == *"install -y nodejs"* ]]; then touch "$REMOTE_MOUSE_NODE_READY"; fi
exit 0
`);
    await writeExecutable(path.join(mockBin, 'curl'), `#!/usr/bin/env bash
echo "curl $*" >> "$REMOTE_MOUSE_TEST_LOG"
printf "exit 0\\n"
`);
    await writeExecutable(path.join(mockBin, 'sudo'), `#!/usr/bin/env bash
echo "sudo $*" >> "$REMOTE_MOUSE_TEST_LOG"
exec "$@"
`);
    await writeExecutable(path.join(mockBin, 'gcc'), `#!/usr/bin/env bash
echo "gcc $*" >> "$REMOTE_MOUSE_TEST_LOG"
exit 0
`);
    await writeExecutable(path.join(mockBin, 'make'), `#!/usr/bin/env bash
echo "make $*" >> "$REMOTE_MOUSE_TEST_LOG"
exit 0
`);
    await writeExecutable(path.join(mockBin, 'wmctrl'), `#!/usr/bin/env bash
echo "wmctrl $*" >> "$REMOTE_MOUSE_TEST_LOG"
exit 0
`);
    await writeExecutable(path.join(mockBin, 'openssl'), `#!/usr/bin/env bash
echo "openssl $*" >> "$REMOTE_MOUSE_TEST_LOG"
if [[ "$1" == "rand" ]]; then echo "secret"; fi
exit 0
`);
    await writeExecutable(path.join(mockBin, 'remote-mouse'), `#!/usr/bin/env bash
echo "remote-mouse $*" >> "$REMOTE_MOUSE_TEST_LOG"
exit 0
`);

    const result = await run('bash', [
      'scripts/install-linux.sh',
      '--no-wayland',
      '-y',
      '--package',
      root,
      '--config-dir',
      configDir,
      '--no-https',
      '--no-service',
    ], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PATH: `${mockBin}:${process.env.PATH}`,
        REMOTE_MOUSE_TEST_LOG: logPath,
        REMOTE_MOUSE_NPM_PREFIX: prefix,
        REMOTE_MOUSE_NODE_READY: nodeReadyPath,
      },
    });

    expect(result.code).toBe(0);
    const commandLog = await readFile(logPath, 'utf8');
    expect(commandLog).toContain('curl -fsSL https://deb.nodesource.com/setup_22.x');
    expect(commandLog).toContain('apt-get install -y nodejs');
    expect(commandLog).toContain(`npm install -g --install-links ${root}`);
  });

  it('linux installer supports explicit non-interactive HTTPS and service choices', async () => {
    const result = await run('bash', ['scripts/install-linux.sh', '--help'], {
      cwd: process.cwd(),
      env: process.env,
    });

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('--https');
    expect(result.stdout).toContain('--no-https');
    expect(result.stdout).toContain('--generate-cert');
    expect(result.stdout).toContain('--no-generate-cert');
    expect(result.stdout).toContain('--install-service');
    expect(result.stdout).toContain('--no-service');
    expect(result.stdout).toContain('--overwrite-config');
  });

  it('windows installer keeps dependency, npm, HTTPS and service steps separated', async () => {
    const script = await readFile(path.join(process.cwd(), 'scripts/install-windows.ps1'), 'utf8');

    expect(script).toContain('function Ensure-Node');
    expect(script).toContain('function Ensure-BuildTools');
    expect(script).toContain('function Ensure-Python');
    expect(script).toContain('function Install-NpmPackage');
    expect(script).toContain('function Configure-Https');
    expect(script).toContain('function New-CookieSecret');
    expect(script).toContain('SESSION_COOKIE_SECRET=$cookieSecret');
    expect(script).toContain('function Write-EnvFile');
    expect(script).toContain('function Install-Service');
    expect(script).toContain('[switch]$Https');
    expect(script).toContain('[switch]$NoHttps');
    expect(script).toContain('[switch]$InstallService');
    expect(script).toContain('[switch]$NoService');
    expect(script).toContain('Install-NpmPackage');
    expect(script).toContain('remote-mouse service install');
    expect(script).toContain('remote-mouse service restart');
    expect(script).toContain('Browsers will warn about the self-signed certificate');
  });
});
