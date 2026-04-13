import os from 'node:os';
import {getScreenInfo} from "./getScreenInfo.js";
import {getNetworkInfo} from "./getNetworkInfo.js";
import {createLogger} from '../../application/logger.js';

let log;
function getModuleLog() {
  log ??= createLogger('system');
  return log;
}

export function createSystemService(services) {
  const log = getModuleLog();
  return {
    listBrowsers() {
      log.debug('Detection des navigateurs disponibles');
      return services.getRemotes().browser.listBrowsers();
    },
    isVlcAvailable() {
      log.debug('Detection disponibilite VLC');
      return services.getRemotes().vlc.isAvailable();
    },
    getScreenInfo() {
      const screen = getScreenInfo(services);
      log.debug({screen}, 'Detection resolution ecran');
      return screen;
    },
    getNetworkInfo() {
      const network = getNetworkInfo(services);
      log.debug({
        lanIp: network.lanIp,
        publicBaseUrl: network.publicBaseUrl,
        interfaceCount: network.interfaces.length,
      }, 'Detection reseau');
      return network;
    },
    async getInfo() {
      log.debug('Collecte des capacites serveur');
      const browsers = await this.listBrowsers();
      const vlcAvailable = await this.isVlcAvailable();
      const screen = this.getScreenInfo();
      const network = this.getNetworkInfo();

      log.debug({
        browserCount: browsers.length,
        vlcAvailable,
        screen,
        lanIp: network.lanIp,
      }, 'Capacites serveur collectees');

      return {
        platform: services.getOs().platform,
        hostname: os.hostname(),
        browsers,
        vlc: {
          available: vlcAvailable,
        },
        screen,
        network,
      };
    },
  };
}
