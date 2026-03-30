import {getConfig} from '../../init/config/index.js';
import {createLogger} from '../../log/logger.js';

const log = createLogger('admin:open-qr-browser');

export function createOpenQrBrowserAction({ notifier, browser, target = 'server' }) {
  return async function openQrBrowser({ clientId } = {}) {
    const config = getConfig();
    const isClientTarget = target === 'client';
    const localQrUrl = `${config.protocol}://127.0.0.1:${config.port}/qr`;
    const clientQrUrl = '/qr';

    if (isClientTarget) {
      log.info({ clientId, clientQrUrl }, 'Ouverture de la page QR sur le client');
      notifier.notify({
        level: 'info',
        title: 'QR',
        message: 'Page QR ouverte sur le client.',
        ttlMs: 2200,
        target: 'client',
        clientId,
      });
      return {
        ok: true,
        message: 'Page QR ouverte sur le client.',
        openUrl: clientQrUrl,
      };
    }

    log.info({ localQrUrl }, 'Ouverture de la page QR sur le serveur');

    const ok = await browser.openUrlOnHost(localQrUrl);
    if (!ok) {
      notifier.notify({
        level: 'error',
        title: 'QR',
        message: "Impossible d'ouvrir le navigateur du serveur sur /qr.",
        ttlMs: 3200,
        target: 'client',
        clientId,
      });
      return {ok: false, message: 'Impossible d’ouvrir /qr sur le serveur.'};
    }

    notifier.notify({
      level: 'info',
      title: 'QR',
      message: 'Page QR ouverte sur le serveur.',
      ttlMs: 2200,
      target: 'client',
      clientId,
    });
    return {ok: true, message: 'Page QR ouverte sur le serveur.'};
  };
}
