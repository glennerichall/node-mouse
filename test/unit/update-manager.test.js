import {jest} from '@jest/globals';

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

jest.unstable_mockModule('../../server/application/logger.js', () => ({
  createLogger,
}));

const {
  createUpdateManager,
} = await import('../../server/services/update-manager/createUpdateManager.js');

function createServices({
  config = {updateCheck: {enabled: true}},
  systemConfig = {updateCheck: {}},
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

  it('publishes an available update when the source detects one', async () => {
    const events = {publishState: jest.fn()};
    const check = jest.fn(async () => ({
      hasUpdate: true,
      key: 'npm:6.5.0',
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
    const install = jest.fn(async () => ({
      ok: true,
      status: 'completed',
      command: 'npm update -g remote-mouse --force',
    }));
    install.command = 'npm update -g remote-mouse --force';
    chooseUpdateInstallSource.mockReturnValue(install);
    const updateManager = createUpdateManager(createServices());

    await expect(updateManager.update()).resolves.toEqual({
      ok: true,
      status: 'completed',
      command: 'npm update -g remote-mouse --force',
    });

    expect(chooseUpdateInstallSource).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenNthCalledWith(1, {
      installCommand: 'npm update -g remote-mouse --force',
    }, 'Exécution commande install update');
    expect(logger.info).toHaveBeenNthCalledWith(2, 'Install update terminée avec succès');
  });
});
