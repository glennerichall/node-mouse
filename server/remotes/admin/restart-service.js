import { commandExists, spawnDetached } from '../../utils/process.js';
import { writeRestartMarker } from './restart-marker.js';
import {
  PUBSUB_EVENT_ADMIN_STARTED,
  PUBSUB_SERVICE_ADMIN_RESTART_SERVICE,
} from '../../services/pubsub/serviceEventConstants.js';

export function createRestartServiceAction(servicesOrOptions) {
  const getEvents = servicesOrOptions?.getEvents
    ? () => servicesOrOptions.getEvents()
    : () => servicesOrOptions.events;
  const getSystemConfig = servicesOrOptions?.getSystemConfig
    ? () => servicesOrOptions.getSystemConfig()
    : () => servicesOrOptions?.systemConfig;

  return async function restartService({ clientId } = {}) {
    const config = getSystemConfig();
    const events = getEvents();
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
