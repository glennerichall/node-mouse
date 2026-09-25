import express from 'express';

import {CONFIG_PATHS} from '../../services/config/configPaths.js';
import {
  adminConfigDefaults,
  adminConfigSchema,
  buildConfigEntry,
  coerceConfigValue,
  getFieldDefinition,
  getManagedConfigSnapshot,
} from './configs.js';

export const adminConfigsRouter = express.Router();

async function getManagedContext(services) {
  const vlcAvailable = await services.getRemotes().vlc.isAvailable();
  const managedPaths = CONFIG_PATHS;
  const schema = adminConfigSchema;
  const defaults = getManagedConfigSnapshot({
    ...adminConfigDefaults,
    vlc: {
      enabled: false,
    },
  }, managedPaths);
  const config = getManagedConfigSnapshot({
    ...services.getConfig(),
    vlc: {
      enabled: vlcAvailable ? services.getConfig()?.vlc?.enabled : false,
    },
  }, managedPaths);

  return {
    managedPaths,
    schema,
    defaults,
    config,
  };
}

  adminConfigsRouter.get('/', async (req, res) => {
    const {services} = req;
    const {
      managedPaths,
      schema,
      defaults,
      config,
    } = await getManagedContext(services);

    res.json({
      configs: managedPaths.map((pathKey) => buildConfigEntry(pathKey, schema, config, defaults)),
      defaults,
      schema,
      managedPaths,
      systemConfig: {
        adminActionsEnabled: Boolean(services.getSystemConfig().adminActionsEnabled),
      },
    });
  });

  adminConfigsRouter.get('/:configId', async (req, res) => {
    const {services} = req;
    const pathKey = String(req.params.configId || '').trim();
    const {
      managedPaths,
      schema,
      defaults,
      config,
    } = await getManagedContext(services);

    if (!managedPaths.includes(pathKey)) {
      res.status(404).json({
        ok: false,
        message: 'Invalid config path.',
      });
      return;
    }

    res.json({
      config: buildConfigEntry(pathKey, schema, config, defaults),
    });
  });

  adminConfigsRouter.patch('/:configId', express.json(), async (req, res) => {
    const {services} = req;
    const pathKey = String(req.params.configId || '').trim();
    const {
      managedPaths,
      schema,
      defaults,
    } = await getManagedContext(services);

    if (!managedPaths.includes(pathKey)) {
      res.status(404).json({
        ok: false,
        message: 'Invalid config path.',
      });
      return;
    }

    const field = getFieldDefinition(schema, pathKey);
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
        services.getConfigService().resetConfig(pathKey);
      } else {
        const nextValue = coerceConfigValue(req.body.value, field);
        services.getConfigService().setConfig(pathKey, nextValue);
      }

      const nextContext = await getManagedContext(services);
      res.json({
        ok: true,
        message: 'Configuration updated.',
        config: buildConfigEntry(pathKey, nextContext.schema, nextContext.config, nextContext.defaults),
      });
    } catch (error) {
      res.status(400).json({
        ok: false,
        message: `Configuration invalide: ${error.message}`,
      });
    }
  });

  adminConfigsRouter.delete('/:configId', async (req, res) => {
    const {services} = req;
    const pathKey = String(req.params.configId || '').trim();
    const {
      managedPaths,
      schema,
      defaults,
    } = await getManagedContext(services);

    if (!managedPaths.includes(pathKey)) {
      res.status(404).json({
        ok: false,
        message: 'Invalid config path.',
      });
      return;
    }

    services.getConfigService().resetConfig(pathKey);
    const nextContext = await getManagedContext(services);
    res.json({
      ok: true,
      message: `${pathKey} reset to default.`,
      config: buildConfigEntry(pathKey, schema, nextContext.config, defaults),
    });
  });
