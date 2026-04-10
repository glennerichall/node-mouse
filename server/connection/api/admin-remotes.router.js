import express from 'express';

export function createAdminRemotesRouter(services) {
  const router = express.Router();

  function isBrowserEnabled(config, browserId) {
    return config?.browser?.enabled !== false && config?.browser?.[browserId] !== false;
  }

  router.get('/browsers', async (_req, res) => {
    const config = services.getConfig();
    const browsers = await services.getSystem().listBrowsers();
    res.json({
      browsers: browsers.map((browser) => ({
        ...browser,
        enabled: isBrowserEnabled(config, browser.id),
      })),
    });
  });

  router.get('/', async (_req, res) => {
    const config = services.getConfig();
    const vlcAvailable = await services.getSystem().isVlcAvailable();
    const remotes = [
      {
        id: 'browser',
        labelKey: 'preferences.remote.browser',
        enabled: config?.browser?.enabled !== false,
      },
      {
        id: 'keyboard',
        labelKey: 'preferences.remote.keyboard',
        enabled: config?.keyboard?.enabled !== false,
      },
      {
        id: 'preview',
        labelKey: 'preferences.remote.preview',
        enabled: config?.preview?.enabled !== false,
      },
      {
        id: 'samsung',
        labelKey: 'preferences.remote.samsung',
        enabled: Boolean(config?.samsungTv?.enabled),
      },
    ];

    if (vlcAvailable) {
      remotes.splice(2, 0, {
        id: 'vlc',
        labelKey: 'preferences.remote.vlc',
        enabled: config?.vlc?.enabled !== false,
      });
    }

    res.json({
      remotes,
    });
  });

  return router;
}
