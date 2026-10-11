import {jest} from '@jest/globals';
import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {buildNpmGlobalUpdatePlan} from '../../server/services/update-manager/buildNpmGlobalUpdatePlan.js';

const execFileAsync = jest.fn();
const execShell = jest.fn();
const chooseUpdateCheckSource = jest.fn();
const chooseUpdateInstallSource = jest.fn();
const logger = {
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
};
const createLogger = jest.fn(() => logger);

jest.unstable_mockModule('../../server/services/update-manager/chooseUpdateCheckSource.js', () => ({
  chooseUpdateCheckSource,
}));

jest.unstable_mockModule('../../server/services/update-manager/chooseUpdateInstallSource.js', () => ({
  chooseUpdateInstallSource,
}));

jest.unstable_mockModule('../../server/utils/process.js', () => ({
  execFileAsync,
  execShell,
  spawnDetached: jest.fn(),
}));

jest.unstable_mockModule('../../server/application/logger.js', () => ({
  createLogger,
}));

const {
  createUpdateManager,
} = await import('../../server/services/update-manager/createUpdateManager.js');
const {resolveInstallUpdateCommand} = await import('../../server/services/update-manager/resolveInstallUpdateCommand.js');

function createServices({
  config = {updateCheck: {enabled: true}},
  systemConfig = {
    updateCheck: {
      packageName: '@velor/remote-mouse',
      currentVersion: '6.19.64',
    },
  },
  events = {publishState: jest.fn()},
} = {}) {
  return {
    getConfig: () => config,
    getSystemConfig: () => systemConfig,
    getEvents: () => events,
  };
}

