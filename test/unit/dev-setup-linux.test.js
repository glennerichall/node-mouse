import {chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

describe('Linux development setup', () => {
  const createCommandStub = (directory, name, contents) => {
    const file = path.join(directory, name);
    writeFileSync(file, `#!/bin/sh\n${contents}\n`);
    chmodSync(file, 0o755);
  };

  const createDpkgStub = (directory, foreignArchitecture = 'arm64') => {
    createCommandStub(directory, 'dpkg', `
      case "$1" in
        --print-architecture) printf 'amd64\\n' ;;
        --print-foreign-architectures) printf '${foreignArchitecture}\\n' ;;
        --add-architecture) printf 'dpkg %s\\n' "$*" >> "$REMOTE_MOUSE_TEST_LOG" ;;
      esac
    `);
  };

  const createTeeStub = (directory) => createCommandStub(
    directory,
    'tee',
    'cat >/dev/null; printf "tee %s\\n" "$*" >> "$REMOTE_MOUSE_TEST_LOG"',
  );

  test('help is available without running installation steps', () => {
    const result = spawnSync('bash', ['dev/setup-linux.sh', '--help'], {encoding: 'utf8'});

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Ubuntu/Debian');
    expect(result.stdout).toContain('--check');
    expect(result.stdout).toContain('ARM64');
  });

  test('rejects Node.js older than the supported minimum', () => {
    const fakeBin = mkdtempSync(path.join(os.tmpdir(), 'remote-mouse-dev-setup-'));
    const fakeNode = path.join(fakeBin, 'node');
    writeFileSync(fakeNode, '#!/bin/sh\nprintf "v20.0.0\\n"\n');
    chmodSync(fakeNode, 0o755);

    try {
      const result = spawnSync('bash', ['dev/setup-linux.sh', '--check'], {
        encoding: 'utf8',
        env: {...process.env, PATH: `${fakeBin}:${process.env.PATH}`},
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain('requires Node.js 22 or newer');
    } finally {
      rmSync(fakeBin, {recursive: true, force: true});
    }
  });

  test('installs npm dependencies and builds local helpers when prerequisites exist', () => {
    const fakeBin = mkdtempSync(path.join(os.tmpdir(), 'remote-mouse-dev-setup-'));
    const logFile = path.join(fakeBin, 'commands.log');
    createCommandStub(fakeBin, 'dpkg-query', 'printf "ii 1.0\\n"');
    createDpkgStub(fakeBin);
    createTeeStub(fakeBin);
    createCommandStub(fakeBin, 'apt-get', 'printf "apt-get %s\\n" "$*" >> "$REMOTE_MOUSE_TEST_LOG"');
    createCommandStub(fakeBin, 'npm', 'printf "npm %s\\n" "$*" >> "$REMOTE_MOUSE_TEST_LOG"');
    createCommandStub(fakeBin, 'sudo', 'printf "sudo %s\\n" "$*" >> "$REMOTE_MOUSE_TEST_LOG"; "$@"');

    try {
      const result = spawnSync('bash', ['dev/setup-linux.sh', '--yes'], {
        encoding: 'utf8',
        env: {
          ...process.env,
          PATH: `${fakeBin}:${process.env.PATH}`,
          REMOTE_MOUSE_TEST_LOG: logFile,
          REMOTE_MOUSE_APT_SOURCES_DIR: path.join(fakeBin, 'apt-sources'),
        },
      });

      expect(result.status).toBe(0);
      const loggedCommands = readFileSync(logFile, 'utf8').trim().split('\n');
      expect(loggedCommands.filter((line) => line.startsWith('npm '))).toEqual([
        'npm ci',
        'npm run build:uinput',
        'npm run build:xwayland-pointer',
        'npm run build:xwayland-overlay',
        'npm run build:native:prebuild',
        'npm run build:native:prebuild -- --arch arm64',
      ]);
      expect(result.stdout).toContain('Development environment ready');
    } finally {
      rmSync(fakeBin, {recursive: true, force: true});
    }
  });

  test('installs declared prerequisites and configures the ARM64 cross-build', () => {
    const fakeBin = mkdtempSync(path.join(os.tmpdir(), 'remote-mouse-dev-setup-'));
    const logFile = path.join(fakeBin, 'commands.log');
    createCommandStub(
      fakeBin,
      'dpkg-query',
      'case " $REMOTE_MOUSE_TEST_MISSING " in *" $3 "*) exit 1 ;; esac; printf "ii 1.0\\n"',
    );
    createDpkgStub(fakeBin, '');
    createTeeStub(fakeBin);
    createCommandStub(fakeBin, 'apt-get', 'printf "apt-get %s\\n" "$*" >> "$REMOTE_MOUSE_TEST_LOG"');
    createCommandStub(fakeBin, 'npm', 'printf "npm %s\\n" "$*" >> "$REMOTE_MOUSE_TEST_LOG"');
    createCommandStub(fakeBin, 'sudo', 'printf "sudo %s\\n" "$*" >> "$REMOTE_MOUSE_TEST_LOG"; "$@"');
    try {
      const result = spawnSync('bash', ['dev/setup-linux.sh', '--yes'], {
        encoding: 'utf8',
        env: {
          ...process.env,
          PATH: `${fakeBin}:${process.env.PATH}`,
          REMOTE_MOUSE_TEST_LOG: logFile,
          REMOTE_MOUSE_TEST_MISSING: 'libxtst-dev crossbuild-essential-arm64 libx11-dev:arm64 libpng-dev:arm64',
          REMOTE_MOUSE_APT_SOURCES_DIR: path.join(fakeBin, 'apt-sources'),
        },
      });

      expect(result.status).toBe(0);
      const loggedCommands = readFileSync(logFile, 'utf8');
      expect(loggedCommands).toContain('sudo dpkg --add-architecture arm64');
      expect(loggedCommands).toContain('sudo apt-get install -y --no-install-recommends libxtst-dev crossbuild-essential-arm64 libx11-dev:arm64 libpng-dev:arm64');
      expect(loggedCommands).toContain('sudo apt-get update');
      expect(result.stdout).toContain('crossbuild-essential-arm64');
    } finally {
      rmSync(fakeBin, {recursive: true, force: true});
    }
  });

  test('declares the setup command and keeps native builds explicit', async () => {
    const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
    const script = readFileSync('dev/setup-linux.sh', 'utf8');

    expect(packageJson.scripts['setup:dev:linux']).toBe('bash dev/setup-linux.sh');
    expect(script).toContain('npm ci');
    expect(script).toContain('npm run build:uinput');
    expect(script).toContain('npm run build:xwayland-pointer');
    expect(script).toContain('npm run build:xwayland-overlay');
    expect(script).toContain('build/uinput/remote-mouse-uinput.node');
    expect(script).toContain('build/wayland/remote-mouse-xwayland-pointer.node');
    expect(script).toContain('crossbuild-essential-arm64');
    expect(script).toContain('npm run build:native:prebuild -- --arch arm64');
  });

  test('check mode reports missing ARM64 setup without invoking privileged commands', () => {
    const fakeBin = mkdtempSync(path.join(os.tmpdir(), 'remote-mouse-dev-setup-'));
    const logFile = path.join(fakeBin, 'commands.log');
    writeFileSync(logFile, '');
    createCommandStub(fakeBin, 'dpkg-query', 'printf "ii 1.0\\n"');
    createDpkgStub(fakeBin, '');
    createCommandStub(fakeBin, 'sudo', 'printf "sudo called\\n" >> "$REMOTE_MOUSE_TEST_LOG"');

    try {
      const result = spawnSync('bash', ['dev/setup-linux.sh', '--check'], {
        encoding: 'utf8',
        env: {
          ...process.env,
          PATH: `${fakeBin}:${process.env.PATH}`,
          REMOTE_MOUSE_TEST_LOG: logFile,
          REMOTE_MOUSE_APT_SOURCES_DIR: path.join(fakeBin, 'apt-sources'),
        },
      });

      expect(result.status).toBe(1);
      expect(result.stdout).toContain('ARM64 foreign architecture: missing');
      expect(result.stdout).toContain('Missing native prebuild: prebuilds/linux-arm64');
      expect(readFileSync(logFile, 'utf8')).toBe('');
    } finally {
      rmSync(fakeBin, {recursive: true, force: true});
    }
  });
});
