import {jest} from '@jest/globals';

describe('admin browser actions', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('returns a client-side openUrl for QR client action', async () => {
    const {createOpenQrBrowserAction} = await import('../../server/remotes/admin/open-qr-browser.js');
    const notifier = {notify: jest.fn()};
    const browser = {openUrlOnHost: jest.fn()};

    const openQrBrowser = createOpenQrBrowserAction({
      notifier,
      browser,
      target: 'client',
    });

    const result = await openQrBrowser({clientId: 'client-1'});

    expect(result).toEqual({
      ok: true,
      message: 'Page QR ouverte sur le client.',
      openUrl: '/qr',
    });
    expect(browser.openUrlOnHost).not.toHaveBeenCalled();
    expect(notifier.notify).toHaveBeenCalledWith(expect.objectContaining({
      target: 'client',
      clientId: 'client-1',
      message: 'Page QR ouverte sur le client.',
    }));
  });

  it('returns a client-side openUrl for server info client action', async () => {
    const {createOpenServerInfoBrowserAction} = await import('../../server/remotes/admin/open-server-info-browser.js');
    const notifier = {notify: jest.fn()};
    const browser = {openUrlOnHost: jest.fn()};

    const openServerInfoBrowser = createOpenServerInfoBrowserAction({
      notifier,
      browser,
      target: 'client',
    });

    const result = await openServerInfoBrowser({clientId: 'client-1'});

    expect(result).toEqual({
      ok: true,
      message: 'Page server info ouverte sur le client.',
      openUrl: '/admin/server-info',
    });
    expect(browser.openUrlOnHost).not.toHaveBeenCalled();
    expect(notifier.notify).toHaveBeenCalledWith(expect.objectContaining({
      target: 'client',
      clientId: 'client-1',
      message: 'Page server info ouverte sur le client.',
    }));
  });
});
