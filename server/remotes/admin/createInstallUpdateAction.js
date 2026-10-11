import {createLogger} from '../../application/logger.js';
import {
  PUBSUB_EVENT_ADMIN_COMPLETED,
  PUBSUB_EVENT_ADMIN_FAILED,
  PUBSUB_EVENT_ADMIN_REJECTED_NO_COMMAND,
  PUBSUB_EVENT_ADMIN_STARTED,
  PUBSUB_SERVICE_ADMIN_INSTALL_UPDATE,
} from '../../services/pubsub/serviceEventConstants.js';

let log;
function getModuleLog() {
  log ??= createLogger('admin:install-update');
  return log;
}

export function createInstallUpdateAction(services) {
  const log = getModuleLog();
  return async function installUpdate({ clientId } = {}) {
    const events = services.getEvents();
    const updateManager = services.getUpdateManager();
    const restartService = services.getRemotes().adminActions.restartService;
        log.info('Starting update install');

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
        log.warn('Update install unavailable: no command is configured');
      events.publishEvent(PUBSUB_SERVICE_ADMIN_INSTALL_UPDATE, PUBSUB_EVENT_ADMIN_REJECTED_NO_COMMAND, {
        clientId,
      });
      return {
        ok: false,
        message: result.message || 'Aucune commande update disponible.',
      };
    }

    if (result?.rollbackSucceeded) {
      const restartResult = await restartService({clientId});
      const restartMessage = restartResult?.ok
        ? 'Service restart requested.'
        : `Service restart failed: ${restartResult?.message || 'unknown error'}`;
      events.publishEvent(PUBSUB_SERVICE_ADMIN_INSTALL_UPDATE, PUBSUB_EVENT_ADMIN_FAILED, {
        clientId,
        details: result?.details,
        rollbackSucceeded: true,
        rolledBackVersion: result.rolledBackVersion,
      });
      return {
        ok: false,
        message: `Update failed; version ${result.rolledBackVersion} was restored. ${restartMessage}`,
      };
    }

    events.publishEvent(PUBSUB_SERVICE_ADMIN_INSTALL_UPDATE, PUBSUB_EVENT_ADMIN_FAILED, {
      clientId,
      details: result?.details,
    });

    return { ok: false, message: result?.message || 'Echec installation: Erreur inconnue' };
  };
}
