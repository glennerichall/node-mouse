import {jest} from '@jest/globals';

import {createSocketSessionAuthMiddleware} from '../../server/connection/socket/createSocketSessionAuthMiddleware.js';
import {createInstallUpdateAction} from '../../server/remotes/admin/createInstallUpdateAction.js';
import {createRotateEntryTokenAction} from '../../server/remotes/admin/createRotateEntryTokenAction.js';
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
    const getEvents = jest.fn(() => ({
      publishState: jest.fn(),
    }));

    const tokenManager = createTokenManager({
      getSystemConfig,
      getPersistence,
      getEvents,
    });

    expect(getSystemConfig).not.toHaveBeenCalled();
    expect(getPersistence).not.toHaveBeenCalled();
    expect(getEvents).not.toHaveBeenCalled();

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
        checkCommand: 'custom-check-command',
        checkTimeoutSec: 20,
        packageName: 'remote-mouse',
        currentVersion: '1.0.0',
        intervalMin: 60,
      },
    }));
    const getEvents = jest.fn(() => ({
      publishState: jest.fn(),
      publishEvent: jest.fn(),
    }));
    const getLogger = jest.fn(() => ({
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    }));
    const updateManager = createUpdateManager({
      getConfig,
      getSystemConfig,
      getLogger,
      getEvents,
    });

    expect(getConfig).not.toHaveBeenCalled();
    expect(getSystemConfig).not.toHaveBeenCalled();
    expect(getLogger).not.toHaveBeenCalled();
    expect(getEvents).not.toHaveBeenCalled();

    await updateManager.check();
    expect(getConfig).toHaveBeenCalled();
    expect(getLogger).not.toHaveBeenCalled();
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
    const getLogger = jest.fn(() => ({
      info: jest.fn(),
    }));
    const getEvents = jest.fn(() => ({
      publishEvent: jest.fn(),
    }));
    const getTokenManager = jest.fn(() => ({
      getToken: jest.fn(() => 'old-token'),
      createToken: jest.fn(() => 'new-token'),
    }));

    const action = createRotateEntryTokenAction({
      getLogger,
      getEvents,
      getTokenManager,
    });

    expect(getLogger).not.toHaveBeenCalled();
    expect(getEvents).not.toHaveBeenCalled();
    expect(getTokenManager).not.toHaveBeenCalled();

    await action({clientId: 'client-a'});
    expect(getLogger).toHaveBeenCalled();
    expect(getEvents).toHaveBeenCalled();
    expect(getTokenManager).toHaveBeenCalled();
  });

  it('createInstallUpdateAction does not read services during builder creation', async () => {
    const getEvents = jest.fn(() => ({
      publishEvent: jest.fn(),
    }));
    const getUpdateManager = jest.fn(() => ({
      update: jest.fn(async () => ({
        ok: false,
        status: 'no-command',
      })),
    }));
    const getRemotes = jest.fn(() => ({
      adminActions: {
        restartService: jest.fn(),
      },
    }));

    const action = createInstallUpdateAction({
      getEvents,
      getUpdateManager,
      getRemotes,
    });

    expect(getEvents).not.toHaveBeenCalled();
    expect(getUpdateManager).not.toHaveBeenCalled();
    expect(getRemotes).not.toHaveBeenCalled();

    await action({clientId: 'client-a'});
    expect(getEvents).toHaveBeenCalled();
    expect(getUpdateManager).toHaveBeenCalled();
    expect(getRemotes).toHaveBeenCalled();
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

  it('mouse controller uses drag when left button is held', () => {
    const robot = {
      getScreenSize: jest.fn(() => ({width: 100, height: 100})),
      getMousePos: jest.fn(() => ({x: 10, y: 10})),
      moveMouse: jest.fn(),
      dragMouse: jest.fn(),
      mouseToggle: jest.fn(),
      scrollMouse: jest.fn(),
      mouseClick: jest.fn(),
    };
    const mouse = createMouseController({
      getRobot: () => robot,
      getConfig: () => ({
        input: {
          mouseSpeed: 1,
          scrollSpeed: 1,
        },
      }),
    });

    mouse.setButtonState('left', 'down');
    mouse.move(5, 4);
    mouse.setButtonState('left', 'up');

    expect(robot.mouseToggle).toHaveBeenNthCalledWith(1, 'down', 'left');
    expect(robot.dragMouse).toHaveBeenCalledWith(15, 14);
    expect(robot.mouseToggle).toHaveBeenNthCalledWith(2, 'up', 'left');
    expect(robot.moveMouse).not.toHaveBeenCalled();
  });

  it('keyboard controller serializes text and special key input', async () => {
    const calls = [];
    const robot = {
      setKeyboardDelay: jest.fn((value) => {
        calls.push(`delay:${value}`);
      }),
      typeString: jest.fn((value) => {
        calls.push(`type:${value}`);
      }),
      keyTap: jest.fn((key, modifiers) => {
        const suffix = Array.isArray(modifiers) && modifiers.length ? `:${modifiers.join('+')}` : '';
        calls.push(`key:${key}${suffix}`);
      }),
    };

    const keyboard = createKeyboardController({
      getRobot: () => robot,
    });

    const first = keyboard.typeText('ab\n');
    const second = keyboard.pressSpecialKey('enter');

    await Promise.all([first, second]);

    expect(robot.setKeyboardDelay).toHaveBeenCalledWith(20);
    expect(calls).toEqual([
      'delay:20',
      'type:ab',
      'key:enter',
      'key:enter',
    ]);
  });

  it('createClientNotifier does not read io or config during builder creation', () => {
    const io = {
      emit: jest.fn(),
      to: jest.fn(() => ({emit: jest.fn()})),
    };
    const getServer = jest.fn(() => ({io}));
    const getLogger = jest.fn(() => ({
      warn: jest.fn(),
    }));

    const notifier = createClientNotifier({
      getServer,
      getLogger,
    });

    expect(getServer).not.toHaveBeenCalled();
    expect(getLogger).not.toHaveBeenCalled();

    notifier.notify({message: 'hello'});
    expect(getServer).toHaveBeenCalled();
    expect(getLogger).not.toHaveBeenCalled();
  });
});
