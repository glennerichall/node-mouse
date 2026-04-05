import qrcodeTerminal from 'qrcode-terminal';
import {bootstrapApi} from '../init/bootstrapApi.js';
import {logStartupConfig} from '../services/config/logConfig.js';
import {bootstrapSocket} from '../init/bootstrapSocket.js';
import {startCliServer} from '../cli/startCliServer.js';
import {startConfigObserver} from '../init/observers/startConfigObserver.js';
import {startNotificationObserver} from '../init/observers/startNotificationObserver.js';
import {startQrOverlayRefreshObserver} from '../init/observers/startQrOverlayRefreshObserver.js';
import {notifyIfRestarted} from '../remotes/admin/notifyIfRestarted.js';
import {ensureApplicationLifecycleState} from './state.js';

export function createApplicationStart(services) {
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

  return async function start() {
    const state = ensureApplicationLifecycleState(services);
    const config = services.getConfig();
    const systemConfig = services.getSystemConfig();
    const log = services.getLogger('server');
    const httpServer = services.getServer().server;
    const qrOverlay = services.getQrOverlay();
    const taskManager = services.getTaskManager();
    const tokenManager = services.getTokenManager();

    state.stopConfigObserver = startConfigObserver(services);
    state.stopNotificationObserver = startNotificationObserver(services);
    state.stopQrOverlayRefreshObserver = startQrOverlayRefreshObserver(services);
    notifyIfRestarted(services);

    tokenManager.createToken();

    bootstrapApi(services);
    bootstrapSocket(services);

    process.once('SIGINT', () => {
      void state.shutdown?.('SIGINT');
    });
    process.once('SIGTERM', () => {
      void state.shutdown?.('SIGTERM');
    });

    await new Promise((resolve) => {
      httpServer.listen(systemConfig.port, async () => {
        const urls = services.getUrls();

        logStartupConfig(log, {
          systemConfig,
          config,
        });

        log.info({url: urls.entryUrl, qrUrl: urls.qrUrl}, 'Remote Mouse server démarré');
        logStartupUrls(urls);
        log.info('Scanner ce QR avec le mobile');

        if (services.getConfig().qrOverlay?.enabled) {
          await qrOverlay.show();
        }

        await taskManager.start();

        try {
          state.cliServer = await startCliServer(services);
        } catch (error) {
          log.error({err: error}, 'Erreur au démarrage de l interface CLI locale');
        }

        qrcodeTerminal.generate(urls.entryUrl, {small: true});
        resolve();
      });
    });

    return {
      shutdown: state.shutdown,
    };
  };
}
