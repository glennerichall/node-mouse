import {createLogger} from "../../application/logger.js";
import { REMOTE_EVENT_BROWSER_OPEN } from '../../../utils/shared/remoteCommands.js';

const getLogger = () => createLogger('browser:remote');

function isBrowserEnabled(config, browserId) {
    return config?.browser?.enabled !== false && config?.browser?.[browserId] !== false;
}

export const createBrowserRegistrar = ({browser, getConfig = () => ({})}) => {
    return socket => {
        const client = socket.id.slice(0, 8);

        socket.on(REMOTE_EVENT_BROWSER_OPEN, async (payload = {}) => {
            const browserId = typeof payload?.browserId === 'string' ? payload.browserId : 'brave';
            if (!isBrowserEnabled(getConfig(), browserId)) {
                getLogger().info({client, browserId}, 'Browser ignore: desactive par configuration.');
                return;
            }
            getLogger().info({client, browserId}, `Demande ${REMOTE_EVENT_BROWSER_OPEN}`);
            await browser.focusOrLaunchBrowser(browserId);
        });
    }
};
