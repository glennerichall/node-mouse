import {
    packageJson
} from "./bootstrapConfig.js";
import { BROWSER_CATALOG } from '../../remotes/browser/browserCatalog.js';
import {
    createDefaultNotificationSettings,
    NOTIFICATION_ID_UPDATE_AVAILABLE,
    NOTIFICATION_ID_UPDATE_INSTALL,
    NOTIFICATION_ID_SERVICE_RESTARTED,
    NOTIFICATION_ID_SERVICE_RESTARTING,
    NOTIFICATION_ID_SESSION_CREATED,
} from '../../../utils/shared/notificationSettings.js';

const DEFAULT_NOTIFICATION_SETTINGS = createDefaultNotificationSettings(false);

DEFAULT_NOTIFICATION_SETTINGS[NOTIFICATION_ID_SERVICE_RESTARTING] = {
    host: true,
    client: true,
};
DEFAULT_NOTIFICATION_SETTINGS[NOTIFICATION_ID_SESSION_CREATED] = {
    host: true,
    client: true,
};
DEFAULT_NOTIFICATION_SETTINGS[NOTIFICATION_ID_SERVICE_RESTARTED] = {
    host: true,
    client: true,
};
DEFAULT_NOTIFICATION_SETTINGS[NOTIFICATION_ID_UPDATE_INSTALL] = {
    host: true,
    client: true,
};
DEFAULT_NOTIFICATION_SETTINGS[NOTIFICATION_ID_UPDATE_AVAILABLE] = {
    host: true,
    client: true,
};

const DEFAULT_BROWSER_CONFIG = Object.fromEntries(
    BROWSER_CATALOG.map((browser) => [browser.id, true]),
);

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
    serviceRestartCommand: '',
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
        touchDragHoldMs: 420,
        touchDragStillDistancePx: 8,
    },
    browser: {
        enabled: true,
        ...DEFAULT_BROWSER_CONFIG,
    },
    keyboard: {
        enabled: true,
    },
    preview: {
        enabled: true,
        width: 128,
        height: 84,
        fps: 6,
        hideDelayMs: 10000,
    },
    notifications: {
        ttlMs: 2200,
        ...DEFAULT_NOTIFICATION_SETTINGS,
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
        autoHideOnHover: true,
        hoverEntryMarginPx: 10,
        hoverExitMarginPx: 18,
        hoverShowDelayMs: 5000
    },
    logging: {
        level: 'info',
        format: 'json',
    },
};
