import {createLogger} from '../../services/log/logger.js';
import {
  NOTIFIER_TARGET_CLIENT,
  NOTIFIER_TARGET_SERVER,
} from '../../services/notifier/createNotifierComposite.js';
import {
  PUBSUB_EVENT_ADMIN_CLIENT_OPENED,
  PUBSUB_EVENT_ADMIN_SERVER_OPEN_FAILED,
  PUBSUB_EVENT_ADMIN_SERVER_OPENED,
  PUBSUB_SERVICE_ADMIN_OPEN_SERVER_INFO_BROWSER,
} from '../../services/pubsub/serviceEventConstants.js';

const getLogger = () => createLogger('admin:open-server-info-browser');

export function createOpenServerInfoBrowserAction(services, options = {}) {
  const browser = options.browser;
  const target = options.target || NOTIFIER_TARGET_SERVER;

  return async function openServerInfoBrowser({ clientId } = {}) {
    const events = services.getEvents();
    const isClientTarget = target === NOTIFIER_TARGET_CLIENT;
    const clientInfoUrl = '/ui/admin/server-info';

    if (isClientTarget) {
      getLogger().info({ clientId, clientInfoUrl }, 'Ouverture de la page server info sur le client');
      events.publishEvent(PUBSUB_SERVICE_ADMIN_OPEN_SERVER_INFO_BROWSER, PUBSUB_EVENT_ADMIN_CLIENT_OPENED, {
        clientId,
      });
      return {
        ok: true,
        message: 'Page server info ouverte sur le client.',
        openUrl: clientInfoUrl,
      };
    }

    const config = services.getSystemConfig();
    const localInfoUrl = `${config.protocol}://127.0.0.1:${config.port}/ui/admin/server-info`;
    getLogger().info({ localInfoUrl }, 'Ouverture de la page server info sur le serveur');

    const ok = await browser.openUrlOnHost(localInfoUrl);
    if (!ok) {
      events.publishEvent(PUBSUB_SERVICE_ADMIN_OPEN_SERVER_INFO_BROWSER, PUBSUB_EVENT_ADMIN_SERVER_OPEN_FAILED, {
        clientId,
      });
      return {ok: false, message: "Impossible d'ouvrir server info sur le serveur."};
    }

    events.publishEvent(PUBSUB_SERVICE_ADMIN_OPEN_SERVER_INFO_BROWSER, PUBSUB_EVENT_ADMIN_SERVER_OPENED, {
      clientId,
    });
    return {ok: true, message: 'Page server info ouverte sur le serveur.'};
  };
}
