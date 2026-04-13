import {createLogger} from "../../application/logger.js";
import { REMOTE_EVENT_BROWSER_OPEN } from '../../../utils/remoteCommands.js';

let log;
function getModuleLog() {
    log ??= createLogger('browser:remote');
    return log;
}

function isBrowserEnabled(config, browserId) {
    return config?.browser?.enabled !== false && config?.browser?.[browserId] !== false;
}

export const createBrowserRegistrar = ({browser, getConfig = () => ({})}) => {
    const log = getModuleLog();
    return socket => {
        const client = socket.id.slice(0, 8);

        socket.on(REMOTE_EVENT_BROWSER_OPEN, async (payload = {}) => {
            const browserId = typeof payload?.browserId === 'string' ? payload.browserId : 'brave';
            if (!isBrowserEnabled(getConfig(), browserId)) {
                log.info({client, browserId}, 'Browser ignore: desactive par configuration.');
                return;
            }
            log.info({client, browserId}, `Demande ${REMOTE_EVENT_BROWSER_OPEN}`);
            await browser.focusOrLaunchBrowser(browserId);
        });
    }
};
