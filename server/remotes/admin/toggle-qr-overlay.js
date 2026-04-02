import {createLogger} from '../../services/log/logger.js';
import {NOTIFIER_LEVEL_INFO, NOTIFIER_TARGET_CLIENT} from '../../services/notifier/createNotifierComposite.js';

const log = createLogger('admin:toggle-qr-overlay');

export function createToggleQrOverlayAction(servicesOrOptions) {
  const getNotifier = servicesOrOptions?.getNotifier
    ? () => servicesOrOptions.getNotifier()
    : () => servicesOrOptions.notifier;
  const getQrOverlay = servicesOrOptions?.getQrOverlay
    ? () => servicesOrOptions.getQrOverlay()
    : () => servicesOrOptions.qrOverlay;

  return async function toggleQrOverlay({ clientId } = {}) {
    const notifier = getNotifier();
    const qrOverlay = getQrOverlay();
    if (!qrOverlay || typeof qrOverlay.toggle !== 'function') {
      return { ok: false, message: 'QR overlay indisponible.' };
    }

    const visible = await qrOverlay.toggle();
    const message = visible
      ? 'QR overlay affiche.'
      : 'QR overlay masque.';

    log.info({ visible }, 'Toggle QR overlay');
    notifier.target(NOTIFIER_TARGET_CLIENT).notify({
      level: NOTIFIER_LEVEL_INFO,
      title: 'QR overlay',
      message,
      ttlMs: 2200,
    }, {
      clientId,
    });

    return { ok: true, message };
  };
}
