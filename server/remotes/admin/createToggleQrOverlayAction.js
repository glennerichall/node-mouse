import {createLogger} from '../../application/logger.js';
import {
  PUBSUB_EVENT_ADMIN_TOGGLED,
  PUBSUB_SERVICE_ADMIN_TOGGLE_QR_OVERLAY,
} from '../../services/pubsub/serviceEventConstants.js';

const getLogger = () => createLogger('admin:toggle-qr-overlay');

export function createToggleQrOverlayAction(services) {
  const getEvents = services.getEvents;
  const getQrOverlay = services.getQrOverlay;

  return async function toggleQrOverlay({ clientId } = {}) {
    const events = getEvents();
    const qrOverlay = getQrOverlay();
    if (!qrOverlay || typeof qrOverlay.toggle !== 'function') {
      return { ok: false, message: 'QR overlay indisponible.' };
    }

    const visible = await qrOverlay.toggle();
    const message = visible
      ? 'QR overlay affiche.'
      : 'QR overlay masque.';

    getLogger().info({ visible }, 'Toggle QR overlay');
    events.publishEvent(PUBSUB_SERVICE_ADMIN_TOGGLE_QR_OVERLAY, PUBSUB_EVENT_ADMIN_TOGGLED, {
      clientId,
      visible,
    });

    return { ok: true, message };
  };
}
