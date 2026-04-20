import os from 'node:os';
import {getScreenInfo} from "./getScreenInfo.js";
import {getNetworkInfo} from "./getNetworkInfo.js";
import {createLogger} from '../../application/logger.js';
import {BROWSER_CATALOG} from '../../remotes/browser/browserCatalog.js';

let log;
function getModuleLog() {
  log ??= createLogger('system');
  return log;
}

function getConfigSection(config, key) {
  return config?.[key] && typeof config[key] === 'object' ? config[key] : {};
}

function isConfigEnabled(config, key) {
  return getConfigSection(config, key).enabled !== false;
}

function buildApplications({browsers, vlcAvailable}) {
  const installedBrowsers = new Map(
    browsers.map((browser) => [browser.id, browser]),
  );
  const browserApplications = BROWSER_CATALOG.map((browser) => {
    const installedBrowser = installedBrowsers.get(browser.id);
    return {
      id: `browser:${browser.id}`,
      applicationId: browser.id,
      name: browser.name,
      shortLabel: browser.shortLabel,
      kind: 'browser',
      available: Boolean(installedBrowser),
      command: installedBrowser?.command || '',
      app: installedBrowser?.app || '',
      remotes: ['browser'],
    };
  });

  return [
    ...browserApplications,
    {
      id: 'vlc',
      applicationId: 'vlc',
      name: 'VLC media player',
      shortLabel: 'VLC',
      kind: 'media-player',
      available: Boolean(vlcAvailable),
      remotes: ['vlc'],
    },
  ];
}

function buildRemoteCapabilities({applications, config}) {
  const availableBrowserApplicationIds = applications
    .filter((application) => application.kind === 'browser' && application.available)
    .map((application) => application.id);
  const hasBrowserApplication = availableBrowserApplicationIds.length > 0;
  const isVlcAvailable = applications.some(
    (application) => application.applicationId === 'vlc' && application.available,
  );
  const remoteVisibility = [
    {
      id: 'browser',
      labelKey: 'preferences.remote.browser',
      applicationIds: availableBrowserApplicationIds,
      available: hasBrowserApplication,
      enabled: isConfigEnabled(config, 'browser'),
    },
    {
      id: 'keyboard',
      labelKey: 'preferences.remote.keyboard',
      applicationIds: [],
      available: true,
      enabled: isConfigEnabled(config, 'keyboard'),
    },
    {
      id: 'vlc',
      labelKey: 'preferences.remote.vlc',
      applicationIds: isVlcAvailable ? ['vlc'] : [],
      available: isVlcAvailable,
      enabled: isConfigEnabled(config, 'vlc'),
    },
    {
      id: 'preview',
      labelKey: 'preferences.remote.preview',
      applicationIds: [],
      available: true,
      enabled: isConfigEnabled(config, 'preview'),
    },
    {
      id: 'samsung',
      labelKey: 'preferences.remote.samsung',
      applicationIds: [],
      available: true,
      enabled: Boolean(getConfigSection(config, 'samsungTv').enabled),
    },
  ];

  return remoteVisibility.map((remote) => ({
    ...remote,
    inactiveReasons: [
      remote.available ? '' : 'application-unavailable',
      remote.enabled ? '' : 'config-disabled',
    ].filter(Boolean),
  }));
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
    async getScreenInfo() {
      const screen = await getScreenInfo(services);
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
      const applications = buildApplications({browsers, vlcAvailable});
      const allRemotes = buildRemoteCapabilities({
        applications,
        config: services.getConfig(),
      });
      const screen = await this.getScreenInfo();
      const network = this.getNetworkInfo();

      log.debug({
        browserCount: browsers.length,
        vlcAvailable,
        applicationCount: applications.filter((application) => application.available).length,
        remoteCount: allRemotes.filter((remote) => remote.available).length,
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
        applications,
        remotes: allRemotes.filter((remote) => remote.available),
        allRemotes,
        screen,
        network,
      };
    },
  };
}
