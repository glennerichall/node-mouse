import {getConfig} from '../../init/config/index.js';
import {createLogger} from '../../log/logger.js';

const log = createLogger('admin:open-server-info-browser');

export function createOpenServerInfoBrowserAction({ notifier, browser, target = 'server' }) {
  return async function openServerInfoBrowser({ clientId } = {}) {
    const config = getConfig();
    const isClientTarget = target === 'client';
    const localInfoUrl = `${config.protocol}://127.0.0.1:${config.port}/admin/server-info`;
    const clientInfoUrl = '/admin/server-info';

    if (isClientTarget) {
      log.info({ clientId, clientInfoUrl }, 'Ouverture de la page server info sur le client');
      notifier.notify({
        level: 'info',
        title: 'Server info',
        message: 'Page server info ouverte sur le client.',
        ttlMs: 2200,
        target: 'client',
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
      notifier.notify({
        level: 'error',
        title: 'Server info',
        message: "Impossible d'ouvrir /admin/server-info sur le serveur.",
        ttlMs: 3200,
        target: 'client',
        clientId,
      });
      return {ok: false, message: "Impossible d'ouvrir server info sur le serveur."};
    }

    notifier.notify({
      level: 'info',
      title: 'Server info',
      message: 'Page server info ouverte sur le serveur.',
      ttlMs: 2200,
      target: 'client',
      clientId,
    });
    return {ok: true, message: 'Page server info ouverte sur le serveur.'};
  };
}
