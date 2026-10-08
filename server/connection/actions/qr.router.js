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
import Router from 'router';

let log;

function getModuleLog() {
    log ??= createLogger('events:qr');
    return log;
}

const eventLog = getModuleLog();
const getQrActions = (request) => request.services.getRemotes().qrActions;

export const qrRouter = Router()
    .post(`/${REMOTE_EVENT_QR_OPEN_BROWSER_SERVER}`, async (request, response, next) => {
        const client = getClientLabel(request.socket);
        const qrActions = getQrActions(request);
        eventLog.info({client}, `Demande ${REMOTE_EVENT_QR_OPEN_BROWSER_SERVER}`);
        const result = await qrActions.openQrBrowserServer({clientId: getClientId(request.socket)});
        response.response({
            ok: Boolean(result.ok),
            message: result.message
        });
        next();
    })

    .post(`/${REMOTE_EVENT_QR_OPEN_BROWSER_CLIENT}`, async (request, response, next) => {
        const client = getClientLabel(request.socket);
        const qrActions = getQrActions(request);
        eventLog.info({client}, `Demande ${REMOTE_EVENT_QR_OPEN_BROWSER_CLIENT}`);
        const result = await qrActions.openQrBrowserClient({clientId: getClientId(request.socket)});
        response.response({
            ok: Boolean(result.ok),
            message: result.message
        });
        next();
    })

    .post(`/${REMOTE_EVENT_QR_ROTATE_ENTRY_TOKEN}`, async (request, response, next) => {
        const client = getClientLabel(request.socket);
        const qrActions = getQrActions(request);
        eventLog.info({client}, `Demande ${REMOTE_EVENT_QR_ROTATE_ENTRY_TOKEN}`);
        const result = await qrActions.rotateEntryToken({clientId: getClientId(request.socket)});
        response.response({
            ok: Boolean(result.ok),
            message: result.message
        });
        next();
    })

    .post(`/${REMOTE_EVENT_QR_TOGGLE_OVERLAY}`, async (request, response, next) => {
        const client = getClientLabel(request.socket);
        const qrActions = getQrActions(request);
        eventLog.info({client}, `Demande ${REMOTE_EVENT_QR_TOGGLE_OVERLAY}`);
        const result = await qrActions.toggleQrOverlay({clientId: getClientId(request.socket)});
        response.response({
            ok: Boolean(result.ok),
            message: result.message
        });
        next();
    });
