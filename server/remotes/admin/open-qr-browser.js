import {getConfig} from '../../init/config/index.js';
import {createLogger} from '../../log/logger.js';
import {
  NOTIFIER_LEVEL_ERROR,
  NOTIFIER_LEVEL_INFO,
  NOTIFIER_TARGET_CLIENT,
  NOTIFIER_TARGET_SERVER,
} from '../../notifier/notifier-composite.js';

const log = createLogger('admin:open-qr-browser');

export function createOpenQrBrowserAction({ notifier, browser, target = NOTIFIER_TARGET_SERVER }) {
  return async function openQrBrowser({ clientId } = {}) {
    const config = getConfig();
    const isClientTarget = target === NOTIFIER_TARGET_CLIENT;
    const localQrUrl = `${config.protocol}://127.0.0.1:${config.port}/qr`;
    const clientQrUrl = '/qr';

    if (isClientTarget) {
      log.info({ clientId, clientQrUrl }, 'Ouverture de la page QR sur le client');
      notifier.target(NOTIFIER_TARGET_CLIENT).notify({
        level: NOTIFIER_LEVEL_INFO,
        title: 'QR',
        message: 'Page QR ouverte sur le client.',
        ttlMs: 2200,
      }, {
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
      notifier.target(NOTIFIER_TARGET_CLIENT).notify({
        level: NOTIFIER_LEVEL_ERROR,
        title: 'QR',
        message: "Impossible d'ouvrir le navigateur du serveur sur /qr.",
        ttlMs: 3200,
      }, {
        clientId,
      });
      return {ok: false, message: 'Impossible d’ouvrir /qr sur le serveur.'};
    }

    notifier.target(NOTIFIER_TARGET_CLIENT).notify({
      level: NOTIFIER_LEVEL_INFO,
      title: 'QR',
      message: 'Page QR ouverte sur le serveur.',
      ttlMs: 2200,
    }, {
      clientId,
    });
    return {ok: true, message: 'Page QR ouverte sur le serveur.'};
  };
}
