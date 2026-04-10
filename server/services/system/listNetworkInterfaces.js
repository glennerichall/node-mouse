import os from "node:os";

export function listNetworkInterfaces() {
    let interfaces = {};
    try {
        interfaces = os.networkInterfaces();
    } catch (_error) {
        interfaces = {};
    }
    const entries = [];

    for (const [name, addresses] of Object.entries(interfaces)) {
        for (const address of addresses || []) {
            entries.push({
                name,
                family: String(address.family || ''),
                address: String(address.address || ''),
                internal: Boolean(address.internal),
                mac: String(address.mac || ''),
                netmask: String(address.netmask || ''),
                cidr: String(address.cidr || ''),
            });
        }
    }

    return entries;
}