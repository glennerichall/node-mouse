import {ensureApplicationLifecycleState} from './state.js';
import {createLogger} from './logger.js';

export function createApplicationShutdown(services) {
  const log = createLogger('server');

  async function runShutdownStep(label, action) {
    try {
      await action();
    } catch (error) {
      log.error({err: error}, label);
    }
  }

  return async function shutdown(signal) {
    const state = ensureApplicationLifecycleState(services);
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
      log.info({signal}, 'Server shutdown requested');
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
      runShutdownStep('Failed to stop task manager', () => taskManager.stop()),
      runShutdownStep('Failed to stop configuration observer', () => state.stopConfigObserver()),
      runShutdownStep('Failed to stop notification observer', () => state.stopNotificationObserver()),
      runShutdownStep('Failed to stop update-manager observer', () => state.stopUpdateManagerLogObserver()),
      runShutdownStep('Failed to stop screen resolution observer', () => state.stopDisplaySizeObserver()),
      runShutdownStep('Failed to stop QR overlay observer', () => state.stopQrOverlayRefreshObserver()),
      runShutdownStep('Failed to stop QR hover observer', () => state.stopQrOverlayHoverObserver()),
      runShutdownStep('Failed to close CLI socket', () => state.cliServer?.close()),
      runShutdownStep('Failed to close QR overlay', () => qrOverlay.close()),
      runShutdownStep('Failed to close desktop controller', () => services.getDesktopController()?.close?.()),
      runShutdownStep('Failed to close SSE connections', () => sseService?.closeAll?.()),
      runShutdownStep('Failed to close Socket.IO', () => new Promise((resolve) => {
        io?.close?.(() => resolve());
      })),
    ]);

    try {
      serverBundle.closeIdleConnections?.();
    } catch (error) {
      log.error({err: error}, 'Failed to close idle HTTP connections');
    }

    await new Promise((resolve) => {
      const forceShutdownTimer = setTimeout(() => {
        try {
          serverBundle.destroyConnections?.();
        } catch (error) {
      log.error({err: error}, 'Failed to force-close remaining HTTP connections');
        }
      }, 1_500);

      httpServer.close(() => {
        clearTimeout(forceShutdownTimer);
        resolve();
      });
    });

    await runShutdownStep('Failed to close persistence database', () =>
      services.getPersistence().close?.());

    process.exit(0);
  };
}
