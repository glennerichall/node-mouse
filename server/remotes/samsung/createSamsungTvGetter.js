import { SamsungTvRemote } from 'samsung-tv-remote';
import { pingHost } from '../../utils/network.js';

function isNoAwakeTvError(error) {
  return String(error?.message || error || '').includes('aucune TV Samsung reveillee');
}

function isAmbiguousTvError(error) {
  return String(error?.message || error || '').includes('plusieurs TV Samsung detectees');
}

export function createSamsungTvGetter({
  getConfig,
  resolveDeviceConfig,
  pingHostFn = pingHost,
  SamsungTvRemoteClass = SamsungTvRemote,
}) {
  let tvPromise = null;
  let tvKey = '';

  return async function getSamsungTv() {
    const config = getConfig();
    const nextKey = JSON.stringify({
      alwaysAutoResolve: config.alwaysAutoResolve,
      appName: config.appName,
      host: config.host,
      mac: config.mac,
      port: config.port,
      timeoutMs: config.timeoutMs,
    });

    if (!tvPromise || tvKey !== nextKey) {
      tvKey = nextKey;
      tvPromise = (async () => {
        try {
          const device = await resolveDeviceConfig();
          const remote = new SamsungTvRemoteClass({
            device: {
              ip: device.ip,
              mac: device.mac,
            },
            port: config.port,
            name: config.appName,
            timeout: config.timeoutMs,
          });

          return {
            device,
            remote,
            async getPowerState() {
              if (!device?.ip) {
                return 'unknown';
              }
              const reachable = await pingHostFn(
                device.ip,
                Math.max(500, Number(config.timeoutMs) || 2000),
              );
              return reachable ? 'on' : 'off';
            },
            async sendKey(key) {
              await remote.sendKey(key);
            },
            async sendKeys(keys) {
              await remote.sendKeys(keys);
            },
            async wakeTV() {
              await remote.wakeTV();
            },
          };
        } catch (error) {
          tvPromise = null;
          tvKey = '';

          return {
            device: null,
            remote: null,
            async getPowerState() {
              if (isNoAwakeTvError(error)) {
                return 'off';
              }
              if (isAmbiguousTvError(error)) {
                return 'unknown';
              }
              return 'unknown';
            },
            async sendKey() {
              throw error;
            },
            async sendKeys() {
              throw error;
            },
            async wakeTV() {
              throw error;
            },
          };
        }
      })();
    }

    return tvPromise;
  };
}
