import {SamsungTvRemote} from "samsung-tv-remote";

export function createSamsungRemoteGetter({
                                              getConfig,
                                              resolveDeviceConfig,
                                              SamsungTvRemoteClass = SamsungTvRemote,
                                          }) {
    let remotePromise = null;
    let remoteKey = '';

    return async function getRemote() {
        const config = getConfig();
        const nextKey = JSON.stringify({
            alwaysAutoResolve: config.alwaysAutoResolve,
            appName: config.appName,
            host: config.host,
            mac: config.mac,
            port: config.port,
            timeoutMs: config.timeoutMs,
        });

        if (!remotePromise || remoteKey !== nextKey) {
            remoteKey = nextKey;
            remotePromise = (async () => {
                try {
                    const device = await resolveDeviceConfig();
                    return new SamsungTvRemoteClass({
                    device: {
                        ip: device.ip,
                        mac: device.mac,
                    },
                    port: config.port,
                    name: config.appName,
                    timeout: config.timeoutMs,
                    });
                } catch (error) {
                    remotePromise = null;
                    remoteKey = '';
                    throw error;
                }
            })();
        }

        return remotePromise;
    };
}
