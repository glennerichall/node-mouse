import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {runSetup} from '../../server/term/cli/setupCommand.js';
import {parseCliArgs} from '../../server/term/cli/parseCliArgs.js';
import {createSetupStrategy} from '../../server/term/cli/setup/strategies/index.js';
import {createLinuxSetupStrategy} from '../../server/term/cli/setup/strategies/linux.js';
import {createWindowsSetupStrategy} from '../../server/term/cli/setup/strategies/windows.js';

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
    // Windows does not expose POSIX mode bits through statSync; the Linux
    // strategy's private permissions are asserted on POSIX runners only.
    if (process.platform !== 'win32') {
      expect(fs.statSync(envFile).mode & 0o777).toBe(0o600);
      expect(fs.statSync(path.dirname(envFile)).mode & 0o777).toBe(0o700);
    }

    await runSetup(options);
    expect(fs.readFileSync(envFile, 'utf8')).toBe(initial);
  });

  it('repeats the full Linux setup without changing config and passes stable service inputs', async () => {
    const configDir = path.join(root, 'config');
    const envFile = path.join(configDir, '.env');
    const serviceInstalls = [];
    const setupOptions = {
      platform: 'linux',
      nodeVersion: '24.1.0',
      homeDir: root,
      env: {CONFIG_DIR: configDir, USER: 'dev'},
      options: {yes: true},
      output: createOutput().stream,
      errorOutput: createOutput().stream,
      dependencies: {
        runPrerequisiteCommand: async () => ({ok: true}),
        runServiceInstall: async (configEnv) => {
          serviceInstalls.push(configEnv);
          return {ok: true};
        },
      },
    };

    const first = await runSetup(setupOptions);
    const initialConfig = fs.readFileSync(envFile, 'utf8');
    const second = await runSetup(setupOptions);

    expect(first).toMatchObject({ok: true, serviceInstalled: true});
    expect(second).toMatchObject({ok: true, serviceInstalled: true});
    expect(fs.readFileSync(envFile, 'utf8')).toBe(initialConfig);
    expect(initialConfig.match(/^SESSION_COOKIE_SECRET=.+$/m)?.[0]).toBeTruthy();
    expect(serviceInstalls).toEqual([
      {CONFIG_DIR: configDir, ENV_FILE_PATH: envFile},
      {CONFIG_DIR: configDir, ENV_FILE_PATH: envFile},
    ]);
  });

  it('prepares configuration but declines optional host changes without a TTY', async () => {
    const configDir = path.join(root, 'config');
    let serviceInstallCount = 0;
    let uinputSetupCount = 0;
    const output = createOutput();
    const result = await runSetup({
      platform: 'linux',
      nodeVersion: '24.1.0',
      homeDir: root,
      env: {CONFIG_DIR: configDir, XDG_SESSION_TYPE: 'wayland', USER: 'dev'},
      options: {},
      input: {isTTY: false},
      output: output.stream,
      errorOutput: output.stream,
      dependencies: {
        runServiceInstall: async () => { serviceInstallCount += 1; return {ok: true}; },
        runUinputSetup: () => { uinputSetupCount += 1; return {ok: true}; },
      },
    });

    expect(result).toMatchObject({ok: true, serviceInstalled: false});
    expect(fs.existsSync(path.join(configDir, '.env'))).toBe(true);
    expect(serviceInstallCount).toBe(0);
    expect(uinputSetupCount).toBe(0);
    expect(output.value()).toContain('Service not installed.');
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
        runPrerequisiteCommand: async () => ({ok: true}),
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

  it('preserves Windows configuration and secrets when setup is repeated', async () => {
    const configDir = path.join(root, 'Roaming', 'remote-mouse');
    const env = {APPDATA: path.dirname(configDir)};
    const installCalls = [];
    const setupOptions = {
      platform: 'win32',
      nodeVersion: '24.1.0',
      homeDir: root,
      env,
      options: {yes: true},
      output: createOutput().stream,
      errorOutput: createOutput().stream,
      dependencies: {
        runPrerequisiteCommand: async () => ({ok: true}),
        runServiceInstall: async (configEnv) => {
          installCalls.push(configEnv);
          return {ok: true};
        },
      },
    };

    const first = await runSetup(setupOptions);
    const firstConfig = fs.readFileSync(path.join(configDir, '.env'), 'utf8');
    const secret = firstConfig.match(/^SESSION_COOKIE_SECRET=(.+)$/m)?.[1];
    fs.appendFileSync(path.join(configDir, '.env'), 'CUSTOM_SETTING=keep-me\n');
    const updatedConfig = fs.readFileSync(path.join(configDir, '.env'), 'utf8');
    const second = await runSetup(setupOptions);

    expect(first).toMatchObject({ok: true, serviceInstalled: true});
    expect(second).toMatchObject({ok: true, serviceInstalled: true});
    expect(fs.readFileSync(path.join(configDir, '.env'), 'utf8')).toBe(updatedConfig);
    expect(updatedConfig).toContain(`SESSION_COOKIE_SECRET=${secret}`);
    expect(installCalls).toEqual([
      {CONFIG_DIR: configDir, ENV_FILE_PATH: path.join(configDir, '.env')},
      {CONFIG_DIR: configDir, ENV_FILE_PATH: path.join(configDir, '.env')},
    ]);
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
        runPrerequisiteCommand: async () => ({ok: true}),
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
        runPrerequisiteCommand: async () => ({ok: true}),
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

  it('installs the GNOME focus extension during setup on GNOME Wayland', async () => {
    const extensionInstalls = [];
    const result = await runSetup({
      platform: 'linux',
      nodeVersion: '24.1.0',
      homeDir: root,
      env: {
        CONFIG_DIR: path.join(root, 'config'),
        XDG_SESSION_TYPE: 'wayland',
        XDG_CURRENT_DESKTOP: 'GNOME',
        USER: 'dev',
      },
      options: {yes: true, noService: true},
      output: createOutput().stream,
      errorOutput: createOutput().stream,
      dependencies: {
        runPrerequisiteCommand: async () => ({ok: true}),
        runGnomeFocusInstall: async (request) => {
          extensionInstalls.push(request);
          return {ok: true, message: 'GNOME focus enabled.'};
        },
      },
    });

    expect(result).toMatchObject({ok: true, serviceInstalled: false});
    expect(extensionInstalls).toEqual([{homeDir: root, env: expect.objectContaining({XDG_CURRENT_DESKTOP: 'GNOME'})}]);
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
      expect(output.value()).toContain('Node.js 22.14.0');
  });

  it('rejects an invalid configuration target before host changes or writes', async () => {
    const configPath = path.join(root, 'not-a-directory');
    fs.writeFileSync(configPath, 'keep me');
    const calls = [];
    const strategy = {
      name: 'test-host',
      prepareConfigDir: () => calls.push('prepare-config'),
      validatePrerequisites: async () => { calls.push('validate-host'); return ''; },
      configureHost: async () => { calls.push('configure-host'); return {ok: true}; },
    };
    const output = createOutput();

    const result = await runSetup({
      platform: 'custom',
      nodeVersion: '24.1.0',
      homeDir: root,
      configDir: configPath,
      options: {yes: true},
      dependencies: {setupStrategy: strategy},
      output: output.stream,
      errorOutput: output.stream,
    });

    expect(result).toMatchObject({ok: false, message: expect.stringContaining('not a directory')});
    expect(calls).toEqual([]);
    expect(fs.readFileSync(configPath, 'utf8')).toBe('keep me');
  });

  it('rejects an invalid explicit port before creating configuration', async () => {
    const configDir = path.join(root, 'config');
    const output = createOutput();
    const result = await runSetup({
      platform: 'linux',
      nodeVersion: '24.1.0',
      homeDir: root,
      options: {port: 0, noService: true},
      dependencies: {runPrerequisiteCommand: async () => ({ok: true})},
      output: output.stream,
      errorOutput: output.stream,
    });

    expect(result).toMatchObject({ok: false, message: 'Port must be an integer between 1 and 65535.'});
    expect(fs.existsSync(configDir)).toBe(false);
  });

  it('checks requested host capabilities before writing initial configuration', async () => {
    const configDir = path.join(root, 'config');
    const calls = [];
    const strategy = {
      name: 'test-host',
      getDefaultConfigDir: () => configDir,
      validatePrerequisites: async (request) => {
        calls.push(request);
        return 'The requested host service manager is unavailable.';
      },
      prepareConfigDir: () => calls.push('prepare-config'),
      configureHost: async () => { calls.push('configure-host'); return {ok: true}; },
    };
    const output = createOutput();

    const result = await runSetup({
      platform: 'custom',
      nodeVersion: '24.1.0',
      homeDir: root,
      options: {yes: true},
      dependencies: {setupStrategy: strategy},
      output: output.stream,
      errorOutput: output.stream,
    });

    expect(result).toMatchObject({ok: false, message: expect.stringContaining('service manager')});
    expect(calls).toEqual([{installService: true, configureUinput: false, configureGnomeFocus: false, env: process.env}]);
    expect(fs.existsSync(configDir)).toBe(false);
    expect(output.value()).toContain('service manager is unavailable');
  });

  it('validates Linux service and uinput capabilities only when requested', async () => {
    const commandCalls = [];
    const linux = createLinuxSetupStrategy({dependencies: {
      runPrerequisiteCommand: async (command, args) => {
        commandCalls.push([command, args]);
        return {ok: true};
      },
    }});
    const env = {XDG_SESSION_TYPE: 'wayland', USER: 'dev'};

    expect(await linux.validatePrerequisites({installService: false, configureUinput: false, env})).toBe('');
    expect(commandCalls).toEqual([]);
    expect(await linux.validatePrerequisites({installService: true, configureUinput: true, env})).toBe('');
    expect(commandCalls).toEqual([
      ['systemctl', ['--user', 'show-environment']],
      ['pkexec', ['--version']],
    ]);
  });

  it('validates Windows Task Scheduler before a requested service installation', async () => {
    const commandCalls = [];
    const windows = createWindowsSetupStrategy({dependencies: {
      runPrerequisiteCommand: async (command, args) => {
        commandCalls.push([command, args]);
        return {ok: false};
      },
    }});

    expect(await windows.validatePrerequisites({installService: false})).toBe('');
    expect(await windows.validatePrerequisites({installService: true})).toContain('Task Scheduler');
    expect(commandCalls).toEqual([['schtasks', ['/Query', '/FO', 'LIST']]]);
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
