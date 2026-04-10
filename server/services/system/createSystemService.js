import os from 'node:os';
import {getScreenInfo} from "./getScreenInfo.js";
import {getNetworkInfo} from "./getNetworkInfo.js";

export function createSystemService(services) {
  return {
    listBrowsers() {
      return services.getRemotes().browser.listBrowsers();
    },
    isVlcAvailable() {
      return services.getRemotes().vlc.isAvailable();
    },
    getScreenInfo() {
      return getScreenInfo(services);
    },
    getNetworkInfo() {
      return getNetworkInfo(services);
    },
    async getInfo() {
      return {
        platform: services.getOs().platform,
        hostname: os.hostname(),
        browsers: await this.listBrowsers(),
        vlc: {
          available: await this.isVlcAvailable(),
        },
        screen: this.getScreenInfo(),
        network: this.getNetworkInfo(),
      };
    },
  };
}
