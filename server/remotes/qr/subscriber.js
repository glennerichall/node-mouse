import {createLogger} from '../../application/logger.js';
import {createSocketActionResponder} from '../../connection/socket/socket-action-responder.js';
import {
  REMOTE_EVENT_QR_OPEN_BROWSER_CLIENT,
  REMOTE_EVENT_QR_OPEN_BROWSER_SERVER,
  REMOTE_EVENT_QR_ROTATE_ENTRY_TOKEN,
  REMOTE_EVENT_QR_TOGGLE_OVERLAY,
} from '../../../utils/remoteCommands.js';
import {getClientId, getClientLabel} from '../../connection/client-channel.js';

let log;
function getModuleLog() {
  log ??= createLogger('events:qr');
  return log;
}

export function createQrEventSubscriber({qrActions}) {
  const eventLog = getModuleLog();
  return function subscribeQr(channel) {
    const client = getClientLabel(channel);
    const respond = createSocketActionResponder({socket: channel});
    const register = (eventName, actionName, action) => {
      channel.on(eventName, async () => {
        eventLog.info({client}, `Demande ${eventName}`);
        respond(actionName, await action({clientId: getClientId(channel)}));
      });
    };

    register(REMOTE_EVENT_QR_OPEN_BROWSER_SERVER, 'open-qr-browser-server', qrActions.openQrBrowserServer);
    register(REMOTE_EVENT_QR_OPEN_BROWSER_CLIENT, 'open-qr-browser-client', qrActions.openQrBrowserClient);
    register(REMOTE_EVENT_QR_ROTATE_ENTRY_TOKEN, 'rotate-entry-token', qrActions.rotateEntryToken);
    register(REMOTE_EVENT_QR_TOGGLE_OVERLAY, 'toggle-qr-overlay', qrActions.toggleQrOverlay);
  };
}
