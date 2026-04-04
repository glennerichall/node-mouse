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

export function getSamsungDeviceMac(candidate) {
    return String(candidate?.wifiMac || candidate?.mac || '').trim();
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
        const byMac = candidates.find((candidate) => normalizeMac(getSamsungDeviceMac(candidate)) === requestedMac);
        if (byMac) {
            return byMac;
        }
    }

    if (!requestedHost && !requestedMac && candidates.length === 1) {
        return candidates[0];
    }

    return null;
}

function buildDeviceKey(candidate) {
    const ip = String(candidate?.ip || '').trim();
    const mac = normalizeMac(getSamsungDeviceMac(candidate));
    return `${ip}|${mac}`;
}

export function discoverSamsungDevices({
                                           getConfig,
                                           getLastConnectedDeviceFn = getLastConnectedDevice,
                                           getAwakeSamsungDevicesFn = getAwakeSamsungDevices,
                                       }) {
    return async function discoverDevices() {
        const config = getConfig();
        const lastDevice = getLastConnectedDeviceFn();
        const discoveredDevices = await getAwakeSamsungDevicesFn(config.discoveryTimeoutMs);
        const merged = lastDevice ? [lastDevice, ...discoveredDevices] : discoveredDevices;
        const seen = new Set();

        return merged.filter((candidate) => {
            const key = buildDeviceKey(candidate);
            if (!key || seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    };
}

export function createSamsungDeviceConfigResolver({
                                                      getConfig,
                                                      getLogger,
                                                      getLastConnectedDeviceFn = getLastConnectedDevice,
                                                      getAwakeSamsungDevicesFn = getAwakeSamsungDevices,
                                                  }) {
    const discoverDevices = discoverSamsungDevices({
        getConfig,
        getLastConnectedDeviceFn,
        getAwakeSamsungDevicesFn,
    });

    return async function resolveDeviceConfig() {
        const config = getConfig();
        if (!config.alwaysAutoResolve && config.host && config.mac) {
            return {
                ip: config.host,
                mac: config.mac,
            };
        }

        const candidates = await discoverDevices();
        const selectionConfig = config.alwaysAutoResolve
            ? {...config, host: '', mac: ''}
            : config;
        const selected = pickSamsungDevice(candidates, selectionConfig);

        if (!selected) {
            if (!candidates.length) {
                throw new Error('aucune TV Samsung reveillee detectee sur le reseau');
            }

            if (candidates.length > 1) {
                throw new Error('plusieurs TV Samsung detectees, renseignez SAMSUNG_TV_HOST ou SAMSUNG_TV_MAC');
            }

            throw new Error('TV Samsung detectee mais impossible de resoudre host/mac');
        }

        getLogger().info({
            ip: selected.ip,
            name: selected.name,
            model: selected.model,
            wifiMac: getSamsungDeviceMac(selected),
        }, 'TV Samsung detectee automatiquement');

        return {
            ip: selected.ip,
            mac: getSamsungDeviceMac(selected) || config.mac,
        };
    };
}
