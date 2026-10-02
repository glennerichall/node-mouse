import express from 'express';

import {CLIENT_CONFIG_PATHS} from '../../services/config/configPaths.js';
import {PUBSUB_SERVICE_CLIENT_CONFIG} from '../../services/pubsub/serviceEventConstants.js';
import {getManagedConfigSnapshot} from './configs.js';
import {remotesCatalogRouter} from './admin-remotes.router.js';

export async function getClientConfig(req, res) {
  const config = getManagedConfigSnapshot(req.services.getConfig(), CLIENT_CONFIG_PATHS);
  const vlcAvailable = await req.services.getRemotes().vlc.isAvailable();
  const previewAvailable = req.services.getRemotes().preview.isAvailable();
  config.vlc.enabled = vlcAvailable && config.vlc.enabled !== false;
  config.preview.enabled = previewAvailable && config.preview.enabled !== false;

  res.json({
    config,
    systemConfig: {
      adminActionsEnabled: req.securityContext?.role === 'admin'
        && Boolean(req.services.getSystemConfig().adminActionsEnabled),
      adminUnlocked: req.securityContext?.role === 'admin',
      adminUnlockAvailable: String(req.services.getSystemConfig().admin?.password || '').length >= 12,
    },
  });
}

export const clientSubsRouter = express.Router();

clientSubsRouter.post('/configs', (req, res) => {
  const id = req.services.getSseService().createSubscription({
    filters: {service: PUBSUB_SERVICE_CLIENT_CONFIG},
  });

  res.json({
    ok: true,
    id,
    eventsUrl: `/api/client/subs/${id}`,
  });
});

clientSubsRouter.get('/:id', (req, res) => {
  const connected = req.services.getSseService().connect(String(req.params.id || '').trim(), req, res);
  if (!connected) {
    res.status(404).json({ok: false, message: 'Subscription not found.'});
  }
});

clientSubsRouter.delete('/:id', (req, res) => {
  const removed = req.services.getSseService().deleteSubscription(String(req.params.id || '').trim());
  if (!removed) {
    res.status(404).json({ok: false, message: 'Subscription not found.'});
    return;
  }
  res.json({ok: true});
});

export const clientApiRouter = express.Router()
  .get('/config', getClientConfig)
  .use('/subs', clientSubsRouter)
  .use('/remotes', remotesCatalogRouter);
