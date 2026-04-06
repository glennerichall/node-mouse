import {createLogger} from "../../services/log/logger.js";
import { REMOTE_EVENT_BROWSER_OPEN } from '../../../utils/shared/remoteCommands.js';

const getLogger = () => createLogger('browser:remote');


export const createBrowserRegistrar = ({browser}) => {
    return socket => {
        const client = socket.id.slice(0, 8);

        socket.on(REMOTE_EVENT_BROWSER_OPEN, async (payload = {}) => {
            const browserId = typeof payload?.browserId === 'string' ? payload.browserId : 'brave';
            getLogger().info({client, browserId}, `Demande ${REMOTE_EVENT_BROWSER_OPEN}`);
            await browser.focusOrLaunchBrowser(browserId);
        });
    }
};
