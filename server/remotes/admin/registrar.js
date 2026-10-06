import {createLogger} from '../../application/logger.js';
import {createSocketActionResponder} from '../../connection/socket/socket-action-responder.js';
import {getClientId, getClientLabel} from '../../connection/client-channel.js';
import {
  REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_CLIENT,
  REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_SERVER,
  REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_CLIENT,
  REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_SERVER,
  REMOTE_EVENT_ADMIN_ROTATE_ENTRY_TOKEN,
  REMOTE_EVENT_ADMIN_SERVICE_RESTART,
  REMOTE_EVENT_ADMIN_TOGGLE_QR_OVERLAY,
  REMOTE_EVENT_ADMIN_UPDATE_CHECK,
  REMOTE_EVENT_ADMIN_UPDATE_INSTALL,
} from '../../../utils/remoteCommands.js';

let log;
function getModuleLog() {
  log ??= createLogger('events:admin');
  return log;
}

export function createAdminEventRegistrar({adminActions, legacyQrActions}) {
  const log = getModuleLog();
  return function subscribeAdmin(channel) {
    const clientId = getClientId(channel);
    const client = getClientLabel(channel);
    const respondAdminAction = createSocketActionResponder({socket: channel});

    channel.on(REMOTE_EVENT_ADMIN_UPDATE_CHECK, async () => {
      log.info({ client }, `Demande ${REMOTE_EVENT_ADMIN_UPDATE_CHECK}`);
      const result = await adminActions.forceUpdateCheck({ clientId });
      respondAdminAction('update-check', result);
    });

    channel.on(REMOTE_EVENT_ADMIN_UPDATE_INSTALL, async () => {
      log.info({ client }, `Demande ${REMOTE_EVENT_ADMIN_UPDATE_INSTALL}`);
      const result = await adminActions.installUpdate({ clientId });
      respondAdminAction('update-install', result);
    });

    channel.on(REMOTE_EVENT_ADMIN_SERVICE_RESTART, async () => {
      log.info({ client }, `Demande ${REMOTE_EVENT_ADMIN_SERVICE_RESTART}`);
      const result = await adminActions.restartService({ clientId });
      respondAdminAction('service-restart', result);
    });

    channel.on(REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_SERVER, async () => {
      log.info({ client }, `Demande ${REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_SERVER}`);
      const result = await legacyQrActions.openQrBrowserServer({ clientId });
      respondAdminAction('open-qr-browser-server', result);
    });

    channel.on(REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_CLIENT, async () => {
      log.info({ client }, `Demande ${REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_CLIENT}`);
      const result = await legacyQrActions.openQrBrowserClient({ clientId });
      respondAdminAction('open-qr-browser-client', result);
    });

    channel.on(REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_SERVER, async () => {
      log.info({ client }, `Demande ${REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_SERVER}`);
      const result = await adminActions.openServerInfoBrowserServer({ clientId });
      respondAdminAction('open-server-info-browser-server', result);
    });

    channel.on(REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_CLIENT, async () => {
      log.info({ client }, `Demande ${REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_CLIENT}`);
      const result = await adminActions.openServerInfoBrowserClient({ clientId });
      respondAdminAction('open-server-info-browser-client', result);
    });

    channel.on(REMOTE_EVENT_ADMIN_ROTATE_ENTRY_TOKEN, async () => {
      log.info({ client }, `Demande ${REMOTE_EVENT_ADMIN_ROTATE_ENTRY_TOKEN}`);
      const result = await legacyQrActions.rotateEntryToken({ clientId });
      respondAdminAction('rotate-entry-token', result);
    });

    channel.on(REMOTE_EVENT_ADMIN_TOGGLE_QR_OVERLAY, async () => {
      log.info({ client }, `Demande ${REMOTE_EVENT_ADMIN_TOGGLE_QR_OVERLAY}`);
      const result = await legacyQrActions.toggleQrOverlay({ clientId });
      respondAdminAction('toggle-qr-overlay', result);
    });
  };
}
