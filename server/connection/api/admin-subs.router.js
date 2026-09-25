import express from 'express';
import {PUBSUB_SERVICE_CONFIG} from '../../services/pubsub/serviceEventConstants.js';

export const adminSubsRouter = express.Router();

  adminSubsRouter.post('/configs', express.json(), (req, res) => {
    const {services} = req;
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

  adminSubsRouter.get('/:id', (req, res) => {
    const {services} = req;
    const connected = services.getSseService().connect(String(req.params.id || '').trim(), req, res);
    if (connected) {
      return;
    }

    res.status(404).json({
      ok: false,
      message: 'Subscription not found.',
    });
  });

  adminSubsRouter.delete('/:id', (req, res) => {
    const {services} = req;
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
