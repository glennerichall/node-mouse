import qrcodeTerminal from 'qrcode-terminal';
import {
    getStartupConfigSnapshot,
    logStartupConfig,
} from './init/config.js';
import {createServer} from './init/createServer.js';
import {createApp} from "./init/createApp.js";
import {createServices} from "./init/createServices.js";
import {createSocket} from "./init/createSocket.js";
import {createLogger} from './log/logger.js';

const log = createLogger('server');
const config = getStartupConfigSnapshot();

export async function startServer() {
    let instances = {};

    instances = await createServer(instances);
    instances = await createApp(instances);
    instances = await createServices(instances);
    instances = await createSocket(instances);
    
    const {server, getEntryUrl} = instances;
    
    server.listen(config.port, () => {
        logStartupConfig(log);

        log.info({ url: getEntryUrl(), qrUrl: '/qr' }, 'Remote Mouse server démarré');
        log.info('Scanner ce QR avec le mobile');

        qrcodeTerminal.generate(getEntryUrl(), {small: true});
    });
}
