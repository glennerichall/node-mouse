import express from 'express';
import {PUBSUB_SERVICE_CONFIG} from '../../services/pubsub/serviceEventConstants.js';

export function createAdminSubsRouter(services) {
  const router = express.Router();

  router.post('/configs', express.json(), (_req, res) => {
    const id = services.getSseService().createSubscription({
      filters: {
        service: PUBSUB_SERVICE_CONFIG,
      },
    });

    res.json({
      ok: true,
      id,
      eventsUrl: `/api/admin/subs/${id}`,
    });
  });

  router.get('/:id', (req, res) => {
    const connected = services.getSseService().connect(String(req.params.id || '').trim(), req, res);
    if (connected) {
      return;
    }

    res.status(404).json({
      ok: false,
      message: 'Subscription not found.',
    });
  });

  router.delete('/:id', (req, res) => {
    const removed = services.getSseService().deleteSubscription(String(req.params.id || '').trim());
    if (!removed) {
      res.status(404).json({
        ok: false,
        message: 'Subscription not found.',
      });
      return;
    }

    res.json({
      ok: true,
    });
  });

  return router;
}
