import {createLogger} from '../../services/log/logger.js';
import {
  PUBSUB_EVENT_ADMIN_COMPLETED,
  PUBSUB_EVENT_ADMIN_FAILED,
  PUBSUB_EVENT_ADMIN_REJECTED_NO_COMMAND,
  PUBSUB_EVENT_ADMIN_STARTED,
  PUBSUB_SERVICE_ADMIN_INSTALL_UPDATE,
} from '../../services/pubsub/serviceEventConstants.js';

const log = createLogger('admin:install-update');

export function createInstallUpdateAction(services) {
  return async function installUpdate({ clientId } = {}) {
    const events = services.getEvents();
    const updateManager = services.getUpdateManager();
    const restartService = services.getRemotes().adminActions.restartService;
    log.info('Début install update');

    events.publishEvent(PUBSUB_SERVICE_ADMIN_INSTALL_UPDATE, PUBSUB_EVENT_ADMIN_STARTED, {
      clientId,
    });

    const result = await updateManager.update();
    if (result?.ok) {
      events.publishEvent(PUBSUB_SERVICE_ADMIN_INSTALL_UPDATE, PUBSUB_EVENT_ADMIN_COMPLETED, {
        clientId,
      });
      const restartResult = await restartService({ clientId });
      if (!restartResult?.ok) {
        return {
          ok: false,
          message: restartResult?.message || 'Installation terminee, mais le redemarrage a echoue.',
        };
      }
      return {
        ok: true,
        message: result.message || 'Installation terminee. Redemarrage demande.',
      };
    }

    if (result?.status === 'no-command') {
      log.warn('Install update impossible: aucune commande disponible');
      events.publishEvent(PUBSUB_SERVICE_ADMIN_INSTALL_UPDATE, PUBSUB_EVENT_ADMIN_REJECTED_NO_COMMAND, {
        clientId,
      });
      return {
        ok: false,
        message: result.message || 'Aucune commande update disponible.',
      };
    }

    events.publishEvent(PUBSUB_SERVICE_ADMIN_INSTALL_UPDATE, PUBSUB_EVENT_ADMIN_FAILED, {
      clientId,
      details: result?.details,
    });

    return { ok: false, message: result?.message || 'Echec installation: Erreur inconnue' };
  };
}
