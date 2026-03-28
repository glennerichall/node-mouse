import {createLogger} from '../../log/logger.js';
import {getStartupConfigSnapshot} from '../../init/config.js';
import {createSocketActionResponder} from '../socket/socket-action-responder.js';
import {createAdminEventGuardMiddleware} from './admin.guard.js';

const log = createLogger('events:admin');
const config = getStartupConfigSnapshot();

export function createAdminEventRegistrar({ adminActions }) {
  return function registerAdminEvents(socket) {
    const respondAdminAction = createSocketActionResponder({
      socket,
      eventName: 'admin:result',
    });
    const client = socket.id.slice(0, 8);

    socket.use(createAdminEventGuardMiddleware({
      isAdminActionsEnabled: config.adminActionsEnabled,
      client,
      log,
      respondAdminAction,
    }));

    socket.on('admin:update-check', async () => {
      log.info({ client }, 'Demande admin:update-check');
      const result = await adminActions.forceUpdateCheck({ clientId: socket.id });
      respondAdminAction('update-check', result);
    });

    socket.on('admin:update-install', async () => {
      log.info({ client }, 'Demande admin:update-install');
      const result = await adminActions.installUpdate({ clientId: socket.id });
      respondAdminAction('update-install', result);
    });

    socket.on('admin:service-restart', async () => {
      log.info({ client }, 'Demande admin:service-restart');
      const result = await adminActions.restartService({ clientId: socket.id });
      respondAdminAction('service-restart', result);
    });
  };
}
