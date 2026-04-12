import os from 'node:os';
import {getScreenInfo} from "./getScreenInfo.js";
import {getNetworkInfo} from "./getNetworkInfo.js";

export function createSystemService(services) {
  const getLogger = () => services.getLogger('system');

  return {
    listBrowsers() {
      getLogger().debug('Detection des navigateurs disponibles');
      return services.getRemotes().browser.listBrowsers();
    },
    isVlcAvailable() {
      getLogger().debug('Detection disponibilite VLC');
      return services.getRemotes().vlc.isAvailable();
    },
    getScreenInfo() {
      const screen = getScreenInfo(services);
      getLogger().debug({screen}, 'Detection resolution ecran');
      return screen;
    },
    getNetworkInfo() {
      const network = getNetworkInfo(services);
      getLogger().debug({
        lanIp: network.lanIp,
        publicBaseUrl: network.publicBaseUrl,
        interfaceCount: network.interfaces.length,
      }, 'Detection reseau');
      return network;
    },
    async getInfo() {
      const log = getLogger();
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
