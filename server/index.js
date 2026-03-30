import qrcodeTerminal from 'qrcode-terminal';
import {
    getConfig,
    
} from './init/config/index.js';
import {createServer} from './init/createServer.js';
import {createApp} from "./init/createApp.js";
import {createServices} from "./init/createServices.js";
import {createSocket} from "./init/createSocket.js";
import {createLogger} from './log/logger.js';
import {logStartupConfig} from "./init/config/logConfig.js";

const log = createLogger('server');
export async function startServer() {
    let instances = {};

    instances = await createServer(instances);
    instances = await createApp(instances);
    instances = await createServices(instances);
    instances = await createSocket(instances);
    
    const {server, getEntryUrl} = instances;
    
    server.listen(getConfig().port, () => {
        logStartupConfig(log);

        log.info({ url: getEntryUrl(), qrUrl: '/qr' }, 'Remote Mouse server démarré');
        log.info('Scanner ce QR avec le mobile');

        qrcodeTerminal.generate(getEntryUrl(), {small: true});
    });
}
