import {createLogger} from '../log/logger.js';

const log = createLogger('admin:toggle-qr-overlay');

export function createToggleQrOverlayAction({ notifier, qrOverlay }) {
  return async function toggleQrOverlay({ clientId } = {}) {
    if (!qrOverlay || typeof qrOverlay.toggle !== 'function') {
      return { ok: false, message: 'QR overlay indisponible.' };
    }

    const visible = await qrOverlay.toggle();
    const message = visible
      ? 'QR overlay affiche.'
      : 'QR overlay masque.';

    log.info({ visible }, 'Toggle QR overlay');
    notifier.notify({
      level: 'info',
      title: 'QR overlay',
      message,
      ttlMs: 2200,
      target: 'client',
      clientId,
    });

    return { ok: true, message };
  };
}
