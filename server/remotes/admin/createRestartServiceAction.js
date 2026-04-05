import {
  PUBSUB_EVENT_ADMIN_STARTED,
  PUBSUB_SERVICE_ADMIN_RESTART_SERVICE,
} from '../../services/pubsub/serviceEventConstants.js';

export function createRestartServiceAction(services) {
  return async function restartService({ clientId } = {}) {
    const events = services.getEvents();
    const config = services.getSystemConfig();
    events.publishEvent(PUBSUB_SERVICE_ADMIN_RESTART_SERVICE, PUBSUB_EVENT_ADMIN_STARTED, {
      clientId,
      serviceName: config.serviceName,
    });

    return services.getApplicationDaemonService().restart({
      cause: 'user',
      source: 'admin-remote',
    });
  };
}
