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
        getQrOverlay,
        getSystemConfig,
        getTaskManager,
        getTokenManager,
        getUpdateManager,
        getUrls,
        getLogger
    } = services;
    
    const config = getConfig();
    const systemConfig = getSystemConfig();

    bootstrapLogger({get: () => config});
    
    const log = getLogger('server');
    const httpServer = getServer().server;
    const qrOverlay = getQrOverlay();
    const taskManager = getTaskManager();
    const tokenManager = getTokenManager();
    const updateManager = getUpdateManager();
    let cliServer = null;
    let shuttingDown = false;
    let stopUpdateCheckTask = null;
    let stopTokenRotationTask = null;

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
            stopUpdateCheckTask();
            stopTokenRotationTask();
            taskManager.stopAll();
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

        await updateManager.check();
        stopUpdateCheckTask = taskManager.run(
            () => updateManager.check(),
            Math.max(60_000, Number(getSystemConfig().updateCheck?.intervalMin || 1) * 60_000),
            {name: 'update-check'},
        );

        stopTokenRotationTask = taskManager.run(
            () => tokenManager.rotateIfNeeded(),
            () => tokenManager.getNextRotationDelayMs(),
            {name: 'token-rotation'},
        );

        try {
            cliServer = await startCliServer(services);
        } catch (error) {
            log.error({err: error}, 'Erreur au démarrage de l interface CLI locale');
        }

        qrcodeTerminal.generate(getUrls().entryUrl, {small: true});
    });
}
