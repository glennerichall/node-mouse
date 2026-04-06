import express from 'express';

export function createAdminRemotesRouter(services) {
  const router = express.Router();

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
