import {
  readString,
  resolvePathFromConfigDir,
} from '../../utils/env.js';
import {deepMerge} from '../../../utils/shared/objet.utils.js';
import {CONFIG_DIR} from './bootstrapConfig.js';
import {DEFAULT_SYSTEM_CONFIG} from './defaultConfig.js';
import {getEnvConfig as readEnvConfig} from './envConfig.js';

export function normalizeSystemConfig(defaultSystemConfig) {
  const httpsEnabled = Boolean(defaultSystemConfig?.https?.enabled);

  return {
    ...defaultSystemConfig,
    protocol: httpsEnabled ? 'https' : 'http',
    entryPath: {
      ...defaultSystemConfig.entryPath,
      enabled: Boolean(defaultSystemConfig.entryPath.enabled || defaultSystemConfig.entryPath.fixed),
    },
    session: {
      ...defaultSystemConfig.session,
      cookieSecure: httpsEnabled,
      cookieSecretSet: defaultSystemConfig.session.cookieSecret !== 'change-me',
    },
    https: {
      ...defaultSystemConfig.https,
      sslKeyPath: httpsEnabled ? defaultSystemConfig.https.sslKeyPath : undefined,
      sslCertPath: httpsEnabled ? defaultSystemConfig.https.sslCertPath : undefined,
    },
    persistence: {
      ...defaultSystemConfig.persistence,
      dbPath: resolvePathFromConfigDir(defaultSystemConfig.persistence.dbPath, CONFIG_DIR),
    },
    graphicalDisplay: Boolean(readString('DISPLAY') || readString('WAYLAND_DISPLAY')),
  };
}

export function getStartupSystemConfigSnapshot() {
  return deepMerge(DEFAULT_SYSTEM_CONFIG, readEnvConfig());
}

export function getSystemConfig() {
  return normalizeSystemConfig(getStartupSystemConfigSnapshot());
}
