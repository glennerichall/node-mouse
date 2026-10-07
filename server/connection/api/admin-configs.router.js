import express from 'express';

import {
    buildConfigEntry,
} from './configs.js';
import {validateConfigPatch} from './config-validation.middleware.js';
import {getManagedConfigContext} from './getManagedConfigContext.js';

export const adminConfigsRouter = express.Router()
    .get('/', async (req, res) => {
        const {services} = req;
        const {
            managedPaths,
            schema,
            defaults,
            config,
        } = await getManagedConfigContext(services);

        res.json({
            configs: managedPaths.map((pathKey) => buildConfigEntry(pathKey, schema, config, defaults)),
            defaults,
            schema,
            managedPaths,
            systemConfig: {
                adminActionsEnabled: Boolean(services.getSystemConfig().adminActionsEnabled),
            },
        });
    })

    .get('/:configId', async (req, res) => {
        const {services} = req;
        const pathKey = String(req.params.configId || '').trim();
        const {
            managedPaths,
            schema,
            defaults,
            config,
        } = await getManagedConfigContext(services);

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
    })

    .patch('/:configId', validateConfigPatch, async (req, res) => {
        const {services} = req;
        const {pathKey, value} = req.configPatch;

        try {
            if (value === null) {
                services.getConfigService().resetConfig(pathKey);
            } else {
                services.getConfigService().setConfig(pathKey, value);
            }

            const nextContext = await getManagedConfigContext(services);
            res.json({
                ok: true,
                message: 'Configuration updated.',
                config: buildConfigEntry(pathKey, nextContext.schema, nextContext.config, nextContext.defaults),
            });
        } catch (error) {
            res.status(400).json({
                ok: false,
                message: 'Configuration invalide.',
            });
        }
    })

    .delete('/:configId', async (req, res) => {
        const {services} = req;
        const pathKey = String(req.params.configId || '').trim();
        const {
            managedPaths,
            schema,
            defaults,
        } = await getManagedConfigContext(services);

        if (!managedPaths.includes(pathKey)) {
            res.status(404).json({
                ok: false,
                message: 'Invalid config path.',
            });
            return;
        }

        services.getConfigService().resetConfig(pathKey);
        const nextContext = await getManagedConfigContext(services);
        res.json({
            ok: true,
            message: `${pathKey} reset to default.`,
            config: buildConfigEntry(pathKey, schema, nextContext.config, defaults),
        });
    });
