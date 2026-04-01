import {jest} from '@jest/globals';
import {NOTIFIER_TARGET_CLIENT} from '../../server/notifier/notifier-composite.js';

describe('admin browser actions', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('returns a client-side openUrl for QR client action', async () => {
    const {createOpenQrBrowserAction} = await import('../../server/remotes/admin/open-qr-browser.js');
    const notify = jest.fn();
    const notifier = {
      target: jest.fn(() => ({notify})),
    };
    const browser = {openUrlOnHost: jest.fn()};

    const openQrBrowser = createOpenQrBrowserAction({
      notifier,
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
    expect(notifier.target).toHaveBeenCalledWith(NOTIFIER_TARGET_CLIENT);
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Page QR ouverte sur le client.',
    }), {
      clientId: 'client-1',
    });
  });

  it('returns a client-side openUrl for server info client action', async () => {
    const {createOpenServerInfoBrowserAction} = await import('../../server/remotes/admin/open-server-info-browser.js');
    const notify = jest.fn();
    const notifier = {
      target: jest.fn(() => ({notify})),
    };
    const browser = {openUrlOnHost: jest.fn()};

    const openServerInfoBrowser = createOpenServerInfoBrowserAction({
      notifier,
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
    expect(notifier.target).toHaveBeenCalledWith(NOTIFIER_TARGET_CLIENT);
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Page server info ouverte sur le client.',
    }), {
      clientId: 'client-1',
    });
  });
});
