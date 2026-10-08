import Router from 'router';
import {createLogger} from '../../application/logger.js';
import {getClientLabel} from '../client-channel.js';

let log;

function getModuleLog() {
    log ??= createLogger('window:remote');
    return log;
}

const eventLog = getModuleLog();
export const windowRouter = Router()
    .patch('/', async (request, response) => {
        eventLog.info({client: getClientLabel(request.socket)}, `Demande toggle-maximize`);
        const windowActions = request.services.getRemotes().windowActions;
        await windowActions.toggleMaximizeMinimize();
        response.send({ok: true});
    })

    .delete('/', async (request, response) => {
        eventLog.info({client: getClientLabel(request.socket)}, `Demande close`);
        const windowActions = request.services.getRemotes().windowActions;
        await windowActions.closeActiveWindow();
        response.status(204).end();
    });
