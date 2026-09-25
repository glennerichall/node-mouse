import express from 'express';

export const adminRemotesRouter = express.Router();

  function isBrowserEnabled(config, browserId) {
    return config?.browser?.enabled !== false && config?.browser?.[browserId] !== false;
  }

  adminRemotesRouter.get('/browsers', async (req, res) => {
    const {services} = req;
    const config = services.getConfig();
    const browsers = await services.getSystem().listBrowsers();
    res.json({
      browsers: browsers.map((browser) => ({
        ...browser,
        enabled: isBrowserEnabled(config, browser.id),
      })),
    });
  });

  adminRemotesRouter.get('/', async (req, res) => {
    const {services} = req;
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
        id: 'system',
        labelKey: 'preferences.remote.system',
        enabled: true,
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
