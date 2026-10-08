import {createLogger} from '../../application/logger.js';
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
    .post(`/open-browser-server`, async (request, response, next) => {
        const client = getClientLabel(request.socket);
        const qrActions = getQrActions(request);
        eventLog.info({client}, `Demande open-browser-server`);
        const result = await qrActions.openQrBrowserServer({clientId: getClientId(request.socket)});
        response.status(200).send({
            ok: Boolean(result.ok),
            message: result.message
        });
    })

    .post(`/open-browser-client`, async (request, response, next) => {
        const client = getClientLabel(request.socket);
        const qrActions = getQrActions(request);
        eventLog.info({client}, `Demande open-browser-client`);
        const result = await qrActions.openQrBrowserClient({clientId: getClientId(request.socket)});
        response.status(200).send({
            ok: Boolean(result.ok),
            message: result.message
        });
    })

    .post(`/rotate-entry-token`, async (request, response, next) => {
        const client = getClientLabel(request.socket);
        const qrActions = getQrActions(request);
        eventLog.info({client}, `Demande rotate-entry-token`);
        const result = await qrActions.rotateEntryToken({clientId: getClientId(request.socket)});
        response.status(200).send({
            ok: Boolean(result.ok),
            message: result.message
        });
    })

    .post(`/toggle-overlay`, async (request, response, next) => {
        const client = getClientLabel(request.socket);
        const qrActions = getQrActions(request);
        eventLog.info({client}, `Demande toggle-overlay`);
        const result = await qrActions.toggleQrOverlay({clientId: getClientId(request.socket)});
        response.status(200).send({
            ok: Boolean(result.ok),
            message: result.message
        });
    });
