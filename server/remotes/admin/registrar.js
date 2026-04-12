import {createLogger} from '../../application/logger.js';
import {createSocketActionResponder} from '../../connection/socket/socket-action-responder.js';
import {createAdminEventGuardMiddleware} from './createAdminEventGuardMiddleware.js';
import {
  REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_CLIENT,
  REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_SERVER,
  REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_CLIENT,
  REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_SERVER,
  REMOTE_EVENT_ADMIN_RESULT,
  REMOTE_EVENT_ADMIN_ROTATE_ENTRY_TOKEN,
  REMOTE_EVENT_ADMIN_SERVICE_RESTART,
  REMOTE_EVENT_ADMIN_TOGGLE_QR_OVERLAY,
  REMOTE_EVENT_ADMIN_UPDATE_CHECK,
  REMOTE_EVENT_ADMIN_UPDATE_INSTALL,
} from '../../../utils/shared/remoteCommands.js';

const getLogger = () => createLogger('events:admin');

export function createAdminEventRegistrar({ adminActions, getSystemConfig }) {
  return function registerAdminEvents(socket) {
    const config = getSystemConfig();
    const respondAdminAction = createSocketActionResponder({
      socket,
      eventName: REMOTE_EVENT_ADMIN_RESULT,
    });
    const client = socket.id.slice(0, 8);

    socket.use(createAdminEventGuardMiddleware({
      isAdminActionsEnabled: config.adminActionsEnabled,
      client,
      log: getLogger(),
      respondAdminAction,
    }));

    socket.on(REMOTE_EVENT_ADMIN_UPDATE_CHECK, async () => {
      getLogger().info({ client }, `Demande ${REMOTE_EVENT_ADMIN_UPDATE_CHECK}`);
      const result = await adminActions.forceUpdateCheck({ clientId: socket.id });
      respondAdminAction('update-check', result);
    });

    socket.on(REMOTE_EVENT_ADMIN_UPDATE_INSTALL, async () => {
      getLogger().info({ client }, `Demande ${REMOTE_EVENT_ADMIN_UPDATE_INSTALL}`);
      const result = await adminActions.installUpdate({ clientId: socket.id });
      respondAdminAction('update-install', result);
    });

    socket.on(REMOTE_EVENT_ADMIN_SERVICE_RESTART, async () => {
      getLogger().info({ client }, `Demande ${REMOTE_EVENT_ADMIN_SERVICE_RESTART}`);
      const result = await adminActions.restartService({ clientId: socket.id });
      respondAdminAction('service-restart', result);
    });

    socket.on(REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_SERVER, async () => {
      getLogger().info({ client }, `Demande ${REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_SERVER}`);
      const result = await adminActions.openQrBrowserServer({ clientId: socket.id });
      respondAdminAction('open-qr-browser-server', result);
    });

    socket.on(REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_CLIENT, async () => {
      getLogger().info({ client }, `Demande ${REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_CLIENT}`);
      const result = await adminActions.openQrBrowserClient({ clientId: socket.id });
      respondAdminAction('open-qr-browser-client', result);
    });

    socket.on(REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_SERVER, async () => {
      getLogger().info({ client }, `Demande ${REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_SERVER}`);
      const result = await adminActions.openServerInfoBrowserServer({ clientId: socket.id });
      respondAdminAction('open-server-info-browser-server', result);
    });

    socket.on(REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_CLIENT, async () => {
      getLogger().info({ client }, `Demande ${REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_CLIENT}`);
      const result = await adminActions.openServerInfoBrowserClient({ clientId: socket.id });
      respondAdminAction('open-server-info-browser-client', result);
    });

    socket.on(REMOTE_EVENT_ADMIN_ROTATE_ENTRY_TOKEN, async () => {
      getLogger().info({ client }, `Demande ${REMOTE_EVENT_ADMIN_ROTATE_ENTRY_TOKEN}`);
      const result = await adminActions.rotateEntryToken({ clientId: socket.id });
      respondAdminAction('rotate-entry-token', result);
    });

    socket.on(REMOTE_EVENT_ADMIN_TOGGLE_QR_OVERLAY, async () => {
      getLogger().info({ client }, `Demande ${REMOTE_EVENT_ADMIN_TOGGLE_QR_OVERLAY}`);
      const result = await adminActions.toggleQrOverlay({ clientId: socket.id });
      respondAdminAction('toggle-qr-overlay', result);
    });
  };
}
