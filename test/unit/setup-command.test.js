import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {runSetup} from '../../server/term/cli/setupCommand.js';
import {parseCliArgs} from '../../server/term/cli/parseCliArgs.js';
import {createSetupStrategy} from '../../server/term/cli/setup/strategies/index.js';

function createOutput() {
  let value = '';
  return {stream: {write: (chunk) => { value += chunk; }}, value: () => value};
}

describe('remote-mouse setup command', () => {
  let root;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'remote-mouse-setup-'));
  });

  afterEach(() => fs.rmSync(root, {recursive: true, force: true}));

  it('selects a host strategy and keeps OS-specific configuration inside it', async () => {
    const linux = await createSetupStrategy('linux');
    const windows = await createSetupStrategy('win32');

    expect(linux.name).toBe('linux');
    expect(linux.getConfigDefaults()).toEqual({
      SERVICE_NAME: 'remote-mouse.service',
      REMOTE_MOUSE_WAYLAND_INPUT: 'uinput',
    });
    expect(windows.name).toBe('windows');
    expect(windows.getConfigDefaults()).toEqual({SERVICE_NAME: 'remote-mouse'});
    expect(await createSetupStrategy('darwin')).toBeNull();
  });

  it('runs the generic setup algorithm through the selected host strategy', async () => {
    const events = [];
    const strategy = {
      name: 'test-host',
      configFileMode: 0o600,
      getDefaultConfigDir: () => path.join(root, 'config'),
      getConfigDefaults: () => ({SERVICE_NAME: 'test-service'}),
      prepareConfigDir: (configDir) => fs.mkdirSync(configDir, {recursive: true}),
      secureConfigFile: () => {},
      configureHost: async () => { events.push('configure-host'); return {ok: true}; },
      installService: async () => { events.push('install-service'); return {ok: true}; },
    };
    const result = await runSetup({
      platform: 'custom',
      nodeVersion: '24.1.0',
      homeDir: root,
      options: {yes: true},
      dependencies: {setupStrategy: strategy},
      output: createOutput().stream,
      errorOutput: createOutput().stream,
    });

    expect(result).toMatchObject({ok: true, serviceInstalled: true});
    expect(events).toEqual(['configure-host', 'install-service']);
    expect(fs.readFileSync(path.join(root, 'config', '.env'), 'utf8')).toContain('SERVICE_NAME=test-service');
  });

  it('creates a private initial config with a production-safe secret and preserves it on rerun', async () => {
    const output = createOutput();
    const envFile = path.join(root, 'config', '.env');
    const options = {
      platform: 'linux',
      nodeVersion: '24.1.0',
      homeDir: root,
      env: {CONFIG_DIR: path.dirname(envFile)},
      options: {noService: true},
      output: output.stream,
      errorOutput: output.stream,
    };

    expect((await runSetup(options)).ok).toBe(true);
    const initial = fs.readFileSync(envFile, 'utf8');
    const secret = initial.match(/^SESSION_COOKIE_SECRET=(.+)$/m)?.[1];
    expect(secret).toHaveLength(64);
    expect(initial).toContain(`PERSISTENCE_DB_PATH=${path.join(root, 'config', 'remote-mouse.sqlite3')}`);
    expect(initial).toContain('REMOTE_MOUSE_WAYLAND_INPUT=uinput');
    expect(fs.statSync(envFile).mode & 0o777).toBe(0o600);
    expect(fs.statSync(path.dirname(envFile)).mode & 0o777).toBe(0o700);

    await runSetup(options);
    expect(fs.readFileSync(envFile, 'utf8')).toBe(initial);
  });

  it('adds only missing defaults to an existing config and installs service with its config path', async () => {
    const configDir = path.join(root, 'config');
    const envFile = path.join(configDir, '.env');
    fs.mkdirSync(configDir, {recursive: true});
    fs.writeFileSync(envFile, 'PORT=4567\nSESSION_COOKIE_SECRET=keep-this-secret\nCUSTOM=value\n');
    let installedWith;

    const result = await runSetup({
      platform: 'win32',
      nodeVersion: '24.1.0',
      homeDir: root,
      env: {CONFIG_DIR: configDir},
      options: {yes: true},
      output: createOutput().stream,
      errorOutput: createOutput().stream,
      dependencies: {
        runServiceInstall: async (configEnv) => {
          installedWith = configEnv;
          return {ok: true};
        },
      },
    });

    const contents = fs.readFileSync(envFile, 'utf8');
    expect(result).toMatchObject({ok: true, serviceInstalled: true});
    expect(installedWith).toEqual({CONFIG_DIR: configDir, ENV_FILE_PATH: envFile});
    expect(contents).toContain('PORT=4567');
    expect(contents).toContain('SESSION_COOKIE_SECRET=keep-this-secret');
    expect(contents).toContain('CUSTOM=value');
    expect(contents).toContain('SERVICE_NAME=remote-mouse');
    expect(contents).not.toContain('REMOTE_MOUSE_WAYLAND_INPUT=');
  });

  it('uses the Windows roaming profile when no config directory is supplied', async () => {
    const result = await runSetup({
      platform: 'win32',
      nodeVersion: '24.1.0',
      homeDir: root,
      env: {APPDATA: path.join(root, 'Roaming')},
      options: {noService: true},
      output: createOutput().stream,
      errorOutput: createOutput().stream,
    });
    expect(result.configDir).toBe(path.join(root, 'Roaming', 'remote-mouse'));
    expect(fs.existsSync(path.join(result.configDir, '.env'))).toBe(true);
  });

  it('fills an empty cookie-secret setting without duplicating its key', async () => {
    const configDir = path.join(root, 'config');
    fs.mkdirSync(configDir, {recursive: true});
    fs.writeFileSync(path.join(configDir, '.env'), 'SESSION_COOKIE_SECRET=\n');
    await runSetup({
      platform: 'linux',
      nodeVersion: '24.1.0',
      homeDir: root,
      env: {CONFIG_DIR: configDir},
      options: {noService: true},
      output: createOutput().stream,
      errorOutput: createOutput().stream,
    });
    const contents = fs.readFileSync(path.join(configDir, '.env'), 'utf8');
    expect(contents.match(/^SESSION_COOKIE_SECRET=.+$/gm)).toHaveLength(1);
    expect(contents).not.toMatch(/^SESSION_COOKIE_SECRET=$/m);
  });

  it('replaces the unsafe example cookie secret but keeps real existing secrets', async () => {
    const configDir = path.join(root, 'config');
    fs.mkdirSync(configDir, {recursive: true});
    fs.writeFileSync(path.join(configDir, '.env'), 'SESSION_COOKIE_SECRET=change-me\n');
    await runSetup({
      platform: 'linux',
      nodeVersion: '24.1.0',
      homeDir: root,
      env: {CONFIG_DIR: configDir},
      options: {noService: true},
      output: createOutput().stream,
      errorOutput: createOutput().stream,
    });
    const contents = fs.readFileSync(path.join(configDir, '.env'), 'utf8');
    expect(contents).not.toContain('SESSION_COOKIE_SECRET=change-me');
    expect(contents.match(/^SESSION_COOKIE_SECRET=.+$/gm)).toHaveLength(1);
  });

  it('does not install the privileged uinput rule unless explicitly requested', async () => {
    let permissionSetupCount = 0;
    const output = createOutput();
    await runSetup({
      platform: 'linux',
      nodeVersion: '24.1.0',
      homeDir: root,
      env: {CONFIG_DIR: path.join(root, 'config'), XDG_SESSION_TYPE: 'wayland', USER: 'dev'},
      options: {yes: true},
      output: output.stream,
      errorOutput: output.stream,
      dependencies: {
        runUinputSetup: () => { permissionSetupCount += 1; return {ok: true}; },
        runServiceInstall: async () => ({ok: true}),
      },
    });
    expect(permissionSetupCount).toBe(0);

    await runSetup({
      platform: 'linux',
      nodeVersion: '24.1.0',
      homeDir: root,
      env: {CONFIG_DIR: path.join(root, 'config'), XDG_SESSION_TYPE: 'wayland', USER: 'dev'},
      options: {yes: true, configureUinput: true},
      output: output.stream,
      errorOutput: output.stream,
      dependencies: {
        runUinputSetup: (username) => {
          permissionSetupCount += 1;
          expect(username).toBe('dev');
          return {ok: true};
        },
        runServiceInstall: async () => ({ok: true}),
      },
    });
    expect(permissionSetupCount).toBe(1);
  });

  it('rejects unsupported runtimes before writing configuration', async () => {
    const output = createOutput();
    const result = await runSetup({
      platform: 'linux',
      nodeVersion: '18.20.0',
      homeDir: root,
      env: {CONFIG_DIR: path.join(root, 'config')},
      output: output.stream,
      errorOutput: output.stream,
    });
    expect(result.ok).toBe(false);
    expect(fs.existsSync(path.join(root, 'config'))).toBe(false);
    expect(output.value()).toContain('Node.js 20');
  });

  it('parses setup choices as local CLI options', () => {
    expect(parseCliArgs(['setup', '--yes', '--no-service', '--configure-uinput', '--config-dir', '/tmp/rm', '--port', '4567'])).toMatchObject({
      command: {name: 'setup'},
      options: {setup: {
        yes: true,
        noService: true,
        configureUinput: true,
        configDir: '/tmp/rm',
        port: 4567,
      }},
    });
  });
});
