import express from 'express';

export function createAdminRemotesRouter(services) {
  const router = express.Router();

  function isBrowserEnabled(config, browserId) {
    return config?.browser?.enabled !== false && config?.browser?.[browserId] !== false;
  }

  router.get('/browsers', async (_req, res) => {
    const config = services.getConfig();
    const browsers = await services.getRemotes().browser.listBrowsers();
    res.json({
      browsers: browsers.map((browser) => ({
        ...browser,
        enabled: isBrowserEnabled(config, browser.id),
      })),
    });
  });

  router.get('/', (_req, res) => {
    const config = services.getConfig();
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

    res.json({
      remotes,
    });
  });

  return router;
}
