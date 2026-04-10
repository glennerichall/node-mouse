import os from "node:os";
import {getLanIp} from "../../utils/network.js";
import {listNetworkInterfaces} from "./listNetworkInterfaces.js";

export function getNetworkInfo(services) {
    const systemConfig = services.getSystemConfig();
    const urls = services.getUrls();

    return {
        hostname: os.hostname(),
        protocol: String(systemConfig?.protocol || 'http'),
        port: Number.isFinite(Number(systemConfig?.port)) ? Number(systemConfig.port) : null,
        lanIp: getLanIp(systemConfig?.host || ''),
        publicBaseUrl: urls.publicBaseUrl,
        localBaseUrl: urls.localBaseUrl,
        interfaces: listNetworkInterfaces(),
    };
}