import {createLogger} from '../../application/logger.js';
import {
    REMOTE_EVENT_QR_OPEN_BROWSER_CLIENT,
    REMOTE_EVENT_QR_OPEN_BROWSER_SERVER,
    REMOTE_EVENT_QR_ROTATE_ENTRY_TOKEN,
    REMOTE_EVENT_QR_TOGGLE_OVERLAY,
} from '../../../utils/remoteCommands.js';
import {
    getClientId,
    getClientLabel
} from '../client-channel.js';

let log;

function getModuleLog() {
    log ??= createLogger('events:qr');
    return log;
}

export function createQrEventSubscriber({qrActions}) {
    const eventLog = getModuleLog();
    return function subscribeQr(channel) {
        const client = getClientLabel(channel);

        channel
            .on(REMOTE_EVENT_QR_OPEN_BROWSER_SERVER, async (_payload, response) => {
                eventLog.info({client}, `Demande ${REMOTE_EVENT_QR_OPEN_BROWSER_SERVER}`);
                const result = await qrActions.openQrBrowserServer({clientId: getClientId(channel)});
                response({
                    ok: Boolean(result.ok),
                    message: result.message
                });
            })

            .on(REMOTE_EVENT_QR_OPEN_BROWSER_CLIENT, async (_payload, response) => {
                eventLog.info({client}, `Demande ${REMOTE_EVENT_QR_OPEN_BROWSER_CLIENT}`);
                const result = await qrActions.openQrBrowserClient({clientId: getClientId(channel)});
                response({
                    ok: Boolean(result.ok),
                    message: result.message
                });
            })

            .on(REMOTE_EVENT_QR_ROTATE_ENTRY_TOKEN, async (_payload, response) => {
                eventLog.info({client}, `Demande ${REMOTE_EVENT_QR_ROTATE_ENTRY_TOKEN}`);
                const result = await qrActions.rotateEntryToken({clientId: getClientId(channel)});
                response({
                    ok: Boolean(result.ok),
                    message: result.message
                });
            })

            .on(REMOTE_EVENT_QR_TOGGLE_OVERLAY, async (_payload, response) => {
                eventLog.info({client}, `Demande ${REMOTE_EVENT_QR_TOGGLE_OVERLAY}`);
                const result = await qrActions.toggleQrOverlay({clientId: getClientId(channel)});
                response({
                    ok: Boolean(result.ok),
                    message: result.message
                });
            });
    };
}
