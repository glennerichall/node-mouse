import {jest} from '@jest/globals';
import {NOTIFIER_TARGET_CLIENT} from '../../server/services/notifier/createNotifierComposite.js';
import {
  PUBSUB_EVENT_ADMIN_CLIENT_OPENED,
  PUBSUB_SERVICE_ADMIN_OPEN_QR_BROWSER,
  PUBSUB_SERVICE_ADMIN_OPEN_SERVER_INFO_BROWSER,
} from '../../server/services/pubsub/serviceEventConstants.js';

describe('admin browser actions', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('reports client-side QR navigation without opening a host URL', async () => {
    const {createOpenQrBrowserAction} = await import('../../server/remotes/admin/createOpenQrBrowserAction.js');
    const events = {
      publishEvent: jest.fn(),
    };
    const browser = {openUrlOnHost: jest.fn()};

    const openQrBrowser = createOpenQrBrowserAction({
      getEvents: () => events,
      getSystemConfig: () => ({protocol: 'http', port: 3000}),
    }, {
      browser,
      target: NOTIFIER_TARGET_CLIENT,
    });

    const result = await openQrBrowser({clientId: 'client-1'});

    expect(result).toEqual({
      ok: true,
      message: 'Page QR ouverte sur le client.',
    });
    expect(browser.openUrlOnHost).not.toHaveBeenCalled();
    expect(events.publishEvent).toHaveBeenCalledWith(PUBSUB_SERVICE_ADMIN_OPEN_QR_BROWSER, PUBSUB_EVENT_ADMIN_CLIENT_OPENED, {
      clientId: 'client-1',
    });
  });

  it('reports client-side server-info navigation without opening a host URL', async () => {
    const {createOpenServerInfoBrowserAction} = await import('../../server/remotes/admin/createOpenServerInfoBrowserAction.js');
    const events = {
      publishEvent: jest.fn(),
    };
    const browser = {openUrlOnHost: jest.fn()};

    const openServerInfoBrowser = createOpenServerInfoBrowserAction({
      getEvents: () => events,
      getSystemConfig: () => ({protocol: 'http', port: 3000}),
    }, {
      browser,
      target: NOTIFIER_TARGET_CLIENT,
    });

    const result = await openServerInfoBrowser({clientId: 'client-1'});

    expect(result).toEqual({
      ok: true,
      message: 'Page server info ouverte sur le client.',
    });
    expect(browser.openUrlOnHost).not.toHaveBeenCalled();
    expect(events.publishEvent).toHaveBeenCalledWith(PUBSUB_SERVICE_ADMIN_OPEN_SERVER_INFO_BROWSER, PUBSUB_EVENT_ADMIN_CLIENT_OPENED, {
      clientId: 'client-1',
    });
  });

  it('opens mouse tuning on the host browser', async () => {
    const {createOpenMouseTuningBrowserAction} = await import('../../server/remotes/admin/createOpenMouseTuningBrowserAction.js');
    const browser = {openUrlOnHost: jest.fn().mockResolvedValue(true)};
    const getMouseTuning = {createSession: jest.fn(() => ({id: 'calibration-1'}))};
    const openMouseTuningBrowser = createOpenMouseTuningBrowserAction({
      getSystemConfig: () => ({protocol: 'http', port: 3000}),
      getMouseTuning: () => getMouseTuning,
    }, {browser});

    const result = await openMouseTuningBrowser({clientId: 'device-1'});

    expect(result.ok).toBe(true);
    expect(getMouseTuning.createSession).toHaveBeenCalledWith('device-1');
    expect(browser.openUrlOnHost).toHaveBeenCalledWith('http://127.0.0.1:3000/ui/admin/mouse-tuning?session=calibration-1');
  });
});
