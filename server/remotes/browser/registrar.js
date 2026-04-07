import {createLogger} from "../../services/log/logger.js";
import { REMOTE_EVENT_BROWSER_OPEN } from '../../../utils/shared/remoteCommands.js';

const getLogger = () => createLogger('browser:remote');


export const createBrowserRegistrar = ({browser, getConfig = () => ({})}) => {
    return socket => {
        const client = socket.id.slice(0, 8);

        socket.on(REMOTE_EVENT_BROWSER_OPEN, async (payload = {}) => {
            if (getConfig()?.browser?.enabled === false) {
                getLogger().info({client}, 'Browser remote ignoree: desactivee par configuration.');
                return;
            }

            const browserId = typeof payload?.browserId === 'string' ? payload.browserId : 'brave';
            getLogger().info({client, browserId}, `Demande ${REMOTE_EVENT_BROWSER_OPEN}`);
            await browser.focusOrLaunchBrowser(browserId);
        });
    }
};
