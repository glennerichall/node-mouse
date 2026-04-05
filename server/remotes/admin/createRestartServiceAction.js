import { commandExists, spawnDetached } from '../../utils/process.js';
import { writeRestartMarker } from './notifyIfRestarted.js';
import {
  PUBSUB_EVENT_ADMIN_STARTED,
  PUBSUB_SERVICE_ADMIN_RESTART_SERVICE,
} from '../../services/pubsub/serviceEventConstants.js';

export function createRestartServiceAction(services) {
  return async function restartService({ clientId } = {}) {
    const config = services.getSystemConfig();
    const events = services.getEvents();
    if (!(await commandExists('systemctl'))) {
      return { ok: false, message: 'systemctl indisponible.' };
    }

    writeRestartMarker();
    events.publishEvent(PUBSUB_SERVICE_ADMIN_RESTART_SERVICE, PUBSUB_EVENT_ADMIN_STARTED, {
      clientId,
      serviceName: config.serviceName,
    });

    const spawned = await spawnDetached(
      'bash',
      ['-lc', `sleep 0.8; systemctl --user restart ${config.serviceName}`],
    );
    if (!spawned) {
      return { ok: false, message: 'Impossible de lancer la commande de redemarrage.' };
    }

    return { ok: true, message: `Redemarrage demande pour ${config.serviceName}.` };
  };
}