describe('createUpdateManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-25T16:30:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('skips the check when update checks are disabled', async () => {
    const events = {publishState: jest.fn()};
    const updateManager = createUpdateManager(createServices({
      config: {updateCheck: {enabled: false}},
      events,
    }));

    await expect(updateManager.check()).resolves.toEqual({
      checked: true,
      hasUpdate: false,
    });

    expect(chooseUpdateCheckSource).not.toHaveBeenCalled();
    expect(events.publishState).toHaveBeenCalledWith('update-manager', {
      enabled: false,
      lastKey: '',
      lastInstallCommand: '',
      lastResult: {
        checked: true,
        hasUpdate: false,
        skipped: true,
        checkedAt: '2026-04-25T16:30:00.000Z',
      },
    }, {
      type: 'update.check',
    });
  });

  it('checks npm when a manual check is forced while automatic checks are disabled', async () => {
    const check = jest.fn(async () => ({
      hasUpdate: true,
      key: 'npm:6.7.0',
      title: 'Mise a jour disponible',
      message: 'Version 6.7.0 disponible.',
    }));
    chooseUpdateCheckSource.mockReturnValue(check);
    const updateManager = createUpdateManager(createServices({
      config: {updateCheck: {enabled: false}},
    }));

    await expect(updateManager.check({force: true})).resolves.toEqual({
      checked: true,
      hasUpdate: true,
      key: 'npm:6.7.0',
    });

    expect(check).toHaveBeenCalledTimes(1);
  });

  it('publishes an available update when the source detects one', async () => {
    const events = {publishState: jest.fn()};
    const check = jest.fn(async () => ({
      hasUpdate: true,
      key: 'npm:6.5.0',
      currentVersion: '6.4.10',
      latestVersion: '6.5.0',
      title: 'Mise a jour disponible',
      message: 'Version 6.5.0 disponible.',
      ttlMs: 9000,
    }));
    chooseUpdateCheckSource.mockReturnValue(check);
    const updateManager = createUpdateManager(createServices({events}));

    await expect(updateManager.check()).resolves.toEqual({
      checked: true,
      hasUpdate: true,
      key: 'npm:6.5.0',
    });

    expect(chooseUpdateCheckSource).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({
      source: 'npm',
      packageName: '@velor/remote-mouse',
      installedVersion: expect.any(String),
      currentVersion: '6.4.10',
      latestVersion: '6.5.0',
      updateAvailable: true,
    }), 'Update check completed');
    expect(events.publishState).toHaveBeenCalledWith('update-manager', {
      enabled: true,
      lastKey: 'npm:6.5.0',
      lastInstallCommand: '',
      lastResult: {
        checked: true,
        hasUpdate: true,
        key: 'npm:6.5.0',
        title: 'Mise a jour disponible',
        message: 'Version 6.5.0 disponible.',
        ttlMs: 9000,
        checkedAt: '2026-04-25T16:30:00.000Z',
      },
    }, {
      type: 'update.available',
    });
  });

  it('suppresses duplicate update keys on subsequent checks', async () => {
    const events = {publishState: jest.fn()};
    const check = jest.fn(async () => ({
      hasUpdate: true,
      key: 'npm:6.5.0',
      title: 'Mise a jour disponible',
      message: 'Version 6.5.0 disponible.',
    }));
    chooseUpdateCheckSource.mockReturnValue(check);
    const updateManager = createUpdateManager(createServices({events}));

    await updateManager.check();
    await expect(updateManager.check()).resolves.toEqual({
      checked: true,
      hasUpdate: false,
    });

    expect(logger.debug).toHaveBeenLastCalledWith({
      duplicateKey: true,
      hasUpdate: true,
      key: 'npm:6.5.0',
    }, 'Update check: no update');
    expect(events.publishState).toHaveBeenLastCalledWith('update-manager', {
      enabled: true,
      lastKey: 'npm:6.5.0',
      lastInstallCommand: '',
      lastResult: {
        checked: true,
        hasUpdate: false,
        checkedAt: '2026-04-25T16:30:00.000Z',
      },
    }, {
      type: 'update.check',
    });
  });

  it('reports an already known update during a forced manual check', async () => {
    const check = jest.fn(async () => ({
      hasUpdate: true,
      key: 'npm:6.7.0',
      title: 'Mise a jour disponible',
      message: 'Version 6.7.0 disponible.',
    }));
    chooseUpdateCheckSource.mockReturnValue(check);
    const updateManager = createUpdateManager(createServices());

    await updateManager.check();

    await expect(updateManager.check({force: true})).resolves.toEqual({
      checked: true,
      hasUpdate: true,
      key: 'npm:6.7.0',
    });
  });

  it('publishes an error state when the source throws', async () => {
    const events = {publishState: jest.fn()};
    const error = new Error('boom');
    chooseUpdateCheckSource.mockReturnValue(async () => {
      throw error;
    });
    const updateManager = createUpdateManager(createServices({events}));

    await expect(updateManager.check()).resolves.toEqual({
      checked: false,
      hasUpdate: false,
    });

    expect(logger.error).toHaveBeenCalledWith({err: error}, 'Update check: error');
    expect(events.publishState).toHaveBeenCalledWith('update-manager', {
      enabled: true,
      lastKey: '',
      lastInstallCommand: '',
      lastResult: {
        checked: false,
        hasUpdate: false,
        checkedAt: '2026-04-25T16:30:00.000Z',
        error: 'boom',
      },
    }, {
      type: 'update.error',
    });
  });

  it('delegates install execution and logs the resolved command', async () => {
    chooseUpdateCheckSource.mockReturnValue(async () => ({
      hasUpdate: true,
      key: 'npm:6.5.0',
      currentVersion: '6.4.10',
      latestVersion: '6.5.0',
    }));
    const install = jest.fn(async ({targetVersion, onStage}) => {
      expect(targetVersion).toBe('6.5.0');
      onStage({stage: 'verified', registryOrigin: 'https://registry.npmjs.org', integrity: 'sha512'});
      return {
        ok: true,
        status: 'completed',
        command: 'npm update -g remote-mouse --force',
      };
    });
    install.command = 'npm update -g remote-mouse --force';
    chooseUpdateInstallSource.mockReturnValue(install);
    const updateManager = createUpdateManager(createServices());
    await updateManager.check();

    await expect(updateManager.update()).resolves.toEqual({
      ok: true,
      status: 'completed',
      command: 'npm update -g remote-mouse --force',
    });

    expect(chooseUpdateInstallSource).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({
      packageName: '@velor/remote-mouse',
      currentVersion: expect.any(String),
      targetVersion: '6.5.0',
      installCommand: 'npm update -g remote-mouse --force',
    }), 'Executing update install command');
    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({
      packageName: '@velor/remote-mouse',
      currentVersion: expect.any(String),
      targetVersion: '6.5.0',
      installedVersion: expect.any(String),
    }), 'Update install completed successfully');
    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({
      packageName: '@velor/remote-mouse',
      targetVersion: '6.5.0',
      stage: 'verified',
      registryOrigin: 'https://registry.npmjs.org',
      integrity: 'sha512',
    }), 'Update install: verified');
  });
});

describe('buildNpmGlobalUpdatePlan', () => {
  it('describes the verified download and activation flow', () => {
    expect(buildNpmGlobalUpdatePlan('@velor/remote-mouse')).toEqual({
      packageName: '@velor/remote-mouse',
      displayCommand: "npm pack '@velor/remote-mouse'@<target> -> verify SHA-512 -> npm install -g <verified tarball>",
    });
  });

  it('rejects package names that could become shell syntax', () => {
    expect(buildNpmGlobalUpdatePlan('remote-mouse && whoami')).toBeNull();
  });
});

