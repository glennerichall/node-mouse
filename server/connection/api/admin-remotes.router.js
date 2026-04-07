import express from 'express';

export function createAdminRemotesRouter(services) {
  const router = express.Router();

  router.get('/browsers', async (_req, res) => {
    const config = services.getConfig();
    if (config?.browser?.enabled === false) {
      res.status(403).json({
        ok: false,
        message: 'Browser remote disabled.',
      });
      return;
    }

    const browsers = await services.getRemotes().browser.listBrowsers();
    res.json({ browsers });
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
