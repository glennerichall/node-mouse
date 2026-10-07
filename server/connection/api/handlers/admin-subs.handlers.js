import {PUBSUB_SERVICE_CONFIG} from '../../../services/pubsub/serviceEventConstants.js';

export function createAdminConfigSubscription(req, res) {
  const id = req.services.getSseService().createSubscription({
    filters: {service: PUBSUB_SERVICE_CONFIG},
  });

  res.json({ok: true, id, eventsUrl: `/api/admin/subs/${id}`});
}

export function connectAdminSubscription(req, res) {
  const connected = req.services.getSseService().connect(String(req.params.id || '').trim(), req, res);
  if (connected) return;

  res.status(404).json({ok: false, message: 'Subscription not found.'});
}

export function deleteAdminSubscription(req, res) {
  const removed = req.services.getSseService().deleteSubscription(String(req.params.id || '').trim());
  if (!removed) {
    res.status(404).json({ok: false, message: 'Subscription not found.'});
    return;
  }

  res.json({ok: true});
}
