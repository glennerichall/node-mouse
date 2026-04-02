import {createLogger} from '../../services/log/logger.js';
import {createSocketActionResponder} from '../../connection/socket/socket-action-responder.js';
import {createAdminEventGuardMiddleware} from './admin.guard.js';

const log = createLogger('events:admin');

export function createAdminEventRegistrar({ adminActions, getSystemConfig }) {
  return function registerAdminEvents(socket) {
    const config = getSystemConfig();
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

    socket.on('admin:open-qr-browser-server', async () => {
      log.info({ client }, 'Demande admin:open-qr-browser-server');
      const result = await adminActions.openQrBrowserServer({ clientId: socket.id });
      respondAdminAction('open-qr-browser-server', result);
    });

    socket.on('admin:open-qr-browser-client', async () => {
      log.info({ client }, 'Demande admin:open-qr-browser-client');
      const result = await adminActions.openQrBrowserClient({ clientId: socket.id });
      respondAdminAction('open-qr-browser-client', result);
    });

    socket.on('admin:open-server-info-browser-server', async () => {
      log.info({ client }, 'Demande admin:open-server-info-browser-server');
      const result = await adminActions.openServerInfoBrowserServer({ clientId: socket.id });
      respondAdminAction('open-server-info-browser-server', result);
    });

    socket.on('admin:open-server-info-browser-client', async () => {
      log.info({ client }, 'Demande admin:open-server-info-browser-client');
      const result = await adminActions.openServerInfoBrowserClient({ clientId: socket.id });
      respondAdminAction('open-server-info-browser-client', result);
    });

    socket.on('admin:rotate-entry-token', async () => {
      log.info({ client }, 'Demande admin:rotate-entry-token');
      const result = await adminActions.rotateEntryToken({ clientId: socket.id });
      respondAdminAction('rotate-entry-token', result);
    });

    socket.on('admin:toggle-qr-overlay', async () => {
      log.info({ client }, 'Demande admin:toggle-qr-overlay');
      const result = await adminActions.toggleQrOverlay({ clientId: socket.id });
      respondAdminAction('toggle-qr-overlay', result);
    });
  };
}
