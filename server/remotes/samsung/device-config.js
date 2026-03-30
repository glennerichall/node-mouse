import {
    getAwakeSamsungDevices,
    getLastConnectedDevice,
} from "samsung-tv-remote";

export function normalizeMac(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-f0-9]/g, '');
}

export function pickSamsungDevice(candidates, config) {
    const requestedHost = String(config.host || '').trim();
    const requestedMac = normalizeMac(config.mac);

    if (requestedHost) {
        const byHost = candidates.find((candidate) => candidate.ip === requestedHost);
        if (byHost) {
            return byHost;
        }
    }

    if (requestedMac) {
        const byMac = candidates.find((candidate) => normalizeMac(candidate.wifiMac) === requestedMac);
        if (byMac) {
            return byMac;
        }
    }

    if (!requestedHost && !requestedMac && candidates.length === 1) {
        return candidates[0];
    }

    return null;
}

export function createSamsungDeviceConfigResolver({
    config,
    log,
    getLastConnectedDeviceFn = getLastConnectedDevice,
    getAwakeSamsungDevicesFn = getAwakeSamsungDevices,
}) {
    return async function resolveDeviceConfig() {
        if (config.host && config.mac) {
            return {
                ip: config.host,
                mac: config.mac,
            };
        }

        const lastDevice = getLastConnectedDeviceFn();
        const discoveredDevices = await getAwakeSamsungDevicesFn(config.discoveryTimeoutMs);
        const candidates = lastDevice ? [lastDevice, ...discoveredDevices] : discoveredDevices;
        const selected = pickSamsungDevice(candidates, config);

        if (!selected) {
            if (!candidates.length) {
                throw new Error('aucune TV Samsung reveillee detectee sur le reseau');
            }

            if (candidates.length > 1) {
                throw new Error('plusieurs TV Samsung detectees, renseignez SAMSUNG_TV_HOST ou SAMSUNG_TV_MAC');
            }

            throw new Error('TV Samsung detectee mais impossible de resoudre host/mac');
        }

        log.info({
            ip: selected.ip,
            name: selected.name,
            model: selected.model,
            wifiMac: selected.wifiMac,
        }, 'TV Samsung detectee automatiquement');

        return {
            ip: selected.ip,
            mac: selected.wifiMac || config.mac,
        };
    };
}
