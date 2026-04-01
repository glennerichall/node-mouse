import qrcodeTerminal from 'qrcode-terminal';
import {getConfig} from './init/config/index.js';
import {createConfigService} from './init/config/configService.js';
import {createServer} from './init/createServer.js';
import {createApp} from './init/createApp.js';
import {createServices} from './init/createServices.js';
import {createSocket} from './init/createSocket.js';
import {bootstrapLogger, createLogger} from './log/logger.js';
import {logStartupConfig} from './init/config/logConfig.js';

export async function startServer() {
    const configService = createConfigService({loadConfig: getConfig});
    bootstrapLogger(configService);
    const log = createLogger('server', configService);

    let instances = {configService};

    instances = await createServer(instances);
    instances = await createApp(instances);
    instances = await createServices(instances);
    instances = await createSocket(instances);

    const {server, getEntryUrl} = instances;
    const config = configService.get();

    server.listen(config.port, () => {
        logStartupConfig(log);

        log.info({url: getEntryUrl(), qrUrl: '/qr'}, 'Remote Mouse server démarré');
        log.info('Scanner ce QR avec le mobile');

        qrcodeTerminal.generate(getEntryUrl(), {small: true});
    });
}
