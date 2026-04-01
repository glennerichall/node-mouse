import express from 'express';

import {CONFIG_PATHS} from '../../init/config/configPaths.js';
import {getConfig} from '../../init/config/index.js';
import {deleteStoredConfig, saveStoredConfig} from '../../persistence/config.dao.js';
import {setNestedValue} from '../../../utils/shared/objet.utils.js';
import {
  adminConfigDefaults,
  adminConfigSchema,
  buildConfigEntry,
  coerceConfigValue,
  getFieldDefinition,
  getManagedConfigSnapshot,
} from './admin-config.shared.js';

export function createAdminConfigsRouter({getConfigSnapshot = getConfig} = {}) {
  const router = express.Router();

  router.get('/', (_req, res) => {
    const config = getManagedConfigSnapshot(getConfigSnapshot(), CONFIG_PATHS);
    res.json({
      configs: CONFIG_PATHS.map((pathKey) => buildConfigEntry(pathKey, adminConfigSchema, config, adminConfigDefaults)),
      defaults: adminConfigDefaults,
      schema: adminConfigSchema,
      managedPaths: CONFIG_PATHS,
    });
  });

  router.get('/:configId', (req, res) => {
    const pathKey = String(req.params.configId || '').trim();
    if (!CONFIG_PATHS.includes(pathKey)) {
      res.status(404).json({
        ok: false,
        message: 'Invalid config path.',
      });
      return;
    }

    const config = getManagedConfigSnapshot(getConfigSnapshot(), CONFIG_PATHS);
    res.json({
      config: buildConfigEntry(pathKey, adminConfigSchema, config, adminConfigDefaults),
    });
  });

  router.patch('/:configId', express.json(), (req, res) => {
    const pathKey = String(req.params.configId || '').trim();
    if (!CONFIG_PATHS.includes(pathKey)) {
      res.status(404).json({
        ok: false,
        message: 'Invalid config path.',
      });
      return;
    }

    const field = getFieldDefinition(adminConfigSchema, pathKey);
    if (!field) {
      res.status(404).json({
        ok: false,
        message: 'Unknown config field.',
      });
      return;
    }

    if (!req.body || !Object.hasOwn(req.body, 'value')) {
      res.status(400).json({
        ok: false,
        message: 'Invalid payload: value expected.',
      });
      return;
    }

    try {
      if (req.body.value === null) {
        deleteStoredConfig([pathKey], CONFIG_PATHS);
      } else {
        const nextValue = coerceConfigValue(req.body.value, field);
        const nextConfig = {};
        setNestedValue(nextConfig, pathKey, nextValue);
        saveStoredConfig(nextConfig, CONFIG_PATHS);
      }

      const config = getManagedConfigSnapshot(getConfigSnapshot(), CONFIG_PATHS);
      res.json({
        ok: true,
        message: 'Configuration updated.',
        config: buildConfigEntry(pathKey, adminConfigSchema, config, adminConfigDefaults),
      });
    } catch (error) {
      res.status(400).json({
        ok: false,
        message: `Configuration invalide: ${error.message}`,
      });
    }
  });

  router.delete('/:configId', (req, res) => {
    const pathKey = String(req.params.configId || '').trim();
    if (!CONFIG_PATHS.includes(pathKey)) {
      res.status(404).json({
        ok: false,
        message: 'Invalid config path.',
      });
      return;
    }

    deleteStoredConfig([pathKey], CONFIG_PATHS);
    const config = getManagedConfigSnapshot(getConfigSnapshot(), CONFIG_PATHS);
    res.json({
      ok: true,
      message: `${pathKey} reset to default.`,
      config: buildConfigEntry(pathKey, adminConfigSchema, config, adminConfigDefaults),
    });
  });

  return router;
}
