import {createLogger} from '../../application/logger.js';
import {
    REMOTE_EVENT_WINDOW_CLOSE,
    REMOTE_EVENT_WINDOW_TOGGLE_MAXIMIZE
} from '../../../utils/remoteCommands.js';
import {getClientLabel} from '../client-channel.js';
import Router from 'router';

let log;

function getModuleLog() {
    log ??= createLogger('window:remote');
    return log;
}

const eventLog = getModuleLog();
export const windowRouter = Router()
    
    .post(`/toggle-maximize`, async (request, _response, next) => {
        eventLog.info({client: getClientLabel(request.socket)}, `Demande toggle-maximize`);
        const windowActions = request.services.getRemotes().windowActions;
        await windowActions.toggleMaximizeMinimize();
        next();
    })

    .post(`/close`, async (request, _response, next) => {
        eventLog.info({client: getClientLabel(request.socket)}, `Demande close`);
        const windowActions = request.services.getRemotes().windowActions;
        await windowActions.closeActiveWindow();
        next();
    });
