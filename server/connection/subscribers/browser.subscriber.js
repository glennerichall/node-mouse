import {createLogger} from "../../application/logger.js";
import { REMOTE_EVENT_BROWSER_OPEN } from '../../../utils/remoteCommands.js';
import {getClientLabel} from '../client-channel.js';

let log;
function getModuleLog() {
    log ??= createLogger('browser:remote');
    return log;
}

function isBrowserEnabled(config, browserId) {
    return config?.browser?.enabled !== false && config?.browser?.[browserId] !== false;
}

export const createBrowserSubscriber = ({browser, getConfig = () => ({})}) => {
    const log = getModuleLog();
    return function subscribeBrowser(channel) {
        const client = getClientLabel(channel);

        channel.on(REMOTE_EVENT_BROWSER_OPEN, async (payload) => {
            const browserId = typeof payload?.browserId === 'string' ? payload.browserId : 'brave';
            if (!isBrowserEnabled(getConfig(), browserId)) {
                log.info({client, browserId}, 'Browser ignored: disabled by configuration.');
                return;
            }
            log.info({client, browserId}, `Demande ${REMOTE_EVENT_BROWSER_OPEN}`);
            await browser.focusOrLaunchBrowser(browserId);
        });
    }
};
