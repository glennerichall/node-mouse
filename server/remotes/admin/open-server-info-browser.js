import {getConfig} from '../../init/config/index.js';
import {createLogger} from '../../log/logger.js';
import {
  NOTIFIER_LEVEL_ERROR,
  NOTIFIER_LEVEL_INFO,
  NOTIFIER_TARGET_CLIENT,
  NOTIFIER_TARGET_SERVER,
} from '../../notifier/notifier-composite.js';

const log = createLogger('admin:open-server-info-browser');

export function createOpenServerInfoBrowserAction({ notifier, browser, target = NOTIFIER_TARGET_SERVER }) {
  return async function openServerInfoBrowser({ clientId } = {}) {
    const config = getConfig();
    const isClientTarget = target === NOTIFIER_TARGET_CLIENT;
    const localInfoUrl = `${config.protocol}://127.0.0.1:${config.port}/ui/admin/server-info`;
    const clientInfoUrl = '/ui/admin/server-info';

    if (isClientTarget) {
      log.info({ clientId, clientInfoUrl }, 'Ouverture de la page server info sur le client');
      notifier.target(NOTIFIER_TARGET_CLIENT).notify({
        level: NOTIFIER_LEVEL_INFO,
        title: 'Server info',
        message: 'Page server info ouverte sur le client.',
        ttlMs: 2200,
      }, {
        clientId,
      });
      return {
        ok: true,
        message: 'Page server info ouverte sur le client.',
        openUrl: clientInfoUrl,
      };
    }

    log.info({ localInfoUrl }, 'Ouverture de la page server info sur le serveur');

    const ok = await browser.openUrlOnHost(localInfoUrl);
    if (!ok) {
      notifier.target(NOTIFIER_TARGET_CLIENT).notify({
        level: NOTIFIER_LEVEL_ERROR,
        title: 'Server info',
        message: "Impossible d'ouvrir /ui/admin/server-info sur le serveur.",
        ttlMs: 3200,
      }, {
        clientId,
      });
      return {ok: false, message: "Impossible d'ouvrir server info sur le serveur."};
    }

    notifier.target(NOTIFIER_TARGET_CLIENT).notify({
      level: NOTIFIER_LEVEL_INFO,
      title: 'Server info',
      message: 'Page server info ouverte sur le serveur.',
      ttlMs: 2200,
    }, {
      clientId,
    });
    return {ok: true, message: 'Page server info ouverte sur le serveur.'};
  };
}
