import {jest} from '@jest/globals';
import {buildNpmGlobalUpdateCommand} from '../../server/services/update-manager/buildNpmGlobalUpdateCommand.js';

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
    const install = jest.fn(async () => ({
      ok: true,
      status: 'completed',
      command: 'npm update -g remote-mouse --force',
    }));
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
  });
});

describe('buildNpmGlobalUpdateCommand', () => {
  it('returns a structured invocation and daemon environment marker', () => {
    expect(buildNpmGlobalUpdateCommand('@velor/remote-mouse', {platform: 'linux'})).toEqual({
      executable: 'npm',
      args: ['update', '-g', '@velor/remote-mouse'],
      env: {REMOTE_MOUSE_DAEMON: '1'},
      shell: false,
      displayCommand: "npm update -g '@velor/remote-mouse' (REMOTE_MOUSE_DAEMON=1)",
    });
  });

  it('rejects package names that could become shell syntax', () => {
    expect(buildNpmGlobalUpdateCommand('remote-mouse && whoami', {platform: 'win32'})).toBeNull();
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

  it('runs automatic npm updates without a shell on Linux', async () => {
    const install = resolveInstallUpdateCommand({getSystemConfig, platform: 'linux'});

    await expect(install()).resolves.toMatchObject({ok: true, status: 'completed'});
    expect(execFileAsync).toHaveBeenCalledWith('npm', ['update', '-g', '@velor/remote-mouse'], {
      timeout: 45_000,
      env: expect.objectContaining({REMOTE_MOUSE_DAEMON: '1'}),
      shell: false,
    });
    expect(execShell).not.toHaveBeenCalled();
  });

  it('invokes the npm command shim through cmd.exe without enabling an implicit shell', async () => {
    const install = resolveInstallUpdateCommand({getSystemConfig, platform: 'win32'});

    await expect(install()).resolves.toMatchObject({ok: true, status: 'completed'});
    expect(execFileAsync).toHaveBeenCalledWith('cmd.exe', ['/d', '/s', '/c', 'npm update -g @velor/remote-mouse'], {
      timeout: 45_000,
      env: expect.objectContaining({REMOTE_MOUSE_DAEMON: '1'}),
      shell: false,
    });
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
      status: 'failed',
      details: 'registry unavailable',
    });
  });
});
