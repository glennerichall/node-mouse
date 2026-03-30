import {SamsungTvRemote} from "samsung-tv-remote";

export function createSamsungRemoteGetter({
    config,
    resolveDeviceConfig,
    SamsungTvRemoteClass = SamsungTvRemote,
}) {
    let remotePromise = null;

    return async function getRemote() {
        if (!remotePromise) {
            remotePromise = resolveDeviceConfig()
                .then((device) => new SamsungTvRemoteClass({
                    device: {
                        ip: device.ip,
                        mac: device.mac,
                    },
                    port: config.port,
                    name: config.appName,
                    timeout: config.timeoutMs,
                }))
                .catch((error) => {
                    remotePromise = null;
                    throw error;
                });
        }

        return remotePromise;
    };
}
