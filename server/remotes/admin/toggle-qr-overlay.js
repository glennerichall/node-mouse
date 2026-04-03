import {createLogger} from '../../services/log/logger.js';
import {
  PUBSUB_EVENT_ADMIN_TOGGLED,
  PUBSUB_SERVICE_ADMIN_TOGGLE_QR_OVERLAY,
} from '../../services/pubsub/serviceEventConstants.js';

const log = createLogger('admin:toggle-qr-overlay');

export function createToggleQrOverlayAction(servicesOrOptions) {
  const getEvents = servicesOrOptions?.getEvents
    ? () => servicesOrOptions.getEvents()
    : () => servicesOrOptions.events;
  const getQrOverlay = servicesOrOptions?.getQrOverlay
    ? () => servicesOrOptions.getQrOverlay()
    : () => servicesOrOptions.qrOverlay;

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

    log.info({ visible }, 'Toggle QR overlay');
    events.publishEvent(PUBSUB_SERVICE_ADMIN_TOGGLE_QR_OVERLAY, PUBSUB_EVENT_ADMIN_TOGGLED, {
      clientId,
      visible,
    });

    return { ok: true, message };
  };
}
