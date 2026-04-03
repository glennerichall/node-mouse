import qrcodeTerminal from 'qrcode-terminal';
import {bootstrapApi} from './init/bootstrapApi.js';
import {logStartupConfig} from './services/config/logConfig.js';
import {bootstrapSocket} from "./init/bootstrapSocket.js";
import {startCliServer} from './cli/startCliServer.js';
import {startNotificationObserver} from './services/notifier/startNotificationObserver.js';
import {
    PUBSUB_EVENT_TOKEN_CHANGED,
    PUBSUB_SERVICE_TOKEN_MANAGER
} from './services/pubsub/serviceEventConstants.js';

function startQrOverlayRefreshObserver(services) {
    if (typeof services.getPubSub !== 'function') {
        return () => {};
    }

    const bus = services.getPubSub();
    const qrOverlay = services.getQrOverlay();

    return bus.subscribe(() => void qrOverlay.refresh(), {
        service: PUBSUB_SERVICE_TOKEN_MANAGER,
        type: PUBSUB_EVENT_TOKEN_CHANGED,
    });
}

export function createApplicationLifecycle(services) {
    const {
        getConfig,
        getServer,
        getQrOverlay,
        getSystemConfig,
        getTaskManager,
        getTokenManager,
        getUrls,
        getLogger
    } = services;

    const config = getConfig();
    const systemConfig = getSystemConfig();
    const log = getLogger('server');
    const httpServer = getServer().server;
    const qrOverlay = getQrOverlay();
    const taskManager = getTaskManager();
    const tokenManager = getTokenManager();

    let cliServer = null;
    let shuttingDown = false;
    let stopNotificationObserver = () => {};
    let stopQrOverlayRefreshObserver = () => {};

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
            stopNotificationObserver();
        } catch (error) {
            log.error({err: error}, 'Erreur a l arret de l observateur de notifications');
        }

        try {
            stopQrOverlayRefreshObserver();
        } catch (error) {
            log.error({err: error}, 'Erreur a l arret de l observateur du QR overlay');
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

    async function start() {
        stopNotificationObserver = startNotificationObserver(services);
        stopQrOverlayRefreshObserver = startQrOverlayRefreshObserver(services);

        tokenManager.createToken();

        bootstrapApi(services);
        bootstrapSocket(services);

        process.once('SIGINT', () => {
            void shutdown('SIGINT');
        });
        process.once('SIGTERM', () => {
            void shutdown('SIGTERM');
        });

        await new Promise((resolve) => {
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
                resolve();
            });
        });

        return {
            shutdown,
        };
    }

    return {
        start,
        shutdown,
    };
}