describe('resolveInstallUpdateCommand', () => {
  const getSystemConfig = (updateCheck = {}) => ({updateCheck: {
    packageName: '@velor/remote-mouse',
    installTimeoutSec: 45,
    ...updateCheck,
  }});

  beforeEach(() => {
    execFileAsync.mockReset().mockResolvedValue({ok: true, stdout: '', stderr: ''});
    execShell.mockReset().mockResolvedValue({ok: true, stdout: '', stderr: ''});
  });

  it('downloads, verifies, then activates a pinned npm artifact on Linux', async () => {
    const archive = Buffer.from('verified package archive');
    const integrity = `sha512-${createHash('sha512').update(archive).digest('base64')}`;
    const filename = 'velor-remote-mouse-6.20.0.tgz';
    const stages = [];
    execFileAsync.mockImplementation(async (command, args, options) => {
      if (args[0] === 'config') return {ok: true, stdout: 'https://registry.npmjs.org/\n', stderr: ''};
      if (args[0] === 'view') {
        return {ok: true, stdout: JSON.stringify({version: '6.20.0', dist: {
          integrity,
          tarball: 'https://registry.npmjs.org/@velor/remote-mouse/-/remote-mouse-6.20.0.tgz',
        }}), stderr: ''};
      }
      if (args[0] === 'pack') {
        await fs.writeFile(path.join(options.cwd, filename), archive);
        return {ok: true, stdout: JSON.stringify([{name: '@velor/remote-mouse', version: '6.20.0', filename}]), stderr: ''};
      }
      return {ok: true, stdout: '', stderr: ''};
    });
    const install = resolveInstallUpdateCommand({getSystemConfig, platform: 'linux'});

    await expect(install({targetVersion: '6.20.0', onStage: (stage) => stages.push(stage.stage)})).resolves.toMatchObject({
      ok: true, status: 'completed', targetVersion: '6.20.0', integrity: 'sha512',
    });
    const calls = execFileAsync.mock.calls;
    expect(calls.map(([, args]) => args)).toEqual([
      ['config', 'get', 'registry'],
      ['view', '@velor/remote-mouse@6.20.0', 'version', 'dist.integrity', 'dist.tarball', '--json', '--registry=https://registry.npmjs.org/'],
      ['pack', '@velor/remote-mouse@6.20.0', '--json', '--registry=https://registry.npmjs.org/'],
      ['install', '-g', filename, '--registry=https://registry.npmjs.org/'],
    ]);
    expect(calls[1][2].cwd).toBe(calls[2][2].cwd);
    expect(calls[2][2].cwd).toBe(calls[3][2].cwd);
    expect(calls[3][2].env.REMOTE_MOUSE_DAEMON).toBe('1');
    expect(stages).toEqual(['resolving-registry', 'resolving', 'downloading', 'verified', 'activating', 'activated']);
    expect(execShell).not.toHaveBeenCalled();
  });

  it('uses cmd.exe for the verified npm stages on Windows', async () => {
    const archive = Buffer.from('verified package archive');
    const integrity = `sha512-${createHash('sha512').update(archive).digest('base64')}`;
    const filename = 'velor-remote-mouse-6.20.0.tgz';
    execFileAsync.mockImplementation(async (_command, args, options) => {
      const npmArgs = args[3].split(' ');
      if (npmArgs[0] === 'npm' && npmArgs[1] === 'config') {
        return {ok: true, stdout: 'https://registry.npmjs.org/\n', stderr: ''};
      }
      if (npmArgs[0] === 'npm' && npmArgs[1] === 'view') {
        return {ok: true, stdout: JSON.stringify({version: '6.20.0', 'dist.integrity': integrity, 'dist.tarball': 'https://registry.npmjs.org/@velor/remote-mouse/-/remote-mouse-6.20.0.tgz'}), stderr: ''};
      }
      if (npmArgs[0] === 'npm' && npmArgs[1] === 'pack') {
        await fs.writeFile(path.join(options.cwd, filename), archive);
        return {ok: true, stdout: JSON.stringify([{name: '@velor/remote-mouse', version: '6.20.0', filename}]), stderr: ''};
      }
      return {ok: true, stdout: '', stderr: ''};
    });
    const install = resolveInstallUpdateCommand({getSystemConfig, platform: 'win32'});

    await expect(install({targetVersion: '6.20.0'})).resolves.toMatchObject({ok: true, status: 'completed'});
    expect(execFileAsync.mock.calls.map(([command]) => command)).toEqual(['cmd.exe', 'cmd.exe', 'cmd.exe', 'cmd.exe']);
    expect(execFileAsync.mock.calls.map(([, args]) => args[3])).toEqual([
      'npm config get registry',
      'npm view @velor/remote-mouse@6.20.0 version dist.integrity dist.tarball --json --registry=https://registry.npmjs.org/',
      'npm pack @velor/remote-mouse@6.20.0 --json --registry=https://registry.npmjs.org/',
      `npm install -g ${filename} --registry=https://registry.npmjs.org/`,
    ]);
    expect(execShell).not.toHaveBeenCalled();
  });

  it('keeps explicitly configured installation commands on the custom shell path', async () => {
    const install = resolveInstallUpdateCommand({
      getSystemConfig: () => getSystemConfig({installCommand: 'npm update -g custom-package'}),
      platform: 'win32',
    });

    await expect(install()).resolves.toMatchObject({ok: true, status: 'completed'});
    expect(execShell).toHaveBeenCalledWith('npm update -g custom-package', 45_000);
    expect(execFileAsync).not.toHaveBeenCalled();
  });

  it('fails clearly when the configured package name is not safe to invoke', async () => {
    const install = resolveInstallUpdateCommand({
      getSystemConfig: () => getSystemConfig({packageName: 'remote-mouse & whoami'}),
      platform: 'win32',
    });

    await expect(install()).resolves.toMatchObject({ok: false, status: 'invalid-package-name'});
    expect(execFileAsync).not.toHaveBeenCalled();
    expect(execShell).not.toHaveBeenCalled();
  });

  it('returns process failures with diagnostic output', async () => {
    execFileAsync.mockResolvedValue({ok: false, stdout: '', stderr: 'registry unavailable'});
    const install = resolveInstallUpdateCommand({getSystemConfig, platform: 'win32'});

    await expect(install()).resolves.toMatchObject({
      ok: false,
      status: 'registry-resolution-failed',
      details: 'registry unavailable',
    });
  });

  it('refuses to activate a tarball that does not match registry integrity metadata', async () => {
    const actual = Buffer.from('altered package archive');
    const expected = `sha512-${createHash('sha512').update('expected archive').digest('base64')}`;
    execFileAsync.mockImplementation(async (_command, args, options) => {
      if (args[0] === 'config') return {ok: true, stdout: 'https://registry.npmjs.org/', stderr: ''};
      if (args[0] === 'view') {
        return {ok: true, stdout: JSON.stringify({version: '6.20.0', dist: {
          integrity: expected,
          tarball: 'https://registry.npmjs.org/@velor/remote-mouse/-/remote-mouse-6.20.0.tgz',
        }}), stderr: ''};
      }
      const filename = 'velor-remote-mouse-6.20.0.tgz';
      await fs.writeFile(path.join(options.cwd, filename), actual);
      return {ok: true, stdout: JSON.stringify([{name: '@velor/remote-mouse', version: '6.20.0', filename}]), stderr: ''};
    });
    const install = resolveInstallUpdateCommand({getSystemConfig, platform: 'linux'});

    await expect(install({targetVersion: '6.20.0'})).resolves.toMatchObject({
      ok: false,
      status: 'integrity-failed',
      message: 'The downloaded package failed its registry SHA-512 integrity check.',
    });
    expect(execFileAsync).toHaveBeenCalledTimes(3);
  });

  it('rejects a tarball hosted outside the configured registry origin', async () => {
    execFileAsync.mockImplementation(async (_command, args) => {
      if (args[0] === 'config') return {ok: true, stdout: 'https://registry.npmjs.org/', stderr: ''};
      return {ok: true, stdout: JSON.stringify({version: '6.20.0', dist: {
        integrity: 'sha512-AAAA',
        tarball: 'https://downloads.example.invalid/remote-mouse.tgz',
      }}), stderr: ''};
    });
    const install = resolveInstallUpdateCommand({getSystemConfig, platform: 'linux'});

    await expect(install({targetVersion: '6.20.0'})).resolves.toMatchObject({
      ok: false,
      status: 'artifact-origin-mismatch',
    });
    expect(execFileAsync).toHaveBeenCalledTimes(2);
  });

  it('refuses an npm registry without TLS before resolving package metadata', async () => {
    execFileAsync.mockResolvedValue({ok: true, stdout: 'http://registry.example.invalid/', stderr: ''});
    const install = resolveInstallUpdateCommand({getSystemConfig, platform: 'linux'});

    await expect(install({targetVersion: '6.20.0'})).resolves.toMatchObject({
      ok: false,
      status: 'resolve-failed',
      message: 'npm returned an unsupported configured registry URL.',
    });
    expect(execFileAsync).toHaveBeenCalledTimes(1);
  });
});
