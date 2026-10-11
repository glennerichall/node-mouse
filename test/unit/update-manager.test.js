import {jest} from '@jest/globals';
import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
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
const {rollbackVerifiedNpmPackage} = await import('../../server/services/update-manager/installVerifiedNpmPackage.js');
const {saveUpdateRollbackArtifact} = await import('../../server/services/update-manager/updateRollbackStore.js');

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

  async function createRollbackDirectory() {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'remote-mouse-update-test-'));
    return {root, rollbackDirectory: path.join(root, 'rollback')};
  }

  function mockVerifiedPackages({platform = 'linux', failActivation = false} = {}) {
    const packages = {
      '6.19.89': Buffer.from('previous verified package'),
      '6.20.0': Buffer.from('candidate verified package'),
    };
    execFileAsync.mockImplementation(async (_command, args, options) => {
      const npmArgs = platform === 'win32' ? args[3].split(' ').slice(1) : args;
      if (npmArgs[0] === 'config') return {ok: true, stdout: 'https://registry.npmjs.org/\n', stderr: ''};
      if (npmArgs[0] === 'view') {
        const version = npmArgs[1].split('@').at(-1);
        const archive = packages[version];
        return {ok: true, stdout: JSON.stringify({version, dist: {
          integrity: `sha512-${createHash('sha512').update(archive).digest('base64')}`,
          tarball: `https://registry.npmjs.org/@velor/remote-mouse/-/remote-mouse-${version}.tgz`,
        }}), stderr: ''};
      }
      if (npmArgs[0] === 'pack') {
        const version = npmArgs[1].split('@').at(-1);
        const filename = `velor-remote-mouse-${version}.tgz`;
        await fs.writeFile(path.join(options.cwd, filename), packages[version]);
        return {ok: true, stdout: JSON.stringify([{name: '@velor/remote-mouse', version, filename}]), stderr: ''};
      }
      if (npmArgs[0] === 'install' && failActivation && !mockVerifiedPackages.activationFailed) {
        mockVerifiedPackages.activationFailed = true;
        return {ok: false, stdout: '', stderr: 'activation failed'};
      }
      return {ok: true, stdout: '', stderr: ''};
    });
  }

  it('downloads, verifies, then activates a pinned npm artifact on Linux', async () => {
    const {root, rollbackDirectory} = await createRollbackDirectory();
    mockVerifiedPackages();
    const stages = [];
    const install = resolveInstallUpdateCommand({getSystemConfig, platform: 'linux', rollbackDirectory});

    try {
      await expect(install({targetVersion: '6.20.0', currentVersion: '6.19.89', onStage: (stage) => stages.push(stage.stage)})).resolves.toMatchObject({
        ok: true, status: 'completed', targetVersion: '6.20.0', previousVersion: '6.19.89', integrity: 'sha512',
      });
      const calls = execFileAsync.mock.calls;
      expect(calls.map(([, args]) => args)).toEqual([
        ['config', 'get', 'registry'],
        ['view', '@velor/remote-mouse@6.20.0', 'version', 'dist.integrity', 'dist.tarball', '--json', '--registry=https://registry.npmjs.org/'],
        ['pack', '@velor/remote-mouse@6.20.0', '--json', '--registry=https://registry.npmjs.org/'],
        ['view', '@velor/remote-mouse@6.19.89', 'version', 'dist.integrity', 'dist.tarball', '--json', '--registry=https://registry.npmjs.org/'],
        ['pack', '@velor/remote-mouse@6.19.89', '--json', '--registry=https://registry.npmjs.org/'],
        ['install', '-g', 'velor-remote-mouse-6.20.0.tgz', '--registry=https://registry.npmjs.org/'],
      ]);
      expect(calls[1][2].cwd).toBe(calls[2][2].cwd);
      expect(calls[2][2].cwd).toBe(calls[3][2].cwd);
      expect(calls[5][2].env.REMOTE_MOUSE_DAEMON).toBe('1');
      expect(stages).toContain('rollback-ready');
      expect(stages).toContain('activated');
      await expect(fs.readFile(path.join(rollbackDirectory, 'previous-update.json'), 'utf8')).resolves.toContain('6.19.89');
      expect(execShell).not.toHaveBeenCalled();
    } finally {
      await fs.rm(root, {recursive: true, force: true});
    }
  });

  it('uses cmd.exe for the verified npm stages on Windows', async () => {
    const {root, rollbackDirectory} = await createRollbackDirectory();
    mockVerifiedPackages({platform: 'win32'});
    const install = resolveInstallUpdateCommand({getSystemConfig, platform: 'win32', rollbackDirectory});

    try {
      await expect(install({targetVersion: '6.20.0', currentVersion: '6.19.89'})).resolves.toMatchObject({ok: true, status: 'completed'});
      expect(execFileAsync.mock.calls.map(([command]) => command)).toEqual(Array(6).fill('cmd.exe'));
      expect(execFileAsync.mock.calls.map(([, args]) => args[3])).toEqual([
        'npm config get registry',
        'npm view @velor/remote-mouse@6.20.0 version dist.integrity dist.tarball --json --registry=https://registry.npmjs.org/',
        'npm pack @velor/remote-mouse@6.20.0 --json --registry=https://registry.npmjs.org/',
        'npm view @velor/remote-mouse@6.19.89 version dist.integrity dist.tarball --json --registry=https://registry.npmjs.org/',
        'npm pack @velor/remote-mouse@6.19.89 --json --registry=https://registry.npmjs.org/',
        'npm install -g velor-remote-mouse-6.20.0.tgz --registry=https://registry.npmjs.org/',
      ]);
      expect(execShell).not.toHaveBeenCalled();
    } finally {
      await fs.rm(root, {recursive: true, force: true});
    }
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

  it('does not activate a package when the current installed version cannot be snapshotted', async () => {
    const install = resolveInstallUpdateCommand({getSystemConfig, platform: 'linux'});

    await expect(install({targetVersion: '6.20.0'})).resolves.toMatchObject({
      ok: false,
      status: 'rollback-source-unavailable',
    });
    expect(execFileAsync).not.toHaveBeenCalled();
  });

  it('reports when no verified rollback package is available', async () => {
    const {root, rollbackDirectory} = await createRollbackDirectory();

    try {
      await expect(rollbackVerifiedNpmPackage({
        packageName: '@velor/remote-mouse',
        rollbackDirectory,
        platform: 'linux',
      })).resolves.toMatchObject({ok: false, status: 'no-rollback'});
      expect(execFileAsync).not.toHaveBeenCalled();
    } finally {
      await fs.rm(root, {recursive: true, force: true});
    }
  });

  it('refuses to install a rollback archive whose saved integrity no longer matches', async () => {
    const {root, rollbackDirectory} = await createRollbackDirectory();
    const archive = Buffer.from('previous package');
    const integrity = `sha512-${createHash('sha512').update(archive).digest('base64')}`;
    const metadata = await saveUpdateRollbackArtifact({
      rollbackDirectory,
      packageName: '@velor/remote-mouse',
      version: '6.19.89',
      archive,
      integrity,
      registryUrl: 'https://registry.npmjs.org/',
      registryOrigin: 'https://registry.npmjs.org',
    });
    await fs.writeFile(path.join(rollbackDirectory, metadata.filename), 'altered archive');

    try {
      await expect(rollbackVerifiedNpmPackage({
        packageName: '@velor/remote-mouse',
        rollbackDirectory,
        platform: 'linux',
      })).resolves.toMatchObject({ok: false, status: 'rollback-integrity-failed'});
      expect(execFileAsync).not.toHaveBeenCalled();
    } finally {
      await fs.rm(root, {recursive: true, force: true});
    }
  });

  it('returns process failures with diagnostic output', async () => {
    execFileAsync.mockResolvedValue({ok: false, stdout: '', stderr: 'registry unavailable'});
    const install = resolveInstallUpdateCommand({getSystemConfig, platform: 'win32'});

    await expect(install({currentVersion: '6.19.89'})).resolves.toMatchObject({
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

    await expect(install({targetVersion: '6.20.0', currentVersion: '6.19.89'})).resolves.toMatchObject({
      ok: false,
      status: 'integrity-failed',
      message: 'The downloaded candidate package failed its registry SHA-512 integrity check.',
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

    await expect(install({targetVersion: '6.20.0', currentVersion: '6.19.89'})).resolves.toMatchObject({
      ok: false,
      status: 'artifact-origin-mismatch',
    });
    expect(execFileAsync).toHaveBeenCalledTimes(2);
  });

  it('refuses an npm registry without TLS before resolving package metadata', async () => {
    execFileAsync.mockResolvedValue({ok: true, stdout: 'http://registry.example.invalid/', stderr: ''});
    const install = resolveInstallUpdateCommand({getSystemConfig, platform: 'linux'});

    await expect(install({targetVersion: '6.20.0', currentVersion: '6.19.89'})).resolves.toMatchObject({
      ok: false,
      status: 'resolve-failed',
      message: 'npm returned an unsupported configured registry URL.',
    });
    expect(execFileAsync).toHaveBeenCalledTimes(1);
  });

  it('automatically restores the verified previous version if candidate activation fails', async () => {
    const {root, rollbackDirectory} = await createRollbackDirectory();
    mockVerifiedPackages({failActivation: true});
    const install = resolveInstallUpdateCommand({getSystemConfig, platform: 'linux', rollbackDirectory});

    try {
      await expect(install({targetVersion: '6.20.0', currentVersion: '6.19.89'})).resolves.toMatchObject({
        ok: false,
        status: 'activation-failed-rolled-back',
        rollbackSucceeded: true,
        rolledBackVersion: '6.19.89',
      });
      const installCalls = execFileAsync.mock.calls.filter(([, args]) => args[0] === 'install');
      expect(installCalls).toHaveLength(2);
      expect(installCalls[0][1].slice(0, 3)).toEqual(['install', '-g', 'velor-remote-mouse-6.20.0.tgz']);
      expect(installCalls[1][1][2]).toMatch(/^rollback-6\.19\.89-.+\.tgz$/);
    } finally {
      await fs.rm(root, {recursive: true, force: true});
    }
  });
});
