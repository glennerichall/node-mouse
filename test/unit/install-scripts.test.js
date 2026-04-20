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
    await writeExecutable(path.join(mockBin, 'yad'), `#!/usr/bin/env bash
echo "yad $*" >> "$REMOTE_MOUSE_TEST_LOG"
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

    for (const name of ['node', 'gcc', 'make', 'wmctrl', 'yad', 'remote-mouse']) {
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

  it('windows installer keeps dependency, npm, HTTPS and service steps separated', async () => {
    const script = await readFile(path.join(process.cwd(), 'scripts/install-windows.ps1'), 'utf8');

    expect(script).toContain('function Ensure-Node');
    expect(script).toContain('function Ensure-BuildTools');
    expect(script).toContain('function Ensure-Python');
    expect(script).toContain('function Install-NpmPackage');
    expect(script).toContain('function Configure-Https');
    expect(script).toContain('function Write-EnvFile');
    expect(script).toContain('function Install-Service');
    expect(script).toContain('Install-NpmPackage');
    expect(script).toContain('remote-mouse service install');
    expect(script).toContain('remote-mouse service restart');
    expect(script).toContain('Browsers will warn about the self-signed certificate');
  });
});
