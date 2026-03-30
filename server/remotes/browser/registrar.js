import {createLogger} from "../../log/logger.js";

const log = createLogger('browser:remote');


export const createBrowserRegistrar = ({browser}) => {
    return socket => {
        const client = socket.id.slice(0, 8);

        socket.on('browser:brave', async () => {
            log.info({client}, 'Demande browser:brave');
            await browser.focusOrLaunchBrave();
        });
    }
};