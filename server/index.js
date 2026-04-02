import qrcodeTerminal from 'qrcode-terminal';
import {bootstrapApi} from './init/bootstrapApi.js';
import {createServicesRegistry} from './services/createServicesRegistry.js';
import {
    bootstrapLogger,
} from './services/log/logger.js';
import {logStartupConfig} from './services/config/logConfig.js';
import {bootstrapSocket} from "./init/bootstrapSocket.js";
import {startCliServer} from './cli/startCliServer.js';

export async function startServer() {
    const services = await createServicesRegistry();
    
    bootstrapApi(services);
    bootstrapSocket(services);

    const {
        getConfig,
        getServer,
        getSystemConfig,
        getUpdateManager,
        getUrls,
        getLogger
    } = services;
    
    const config = getConfig();
    const systemConfig = getSystemConfig();

    bootstrapLogger({get: () => config});
    
    const log = getLogger('server');
    
    getServer().server.listen(systemConfig.port, () => {
        logStartupConfig(log, {
            systemConfig,
            config,
        });

        log.info({url: getUrls().entryUrl, qrUrl: '/qr'}, 'Remote Mouse server démarré');
        log.info('Scanner ce QR avec le mobile');

        getUpdateManager().start();
        startCliServer(services).catch((error) => {
            log.error({err: error}, 'Erreur au démarrage de l interface CLI locale');
        });

        qrcodeTerminal.generate(getUrls().entryUrl, {small: true});
    });
}
