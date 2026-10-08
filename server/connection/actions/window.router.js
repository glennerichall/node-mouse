import {createLogger} from '../../application/logger.js';
import {getClientLabel} from '../client-channel.js';
import Router from 'router';

let log;

function getModuleLog() {
    log ??= createLogger('window:remote');
    return log;
}

const eventLog = getModuleLog();
export const windowRouter = Router()
    
    .post(`/toggle-maximize`, async (request, response) => {
        eventLog.info({client: getClientLabel(request.socket)}, `Demande toggle-maximize`);
        const windowActions = request.services.getRemotes().windowActions;
        await windowActions.toggleMaximizeMinimize();
      response.send({ok: true});
    })

    .post(`/close`, async (request, response) => {
        eventLog.info({client: getClientLabel(request.socket)}, `Demande close`);
        const windowActions = request.services.getRemotes().windowActions;
        await windowActions.closeActiveWindow();
      response.send({ok: true});
    });
