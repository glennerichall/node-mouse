import {createLogger} from '../../log/logger.js';
import {createSocketActionResponder} from '../socket/socket-action-responder.js';

const log = createLogger('events:admin');

export function createAdminEventRegistrar({ adminActions }) {
  return function registerAdminEvents(socket) {
    const respondAdminAction = createSocketActionResponder({
      socket,
      eventName: 'admin:result',
    });

    socket.on('admin:update-check', async () => {
      log.info({ client: socket.id.slice(0, 8) }, 'Demande admin:update-check');
      const result = await adminActions.forceUpdateCheck();
      respondAdminAction('update-check', result);
    });

    socket.on('admin:update-install', async () => {
      log.info({ client: socket.id.slice(0, 8) }, 'Demande admin:update-install');
      const result = await adminActions.installUpdate();
      respondAdminAction('update-install', result);
    });

    socket.on('admin:service-restart', async () => {
      log.info({ client: socket.id.slice(0, 8) }, 'Demande admin:service-restart');
      const result = await adminActions.restartService();
      respondAdminAction('service-restart', result);
    });
  };
}
