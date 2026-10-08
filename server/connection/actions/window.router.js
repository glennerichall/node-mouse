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
    
    .post(`/${REMOTE_EVENT_WINDOW_TOGGLE_MAXIMIZE}`, async (request, _response, next) => {
        eventLog.info({client: getClientLabel(request.socket)}, `Demande ${REMOTE_EVENT_WINDOW_TOGGLE_MAXIMIZE}`);
        const windowActions = request.services.getRemotes().windowActions;
        await windowActions.toggleMaximizeMinimize();
        next();
    })

    .post(`/${REMOTE_EVENT_WINDOW_CLOSE}`, async (request, _response, next) => {
        eventLog.info({client: getClientLabel(request.socket)}, `Demande ${REMOTE_EVENT_WINDOW_CLOSE}`);
        const windowActions = request.services.getRemotes().windowActions;
        await windowActions.closeActiveWindow();
        next();
    });
