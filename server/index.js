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
    const tokenManager = services.getTokenManager();

    tokenManager.createToken();
    
    bootstrapApi(services);
    bootstrapSocket(services);

    const {
        getConfig,
        getServer,
        getQrOverlay,
        getSystemConfig,
        getTaskManager,
        getUrls,
        getLogger
    } = services;
    
    const config = getConfig();
    const systemConfig = getSystemConfig();

    bootstrapLogger(getConfig);
    
    const log = getLogger('server');
    const httpServer = getServer().server;
    const qrOverlay = getQrOverlay();
    const taskManager = getTaskManager();
    let cliServer = null;
    let shuttingDown = false;

    tokenManager.onTokenChanged(() => {
        void qrOverlay.refresh();
    });

    async function shutdown(signal) {
        if (shuttingDown) {
            return;
        }

        shuttingDown = true;
        log.info({signal}, 'Arret du serveur');

        try {
            taskManager.stop();
        } catch (error) {
            log.error({err: error}, 'Erreur a l arret du task manager');
        }

        try {
            cliServer?.close();
        } catch (error) {
            log.error({err: error}, 'Erreur a la fermeture du socket CLI');
        }

        try {
            qrOverlay.close();
        } catch (error) {
            log.error({err: error}, 'Erreur a la fermeture du QR overlay');
        }

        await new Promise((resolve) => {
            httpServer.close(() => resolve());
        });

        process.exit(0);
    }

    process.once('SIGINT', () => {
        void shutdown('SIGINT');
    });
    process.once('SIGTERM', () => {
        void shutdown('SIGTERM');
    });
    
    httpServer.listen(systemConfig.port, async () => {
        logStartupConfig(log, {
            systemConfig,
            config,
        });

        log.info({url: getUrls().entryUrl, qrUrl: '/qr'}, 'Remote Mouse server démarré');
        log.info('Scanner ce QR avec le mobile');

        if (getConfig().qrOverlay?.enabled) {
            await qrOverlay.show();
        }

        await taskManager.start();

        try {
            cliServer = await startCliServer(services);
        } catch (error) {
            log.error({err: error}, 'Erreur au démarrage de l interface CLI locale');
        }

        qrcodeTerminal.generate(getUrls().entryUrl, {small: true});
    });
}
