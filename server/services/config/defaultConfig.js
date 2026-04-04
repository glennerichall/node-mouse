import {
    packageJson
} from "./bootstrapConfig.js";

export const DEFAULT_SYSTEM_CONFIG = {
    port: 3000,
    serverHost: '',
    entryPath: {
        enabled: true,
        fixed: '',
        tokenLength: 24,
        rotateMin: 60,
        graceMin: 60 * 24 * 7, // 1 semaine de grâce
    },
    session: {
        cookieName: 'remote_mouse_session',
        cookieSecret: 'change-me',
        cookieMaxAgeDays: 7,
        socketEventMaxAgeMs: 1200,
    },
    adminActionsEnabled: true,
    serviceName: 'remote-mouse.service',
    updateCheck: {
        checkCommand: '',
        checkTimeoutSec: 20,
        intervalMin: 360,
        packageName: String(packageJson.name || '').trim(),
        currentVersion: String(packageJson.version || '').trim(),
        installCommand: '',
        installTimeoutSec: 600,
    },
    https: {
        enabled: false,
        sslKeyPath: undefined,
        sslCertPath: undefined,
    },
    persistence: {
        dbPath: './data/remote-mouse.db',
    },
};

export const DEFAULT_PERSISTED_CONFIG = {
    input: {
        mouseSpeed: 1.3,
        scrollSpeed: 0.25,
    },
    preview: {
        width: 128,
        height: 84,
        fps: 6,
    },
    notifications: {
        desktop: true,
        client: true,
        ttlMs: 2200,
    },
    samsungTv: {
        enabled: false,
        alwaysAutoResolve: true,
        host: '',
        mac: '',
        port: 8002,
        appName: 'Remote Mouse',
        discoveryTimeoutMs: 2500,
        timeoutMs: 5000,
        pcInputKey: 'KEY_HDMI1',
        pcInputSequence: '',
        powerOffKey: 'KEY_POWER',
    },
    updateCheck: {
        enabled: false,
    },
    qrOverlay: {
        enabled: true,
        size: 75,
        margin: 14,
        topOffsetPx: 32,
    },
    logging: {
        level: 'info',
        format: 'json',
    },
};
