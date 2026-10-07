import {CONFIG_PATHS} from '../../services/config/configPaths.js';
import {
  adminConfigDefaults,
  adminConfigSchema,
  getManagedConfigSnapshot,
} from './configs.js';

/**
 * Builds the context shared by the admin configuration endpoints.
 */
export async function getManagedConfigContext(services) {
  const vlcAvailable = await services.getRemotes().vlc.isAvailable();
  const storedConfig = services.getConfig();
  const managedPaths = CONFIG_PATHS;
  const defaults = getManagedConfigSnapshot({
    ...adminConfigDefaults,
    vlc: {
      enabled: false,
    },
  }, managedPaths);
  const config = getManagedConfigSnapshot({
    ...storedConfig,
    vlc: {
      enabled: vlcAvailable ? storedConfig?.vlc?.enabled : false,
    },
  }, managedPaths);

  return {
    managedPaths,
    schema: adminConfigSchema,
    defaults,
    config,
  };
}
