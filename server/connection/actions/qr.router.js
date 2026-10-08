import Router from 'router';
import {createLogger} from '../../application/logger.js';
import {getClientId, getClientLabel} from '../client-channel.js';

let log;

function getModuleLog() {
    log ??= createLogger('events:qr');
    return log;
}

const eventLog = getModuleLog();
const getQrActions = (request) => request.services.getRemotes().qrActions;

export const qrRouter = Router()
    .post('/browser', async (request, response) => {
        const client = getClientLabel(request.socket);
        eventLog.info({client}, 'Demande browser');
        const result = await getQrActions(request).openQrBrowserServer({clientId: getClientId(request.socket)});
        response.status(result.ok ? 201 : 409).send({ok: Boolean(result.ok), message: result.message});
    })
    .post('/entry-token', async (request, response) => {
        const client = getClientLabel(request.socket);
        eventLog.info({client}, 'Demande entry-token');
        const result = await getQrActions(request).rotateEntryToken({clientId: getClientId(request.socket)});
        response.status(result.ok ? 201 : 400).send({ok: Boolean(result.ok), message: result.message});
    })
    .patch('/overlay', async (request, response) => {
        const client = getClientLabel(request.socket);
        eventLog.info({client}, 'Demande overlay');
        const result = await getQrActions(request).toggleQrOverlay({clientId: getClientId(request.socket)});
        response.status(200).send({ok: Boolean(result.ok), message: result.message});
    });
