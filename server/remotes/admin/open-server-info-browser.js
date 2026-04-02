import {createLogger} from '../../services/log/logger.js';
import {
  NOTIFIER_LEVEL_ERROR,
  NOTIFIER_LEVEL_INFO,
  NOTIFIER_TARGET_CLIENT,
  NOTIFIER_TARGET_SERVER,
} from '../../services/notifier/createNotifierComposite.js';

const log = createLogger('admin:open-server-info-browser');

export function createOpenServerInfoBrowserAction(servicesOrOptions, options = {}) {
  const getNotifier = servicesOrOptions?.getNotifier
    ? () => servicesOrOptions.getNotifier()
    : () => servicesOrOptions.notifier;
  const browser = options.browser || servicesOrOptions?.browser;
  const target = options.target || servicesOrOptions?.target || NOTIFIER_TARGET_SERVER;
  const getSystemConfig = servicesOrOptions?.getSystemConfig
    ? () => servicesOrOptions.getSystemConfig()
    : () => servicesOrOptions?.systemConfig;

  return async function openServerInfoBrowser({ clientId } = {}) {
    const notifier = getNotifier();
    const isClientTarget = target === NOTIFIER_TARGET_CLIENT;
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

    const config = getSystemConfig();
    const localInfoUrl = `${config.protocol}://127.0.0.1:${config.port}/ui/admin/server-info`;
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
