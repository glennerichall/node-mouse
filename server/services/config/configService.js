import {deepMerge} from '../../../utils/shared/objet.utils.js';
import {CONFIG_PATHS} from './configPaths.js';
import {DEFAULT_PERSISTED_CONFIG} from './defaultConfig.js';

export function createConfig(services) {
  return deepMerge(
    DEFAULT_PERSISTED_CONFIG,
    services.getPersistence().configDao.getStoredConfig(CONFIG_PATHS),
  );
}
