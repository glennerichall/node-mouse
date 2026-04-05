import {
  PUBSUB_EVENT_ADMIN_REJECTED_DISABLED,
  PUBSUB_EVENT_ADMIN_ROTATED,
  PUBSUB_EVENT_ADMIN_UNCHANGED,
  PUBSUB_SERVICE_ADMIN_ROTATE_ENTRY_TOKEN,
} from '../../services/pubsub/serviceEventConstants.js';

export function createRotateEntryTokenAction(services) {
  return async function rotateEntryToken({ clientId } = {}) {
    const events = services.getEvents();
    const tokenManager = services.getTokenManager();
    const log = services.getLogger('admin:rotate-entry-token');
    const before = String(tokenManager.getToken());
    const after = String(tokenManager.createToken());

    if (!after) {
      events.publishEvent(PUBSUB_SERVICE_ADMIN_ROTATE_ENTRY_TOKEN, PUBSUB_EVENT_ADMIN_REJECTED_DISABLED, {
        clientId,
      });
      return { ok: false, message: 'Entry path desactive.' };
    }

    if (after === before) {
      events.publishEvent(PUBSUB_SERVICE_ADMIN_ROTATE_ENTRY_TOKEN, PUBSUB_EVENT_ADMIN_UNCHANGED, {
        clientId,
      });
      return { ok: false, message: 'Token non change (mode fixe ou rotation indisponible).' };
    }

    log.info('Token d entree force en rotation');
    events.publishEvent(PUBSUB_SERVICE_ADMIN_ROTATE_ENTRY_TOKEN, PUBSUB_EVENT_ADMIN_ROTATED, {
      clientId,
    });
    return { ok: true, message: 'Token d entree rotation forcee.' };
  };
}
