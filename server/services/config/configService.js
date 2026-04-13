import {deepMerge, setNestedValue} from '../../../utils/object.utils.js';
import {CONFIG_PATHS} from './configPaths.js';
import {DEFAULT_PERSISTED_CONFIG} from './defaultConfig.js';
import {
  PUBSUB_EVENT_CONFIG_DELETED,
  PUBSUB_EVENT_CONFIG_UPDATED,
  PUBSUB_SERVICE_CONFIG,
} from '../pubsub/serviceEventConstants.js';

function isManagedPath(pathKey) {
  return CONFIG_PATHS.includes(pathKey);
}

function getValueAtPath(source, dottedPath) {
  return String(dottedPath || '')
    .split('.')
    .filter(Boolean)
    .reduce((cursor, segment) => (cursor == null ? undefined : cursor[segment]), source);
}

function mapStoredRowsToObject(rows) {
  const config = {};

  for (const row of rows || []) {
    if (!row?.key || !isManagedPath(row.key)) {
      continue;
    }

    setNestedValue(config, row.key, row.value);
  }

  return config;
}

export function createConfigService(services) {
  function getStoredConfigObject() {
    const rows = services.getPersistence().configDao.getAll();
    return mapStoredRowsToObject(rows);
  }

  function publishChange(changeType, changedKeys) {
    const uniqueChangedKeys = Array.from(new Set(changedKeys));
    services.getPubSub().publish(PUBSUB_SERVICE_CONFIG, {
      changeType,
      changedKeys: uniqueChangedKeys,
      storedConfig: getStoredConfigObject(),
    }, {
      type: changeType === 'deleted' ? PUBSUB_EVENT_CONFIG_DELETED : PUBSUB_EVENT_CONFIG_UPDATED,
      snapshot: false,
    });
  }

  return {
    getConfigs() {
      return deepMerge(DEFAULT_PERSISTED_CONFIG, getStoredConfigObject());
    },
    getConfig(pathKey) {
      const normalizedPath = String(pathKey || '').trim();
      if (!normalizedPath) {
        return undefined;
      }

      return getValueAtPath(this.getConfigs(), normalizedPath);
    },
    setConfig(pathKey, value) {
      const normalizedPath = String(pathKey || '').trim();
      if (!isManagedPath(normalizedPath)) {
        throw new Error(`Invalid config path: ${normalizedPath || '(empty)'}`);
      }

      services.getPersistence().configDao.saveOne(normalizedPath, value);
      publishChange('updated', [normalizedPath]);
      return this.getConfig(normalizedPath);
    },
    resetConfig(pathKey) {
      const normalizedPath = String(pathKey || '').trim();
      if (!isManagedPath(normalizedPath)) {
        throw new Error(`Invalid config path: ${normalizedPath || '(empty)'}`);
      }

      const changes = services.getPersistence().configDao.deleteOne(normalizedPath);
      if (changes > 0) {
        publishChange('deleted', [normalizedPath]);
      }

      return this.getConfig(normalizedPath);
    },
  };
}
