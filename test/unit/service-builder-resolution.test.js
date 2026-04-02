import {jest} from '@jest/globals';

import {createSocketSessionAuthMiddleware} from '../../server/connection/socket/createSocketSessionAuthMiddleware.js';
import {createInstallUpdateAction} from '../../server/remotes/admin/install-update.js';
import {createRotateEntryTokenAction} from '../../server/remotes/admin/rotate-entry-token.js';
import {createPreviewStreamer} from '../../server/remotes/preview/createPreviewStreamer.js';
import {createKeyboardController} from '../../server/services/input/createKeyboardController.js';
import {createMouseController} from '../../server/services/input/createMouseController.js';
import {createClientNotifier} from '../../server/services/notifier/createClientNotifier.js';
import {createTokenManager} from '../../server/services/token-manager/createTokenManager.js';
import {createUpdateManager} from '../../server/services/update-manager/createUpdateManager.js';

describe('service builders resolve providers only in methods', () => {
  it('createTokenManager does not read services during builder creation', () => {
    const getSystemConfig = jest.fn(() => ({
      entryPath: {
        enabled: false,
        fixed: 'fixed-token',
        tokenLength: 24,
        graceMin: 120,
      },
    }));
    const getPersistence = jest.fn(() => ({
      entryTokenDao: {
        countEntryTokens: jest.fn(() => 0),
        deleteExpiredEntryTokens: jest.fn(() => 0),
        getLatestEntryToken: jest.fn(() => ''),
        hasEntryToken: jest.fn(() => false),
        createEntryToken: jest.fn(),
      },
    }));

    const tokenManager = createTokenManager({
      getSystemConfig,
      getPersistence,
    });

    expect(getSystemConfig).not.toHaveBeenCalled();
    expect(getPersistence).not.toHaveBeenCalled();

    expect(tokenManager.getToken()).toBe('fixed-token');
    expect(getSystemConfig).toHaveBeenCalled();
  });

  it('createUpdateManager does not read services during builder creation', async () => {
    const getConfig = jest.fn(() => ({
      updateCheck: {
        enabled: false,
      },
    }));
    const getSystemConfig = jest.fn(() => ({
      updateCheck: {
        checkCommand: '',
        checkTimeoutSec: 20,
        packageName: 'remote-mouse',
        currentVersion: '1.0.0',
        intervalMin: 60,
      },
    }));
    const getNotifier = jest.fn(() => ({
      notify: jest.fn(),
    }));
    const getLogger = jest.fn(() => ({
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    }));

    const updateManager = createUpdateManager({
      getConfig,
      getSystemConfig,
      getNotifier,
      getLogger,
    });

    expect(getConfig).not.toHaveBeenCalled();
    expect(getSystemConfig).not.toHaveBeenCalled();
    expect(getNotifier).not.toHaveBeenCalled();
    expect(getLogger).not.toHaveBeenCalled();

    await updateManager.runNow();
    expect(getConfig).toHaveBeenCalled();
    expect(getLogger).not.toHaveBeenCalled();

    updateManager.getInstallCommand();
    expect(getSystemConfig).toHaveBeenCalled();
  });

  it('createPreviewStreamer does not read services during builder creation', () => {
    const getRobot = jest.fn(() => ({
      getScreenSize: jest.fn(() => ({width: 100, height: 100})),
      getMousePos: jest.fn(() => ({x: 50, y: 50})),
      captureScreen: jest.fn(),
    }));
    const getConfig = jest.fn(() => ({
      preview: {
        width: 128,
        height: 84,
        fps: 6,
      },
    }));

    const preview = createPreviewStreamer({
      getRobot,
      getConfig,
    });

    expect(getRobot).not.toHaveBeenCalled();
    expect(getConfig).not.toHaveBeenCalled();

    preview.startForSocket({emit: jest.fn()}).stop();
    expect(getConfig).toHaveBeenCalled();
  });

  it('createSocketSessionAuthMiddleware does not read services during builder creation', () => {
    const getSystemConfig = jest.fn(() => ({
      session: {
        cookieName: 'session',
      },
    }));
    const isValid = jest.fn(() => true);
    const getTokenManager = jest.fn(() => ({
      isValid,
    }));

    const authorizeSocket = createSocketSessionAuthMiddleware({
      getSystemConfig,
      getTokenManager,
    });

    expect(getSystemConfig).not.toHaveBeenCalled();
    expect(getTokenManager).not.toHaveBeenCalled();

    authorizeSocket({
      request: {
        socket: {remoteAddress: '10.0.0.8'},
        signedCookies: {session: 'token-abc'},
      },
    }, jest.fn());

    expect(getSystemConfig).toHaveBeenCalled();
    expect(getTokenManager).toHaveBeenCalled();
    expect(isValid).toHaveBeenCalledWith('token-abc');
  });

  it('createRotateEntryTokenAction does not read services during builder creation', async () => {
    const notify = jest.fn();
    const getNotifier = jest.fn(() => ({
      target: jest.fn(() => ({notify})),
    }));
    const getTokenManager = jest.fn(() => ({
      getToken: jest.fn(() => 'old-token'),
      createToken: jest.fn(() => 'new-token'),
    }));

    const action = createRotateEntryTokenAction({
      getNotifier,
      getTokenManager,
    });

    expect(getNotifier).not.toHaveBeenCalled();
    expect(getTokenManager).not.toHaveBeenCalled();

    await action({clientId: 'client-a'});
    expect(getNotifier).toHaveBeenCalled();
    expect(getTokenManager).toHaveBeenCalled();
  });

  it('createInstallUpdateAction does not read services during builder creation', async () => {
    const notify = jest.fn();
    const getNotifier = jest.fn(() => ({
      target: jest.fn(() => ({notify})),
    }));
    const getUpdateManager = jest.fn(() => ({
      getInstallCommand: jest.fn(() => ''),
    }));
    const getConfig = jest.fn(() => ({
      updateCheck: {
        packageName: '',
        installCommand: '',
        installTimeoutSec: 30,
      },
    }));

    const action = createInstallUpdateAction({
      getNotifier,
      getUpdateManager,
      getConfig,
    });

    expect(getNotifier).not.toHaveBeenCalled();
    expect(getUpdateManager).not.toHaveBeenCalled();
    expect(getConfig).not.toHaveBeenCalled();

    await action({clientId: 'client-a'});
    expect(getNotifier).toHaveBeenCalled();
    expect(getUpdateManager).toHaveBeenCalled();
    expect(getConfig).toHaveBeenCalled();
  });

  it('input builders do not read robot during builder creation', () => {
    const getRobot = jest.fn(() => ({
      getScreenSize: jest.fn(() => ({width: 100, height: 100})),
      getMousePos: jest.fn(() => ({x: 10, y: 10})),
      moveMouse: jest.fn(),
      scrollMouse: jest.fn(),
      mouseClick: jest.fn(),
      typeString: jest.fn(),
      keyTap: jest.fn(),
    }));
    const getConfig = jest.fn(() => ({
      input: {
        mouseSpeed: 1.3,
        scrollSpeed: 0.25,
      },
    }));

    const mouse = createMouseController({getRobot, getConfig});
    const keyboard = createKeyboardController({getRobot});

    expect(getRobot).not.toHaveBeenCalled();

    mouse.click('left');
    keyboard.pressSpecialKey('enter');

    expect(getRobot).toHaveBeenCalled();
  });

  it('createClientNotifier does not read io or config during builder creation', () => {
    const io = {
      emit: jest.fn(),
      to: jest.fn(() => ({emit: jest.fn()})),
    };
    const getServer = jest.fn(() => ({io}));
    const getConfig = jest.fn(() => ({
      notifications: {
        client: true,
      },
    }));
    const getLogger = jest.fn(() => ({
      warn: jest.fn(),
    }));

    const notifier = createClientNotifier({
      getServer,
      getConfig,
      getLogger,
    });

    expect(getServer).not.toHaveBeenCalled();
    expect(getConfig).not.toHaveBeenCalled();
    expect(getLogger).not.toHaveBeenCalled();

    notifier.notify({message: 'hello'});
    expect(getServer).toHaveBeenCalled();
    expect(getConfig).toHaveBeenCalled();
    expect(getLogger).not.toHaveBeenCalled();
  });
});
