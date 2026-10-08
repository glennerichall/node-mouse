import {createLogger} from '../../application/logger.js';
import {REMOTE_EVENT_BROWSER_OPEN} from '../../../utils/remoteCommands.js';
import {getClientLabel} from '../client-channel.js';
import Router from 'router';

let log;

function getModuleLog() {
    log ??= createLogger('browser:remote');
    return log;
}

function isBrowserEnabled(config, browserId) {
    return config?.browser?.enabled !== false && config?.browser?.[browserId] !== false;
}

const eventLog = getModuleLog();
export const browserRouter = Router()
    .post(`/${REMOTE_EVENT_BROWSER_OPEN}`,
        async (request, _response, next) => {
            const browserId = typeof request.body?.browserId === 'string' ? request.body.browserId : 'brave';
            const browser = request.services.getRemotes().browser;
            const getConfig = request.services.getConfig;
            const client = getClientLabel(request.socket);
            
            if (!isBrowserEnabled(getConfig(), browserId)) {
                eventLog.info({client, browserId}, 'Browser ignored: disabled by configuration.');
                next();
                return;
            }
            
            eventLog.info({client, browserId}, `Demande ${REMOTE_EVENT_BROWSER_OPEN}`);
            await browser.focusOrLaunchBrowser(browserId);
            
            next();
        });
