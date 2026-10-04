import {createLogger} from '../../application/logger.js';
import {createSocketActionResponder} from '../../connection/socket/socket-action-responder.js';
import {
  REMOTE_EVENT_QR_OPEN_BROWSER_CLIENT,
  REMOTE_EVENT_QR_OPEN_BROWSER_SERVER,
  REMOTE_EVENT_QR_ROTATE_ENTRY_TOKEN,
  REMOTE_EVENT_QR_TOGGLE_OVERLAY,
} from '../../../utils/remoteCommands.js';

let log;
function getModuleLog() {
  log ??= createLogger('events:qr');
  return log;
}

export function createQrEventRegistrar({qrActions}) {
  const eventLog = getModuleLog();
  return function registerQrEvents(socket) {
    const client = socket.id.slice(0, 8);
    const respond = createSocketActionResponder({socket});
    const register = (eventName, actionName, action) => {
      socket.on(eventName, async () => {
        eventLog.info({client}, `Demande ${eventName}`);
        respond(actionName, await action({clientId: socket.id}));
      });
    };

    register(REMOTE_EVENT_QR_OPEN_BROWSER_SERVER, 'open-qr-browser-server', qrActions.openQrBrowserServer);
    register(REMOTE_EVENT_QR_OPEN_BROWSER_CLIENT, 'open-qr-browser-client', qrActions.openQrBrowserClient);
    register(REMOTE_EVENT_QR_ROTATE_ENTRY_TOKEN, 'rotate-entry-token', qrActions.rotateEntryToken);
    register(REMOTE_EVENT_QR_TOGGLE_OVERLAY, 'toggle-qr-overlay', qrActions.toggleQrOverlay);
  };
}
