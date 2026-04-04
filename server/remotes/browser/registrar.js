import {createLogger} from "../../services/log/logger.js";
import { REMOTE_EVENT_BROWSER_BRAVE } from '../../../utils/shared/remoteCommands.js';

const log = createLogger('browser:remote');


export const createBrowserRegistrar = ({browser}) => {
    return socket => {
        const client = socket.id.slice(0, 8);

        socket.on(REMOTE_EVENT_BROWSER_BRAVE, async () => {
            log.info({client}, `Demande ${REMOTE_EVENT_BROWSER_BRAVE}`);
            await browser.focusOrLaunchBrave();
        });
    }
};
