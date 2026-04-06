import express from 'express';

export function createAdminRemotesRouter(services) {
  const router = express.Router();

  router.get('/browsers', async (_req, res) => {
    const browsers = await services.getRemotes().browser.listBrowsers();
    res.json({ browsers });
  });

  router.get('/', (_req, res) => {
    const config = services.getConfig();
    const remotes = [
      {
        id: 'browser',
        labelKey: 'preferences.remote.browser',
      },
      {
        id: 'preview',
        labelKey: 'preferences.remote.preview',
      },
    ];

    if (config?.samsungTv?.enabled) {
      remotes.push({
        id: 'samsung',
        labelKey: 'preferences.remote.samsung',
      });
    }

    res.json({
      remotes,
    });
  });

  return router;
}
