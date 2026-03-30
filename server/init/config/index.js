import {
    readString,
    resolvePathFromConfigDir
} from '../../utils/env.js';
import {
    getStoredConfig
} from '../../persistence/config.dao.js';

import {deepMerge} from "../../../utils/shared/objet.utils.js";
import {CONFIG_PATHS} from "./configPaths.js";
import {
    getStartupConfigSnapshot
} from "./getStartupConfigSnapshot.js";
import {
    CONFIG_DIR,
} from "./bootstrapConfig.js";

function normalizeConfig(config) {

    const httpsEnabled = Boolean(config?.https?.enabled);

    return {
        ...config,
        protocol: httpsEnabled ? 'https' : 'http',
        entryPath: {
            ...config.entryPath,
            enabled: Boolean(config.entryPath.enabled || config.entryPath.fixed),
        },
        session: {
            ...config.session,
            cookieSecure: httpsEnabled,
            cookieSecretSet: config.session.cookieSecret !== 'change-me',
            logFormat: config.logging.format,
        },
        https: {
            ...config.https,
            sslKeyPath: httpsEnabled ? config.https.sslKeyPath : undefined,
            sslCertPath: httpsEnabled ? config.https.sslCertPath : undefined,
        },
        persistence: {
            ...config.persistence,
            dbPath: resolvePathFromConfigDir(config.persistence.dbPath, CONFIG_DIR),
        },
        graphicalDisplay: Boolean(readString('DISPLAY') || readString('WAYLAND_DISPLAY')),
    };
}

export function getEnvConfig() {
    return normalizeConfig(getStartupConfigSnapshot());
}

export function getConfig() {
    const startupConfig = getStartupConfigSnapshot();
    const storedConfig = getStoredConfig(CONFIG_PATHS);
    const config = deepMerge(startupConfig, storedConfig);
    return normalizeConfig(config);
}
