import qrcodeTerminal from 'qrcode-terminal';
import {bootstrapApi} from './init/bootstrapApi.js';
import {logStartupConfig} from './services/config/logConfig.js';
import {bootstrapSocket} from "./init/bootstrapSocket.js";
import {startCliServer} from './cli/startCliServer.js';
import {startConfigObserver} from './init/observers/startConfigObserver.js';
import {startNotificationObserver} from './init/observers/startNotificationObserver.js';
import {startQrOverlayRefreshObserver} from "./init/observers/startQrOverlayRefreshObserver.js";
import { notifyIfRestarted } from './remotes/admin/restart-marker.js';

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
    const serverBundle = getServer();
    const httpServer = serverBundle.server;
    const io = serverBundle.io;
    const qrOverlay = getQrOverlay();
    const taskManager = getTaskManager();
    const tokenManager = getTokenManager();
    const sseService = services.getSseService?.();

    let cliServer = null;
    let shuttingDown = false;
    let stopConfigObserver = () => {};
    let stopNotificationObserver = () => {};
    let stopQrOverlayRefreshObserver = () => {};

    function logStartupUrls(urls) {
        const entries = [
            ['Entree mobile', urls.entryUrl],
            ['QR', urls.qrUrl],
            ['Admin config', urls.adminConfigUrl],
            ['Server info', urls.serverInfoUrl],
            ['Health', urls.healthUrl],
            ['Entree locale', urls.localEntryUrl],
            ['QR local', urls.localQrUrl],
            ['Admin config local', urls.localAdminConfigUrl],
            ['Server info local', urls.localServerInfoUrl],
            ['Health local', urls.localHealthUrl],
        ].filter(([, value]) => Boolean(value));

        console.log('URLs disponibles au demarrage:');
        for (const [label, value] of entries) {
            console.log(`  ${label}: ${value}`);
        }
    }

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
            stopConfigObserver();
        } catch (error) {
            log.error({err: error}, 'Erreur a l arret de l observateur de configuration');
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

        try {
            sseService?.closeAll?.();
        } catch (error) {
            log.error({err: error}, 'Erreur a la fermeture des connexions SSE');
        }

        try {
            await new Promise((resolve) => {
                io?.close?.(() => resolve());
            });
        } catch (error) {
            log.error({err: error}, 'Erreur a la fermeture de Socket.IO');
        }

        try {
            serverBundle.closeIdleConnections?.();
        } catch (error) {
            log.error({err: error}, 'Erreur a la fermeture des connexions HTTP inactives');
        }

        await new Promise((resolve) => {
            const forceShutdownTimer = setTimeout(() => {
                try {
                    serverBundle.destroyConnections?.();
                } catch (error) {
                    log.error({err: error}, 'Erreur a la destruction forcee des connexions HTTP');
                }
            }, 1_500);

            httpServer.close(() => {
                clearTimeout(forceShutdownTimer);
                resolve();
            });
        });

        process.exit(0);
    }

    async function start() {
        stopConfigObserver = startConfigObserver(services);
        stopNotificationObserver = startNotificationObserver(services);
        stopQrOverlayRefreshObserver = startQrOverlayRefreshObserver(services);
        notifyIfRestarted(services.getEvents());

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
                const urls = getUrls();

                logStartupConfig(log, {
                    systemConfig,
                    config,
                });

                log.info({url: urls.entryUrl, qrUrl: urls.qrUrl}, 'Remote Mouse server démarré');
                logStartupUrls(urls);
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

                qrcodeTerminal.generate(urls.entryUrl, {small: true});
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
