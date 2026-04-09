import {ensureApplicationLifecycleState} from './state.js';

export function createApplicationShutdown(services) {
  async function runShutdownStep(label, action) {
    const log = services.getLogger('server');
    try {
      await action();
    } catch (error) {
      log.error({err: error}, label);
    }
  }

  return async function shutdown(signal) {
    const state = ensureApplicationLifecycleState(services);
    const log = services.getLogger('server');
    const serverBundle = services.getServer();
    const httpServer = serverBundle.server;
    const io = serverBundle.io;
    const taskManager = services.getTaskManager();
    const qrOverlay = services.getQrOverlay();
    const sseService = services.getSseService();

    if (state.shuttingDown) {
      return;
    }

    state.shuttingDown = true;
    log.info({signal}, 'Arret du serveur');
    services.getPersistence().restartLogDao?.createLifecycleEvent({
      eventAt: Date.now(),
      eventType: 'stop',
      cause: 'user',
      source: signal ? `signal:${signal}` : 'shutdown',
      status: 'completed',
      details: {
        signal: signal || null,
        graceful: true,
        processUptimeSec: Math.floor(process.uptime()),
      },
    });

    await Promise.allSettled([
      runShutdownStep('Erreur a l arret du task manager', () => taskManager.stop()),
      runShutdownStep('Erreur a l arret de l observateur de configuration', () => state.stopConfigObserver()),
      runShutdownStep('Erreur a l arret de l observateur de notifications', () => state.stopNotificationObserver()),
      runShutdownStep('Erreur a l arret de l observateur du QR overlay', () => state.stopQrOverlayRefreshObserver()),
      runShutdownStep('Erreur a l arret de l observateur du survol QR overlay', () => state.stopQrOverlayHoverObserver()),
      runShutdownStep('Erreur a la fermeture du socket CLI', () => state.cliServer?.close()),
      runShutdownStep('Erreur a la fermeture du QR overlay', () => qrOverlay.close()),
      runShutdownStep('Erreur a la fermeture des connexions SSE', () => sseService?.closeAll?.()),
      runShutdownStep('Erreur a la fermeture de Socket.IO', () => new Promise((resolve) => {
        io?.close?.(() => resolve());
      })),
    ]);

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
  };
}
