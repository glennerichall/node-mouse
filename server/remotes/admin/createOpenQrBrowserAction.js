import {createLogger} from '../../services/log/logger.js';
import {
  NOTIFIER_TARGET_CLIENT,
  NOTIFIER_TARGET_SERVER,
} from '../../services/notifier/createNotifierComposite.js';
import {
  PUBSUB_EVENT_ADMIN_CLIENT_OPENED,
  PUBSUB_EVENT_ADMIN_SERVER_OPEN_FAILED,
  PUBSUB_EVENT_ADMIN_SERVER_OPENED,
  PUBSUB_SERVICE_ADMIN_OPEN_QR_BROWSER,
} from '../../services/pubsub/serviceEventConstants.js';

const log = createLogger('admin:open-qr-browser');

function publishClientEvent(events, type, clientId) {
  if (!clientId) {
    return;
  }
  events.publishEvent(PUBSUB_SERVICE_ADMIN_OPEN_QR_BROWSER, type, {
    clientId,
  });
}

export function createOpenQrBrowserAction(services, options = {}) {
  const browser = options.browser;
  const target = options.target || NOTIFIER_TARGET_SERVER;

  return async function openQrBrowser({ clientId } = {}) {
    const events = services.getEvents();
    const isClientTarget = target === NOTIFIER_TARGET_CLIENT;
    const clientQrUrl = '/qr';

    if (isClientTarget) {
      log.info({ clientId, clientQrUrl }, 'Ouverture de la page QR sur le client');
      events.publishEvent(PUBSUB_SERVICE_ADMIN_OPEN_QR_BROWSER, PUBSUB_EVENT_ADMIN_CLIENT_OPENED, {
        clientId,
      });
      return {
        ok: true,
        message: 'Page QR ouverte sur le client.',
        openUrl: clientQrUrl,
      };
    }

    const config = services.getSystemConfig();
    const localQrUrl = `${config.protocol}://127.0.0.1:${config.port}/qr`;
    log.info({ localQrUrl }, 'Ouverture de la page QR sur le serveur');

    const ok = await browser.openUrlOnHost(localQrUrl);
    if (!ok) {
      publishClientEvent(events, PUBSUB_EVENT_ADMIN_SERVER_OPEN_FAILED, clientId);
      return {ok: false, message: 'Impossible d’ouvrir /qr sur le serveur.'};
    }

    publishClientEvent(events, PUBSUB_EVENT_ADMIN_SERVER_OPENED, clientId);
    return {ok: true, message: 'Page QR ouverte sur le serveur.'};
  };
}
