import express from 'express';
import path from 'node:path';

import {CONFIG_PATHS} from '../../init/config/configPaths.js';
import {getManagedConfigSchema} from '../../init/config/configSchema.js';
import {getConfig} from '../../init/config/index.js';
import {saveStoredConfig} from '../../persistence/config.dao.js';
import {setNestedValue} from '../../../utils/shared/objet.utils.js';

function getValueAtPath(source, dottedPath) {
  return String(dottedPath || '')
    .split('.')
    .filter(Boolean)
    .reduce((cursor, segment) => (cursor == null ? undefined : cursor[segment]), source);
}

export function coerceConfigValue(rawValue, field) {
  if (!field) {
    return rawValue;
  }

  if (field.type === 'boolean') {
    return Boolean(rawValue);
  }

  if (field.type === 'integer') {
    const parsed = Number.parseInt(String(rawValue), 10);
    if (!Number.isFinite(parsed)) {
      throw new Error('must be an integer');
    }
    return parsed;
  }

  if (field.type === 'number') {
    const parsed = Number.parseFloat(String(rawValue));
    if (!Number.isFinite(parsed)) {
      throw new Error('must be a number');
    }
    return parsed;
  }

  return String(rawValue ?? '').trim();
}

export function buildManagedConfigPayload(rawValues, schema) {
  const payload = {};

  for (const [sectionKey, section] of Object.entries(schema)) {
    for (const [fieldKey, field] of Object.entries(section.fields)) {
      const pathKey = `${sectionKey}.${fieldKey}`;
      if (!Object.hasOwn(rawValues, pathKey)) {
        continue;
      }
      const coercedValue = coerceConfigValue(rawValues[pathKey], field);
      setNestedValue(payload, pathKey, coercedValue);
    }
  }

  return payload;
}

function getManagedConfigSnapshot(config, managedPaths) {
  const snapshot = {};

  for (const pathKey of managedPaths) {
    setNestedValue(snapshot, pathKey, getValueAtPath(config, pathKey));
  }

  return snapshot;
}

export function createAdminConfigRouter({publicDir, getConfigSnapshot = getConfig} = {}) {
  const router = express.Router();
  const schema = getManagedConfigSchema(CONFIG_PATHS);

  router.get('/', (_req, res) => {
    res.sendFile(path.join(publicDir, 'admin-config.html'));
  });

  router.get('/data', (_req, res) => {
    const config = getManagedConfigSnapshot(getConfigSnapshot(), CONFIG_PATHS);
    res.json({
      config,
      schema,
      managedPaths: CONFIG_PATHS,
    });
  });

  router.post('/data', express.json(), (req, res) => {
    const rawValues = req.body?.values;
    if (!rawValues || typeof rawValues !== 'object' || Array.isArray(rawValues)) {
      res.status(400).json({
        ok: false,
        message: 'Payload invalide: values attendu.',
      });
      return;
    }

    try {
      const nextConfig = buildManagedConfigPayload(rawValues, schema);
      saveStoredConfig(nextConfig, CONFIG_PATHS);
      const config = getManagedConfigSnapshot(getConfigSnapshot(), CONFIG_PATHS);

      res.json({
        ok: true,
        message: 'Configuration enregistree.',
        config,
      });
    } catch (error) {
      res.status(400).json({
        ok: false,
        message: `Configuration invalide: ${error.message}`,
      });
    }
  });

  return router;
}
