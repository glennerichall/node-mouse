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

  it('returns a client-side openUrl for QR client action', async () => {
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
      openUrl: '/qr',
    });
    expect(browser.openUrlOnHost).not.toHaveBeenCalled();
    expect(events.publishEvent).toHaveBeenCalledWith(PUBSUB_SERVICE_ADMIN_OPEN_QR_BROWSER, PUBSUB_EVENT_ADMIN_CLIENT_OPENED, {
      clientId: 'client-1',
    });
  });

  it('returns a client-side openUrl for server info client action', async () => {
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
      openUrl: '/ui/admin/server-info',
    });
    expect(browser.openUrlOnHost).not.toHaveBeenCalled();
    expect(events.publishEvent).toHaveBeenCalledWith(PUBSUB_SERVICE_ADMIN_OPEN_SERVER_INFO_BROWSER, PUBSUB_EVENT_ADMIN_CLIENT_OPENED, {
      clientId: 'client-1',
    });
  });
});
