import {createLogger} from '../../application/logger.js';
import {
  REMOTE_EVENT_QR_OPEN_BROWSER_CLIENT,
  REMOTE_EVENT_QR_OPEN_BROWSER_SERVER,
  REMOTE_EVENT_QR_ROTATE_ENTRY_TOKEN,
  REMOTE_EVENT_QR_TOGGLE_OVERLAY,
} from '../../../utils/remoteCommands.js';
import {getClientId, getClientLabel} from '../client-channel.js';

let log;
function getModuleLog() {
  log ??= createLogger('events:qr');
  return log;
}

export function createQrEventSubscriber({qrActions}) {
  const eventLog = getModuleLog();
  return function subscribeQr(channel) {
    const client = getClientLabel(channel);
    const register = (eventName, action) => {
      channel.on(eventName, async (_payload, response) => {
        eventLog.info({client}, `Demande ${eventName}`);
        const result = await action({clientId: getClientId(channel)});
        response?.({
          ok: Boolean(result.ok),
          message: result.message,
        });
      });
    };

    register(REMOTE_EVENT_QR_OPEN_BROWSER_SERVER, qrActions.openQrBrowserServer);
    register(REMOTE_EVENT_QR_OPEN_BROWSER_CLIENT, qrActions.openQrBrowserClient);
    register(REMOTE_EVENT_QR_ROTATE_ENTRY_TOKEN, qrActions.rotateEntryToken);
    register(REMOTE_EVENT_QR_TOGGLE_OVERLAY, qrActions.toggleQrOverlay);
  };
}
